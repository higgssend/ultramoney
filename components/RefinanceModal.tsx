import React, { useState, useMemo } from 'react';
import { X, RefreshCw, ArrowRight, ShieldAlert, CheckCircle2, Calculator, FileText, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import { useLoans, useSettings } from '../context/StoreContext';
import { Loan, LoanType } from '../types';
import { CustomSelect } from './CustomSelect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RefinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
}

export const RefinanceModal: React.FC<RefinanceModalProps> = ({ isOpen, onClose, loan }) => {
  const { refinanceLoan } = useLoans();
  const { globalCurrency, companySettings } = useSettings();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedNewLoanId, setCompletedNewLoanId] = useState<string | null>(null);

  // Step 1: Debt Unification Params
  const [includeArrears, setIncludeArrears] = useState(true);
  const [customArrearsAmount, setCustomArrearsAmount] = useState<number | string>('0');
  const [discountAmount, setDiscountAmount] = useState<number | string>('0');

  // Step 2: New Credit Terms
  const [newLoanType, setNewLoanType] = useState<LoanType>(loan.loanType || 'Amortizado (Cuota Fija)');
  const [newInterestRate, setNewInterestRate] = useState<number | string>(loan.interestRate || 10);
  const [newInstallments, setNewInstallments] = useState<number | string>(loan.installments || 12);
  const [newFrequency, setNewFrequency] = useState<string>(loan.frequency || loan.paymentFrequency || 'Mensual');
  const [newStartDate, setNewStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Calculated Unified Principal
  const consolidatedCapital = useMemo(() => {
    const base = loan.remainingBalance || 0;
    const extraMora = includeArrears ? (Number(customArrearsAmount) || 0) : 0;
    const desc = Number(discountAmount) || 0;
    return Math.max(0, base + extraMora - desc);
  }, [loan.remainingBalance, includeArrears, customArrearsAmount, discountAmount]);

  // Calculate new payment schedule summary
  const newScheduleSummary = useMemo(() => {
    const principal = consolidatedCapital;
    const rate = Number(newInterestRate) || 0;
    const count = Number(newInstallments) || 1;
    const isRedito = newLoanType.includes('Rédito') || newLoanType.includes('Solo Interés') || newLoanType.includes('Pagaré Abierto');

    let totalToPay = principal;
    let installmentAmount = 0;

    if (isRedito) {
      installmentAmount = Math.round(principal * (rate / 100) * 100) / 100;
      totalToPay = principal + (installmentAmount * count);
    } else {
      const totalInterest = Math.round(principal * (rate / 100) * 100) / 100;
      totalToPay = principal + totalInterest;
      installmentAmount = Math.round((totalToPay / (count > 0 ? count : 1)) * 100) / 100;
    }

    return {
      principal,
      totalToPay,
      installmentAmount,
      totalInterest: Math.max(0, totalToPay - principal)
    };
  }, [consolidatedCapital, newInterestRate, newInstallments, newLoanType]);

  if (!isOpen) return null;

  const handleConfirmRefinance = async () => {
    setIsSubmitting(true);
    try {
      await refinanceLoan(loan.id, {
        clientId: loan.clientId,
        clientName: loan.clientName,
        amount: consolidatedCapital,
        interestRate: Number(newInterestRate),
        durationWeeks: Number(newInstallments),
        installments: Number(newInstallments),
        frequency: newFrequency as Loan['frequency'],
        startDate: newStartDate,
        loanType: newLoanType,
        note: `Refinanciamiento derivado del préstamo original #${loan.id}`
      });

      setCompletedNewLoanId(`REF-${Date.now().toString().slice(-4)}`);
      setStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadAddendumPDF = () => {
    const doc = new jsPDF();
    const companyName = companySettings?.name || 'UltraMoney';

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(companyName.toUpperCase(), 14, 15);
    doc.setFontSize(9);
    doc.text('CONTRATO DE REFINANCIAMIENTO Y UNIFICACIÓN DE DEUDA', 14, 21);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Cliente: ${loan.clientName}`, 14, 41);
    doc.text(`Préstamo Anterior Cancelado: #${loan.id}`, 14, 47);

    doc.setFontSize(11);
    doc.text('TÉRMINOS DEL NUEVO CRÉDITO REFINANCIADO', 14, 58);
    
    autoTable(doc, {
      startY: 63,
      head: [['Concepto', 'Detalle Refinanciado']],
      body: [
        ['Nuevo Capital Unificado', `${globalCurrency} ${consolidatedCapital.toLocaleString()}`],
        ['Modalidad / Tipo', newLoanType],
        ['Tasa de Interés Periódica', `${newInterestRate}%`],
        ['Cuotas Pactadas', `${newInstallments} (${newFrequency})`],
        ['Cuota Periódica Estimada', `${globalCurrency} ${newScheduleSummary.installmentAmount.toLocaleString()}`],
        ['Total General a Pagar', `${globalCurrency} ${newScheduleSummary.totalToPay.toLocaleString()}`],
        ['Fecha Inicio de Pagos', newStartDate]
      ],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    // Signature placeholders
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 35;
    doc.line(20, finalY, 80, finalY);
    doc.text('Firma del Cliente', 35, finalY + 5);

    doc.line(130, finalY, 190, finalY);
    doc.text('Firma del Acreedor / Financiera', 135, finalY + 5);

    doc.save(`Refinanciamiento_${loan.id}_${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-secondary">Asistente de Refinanciamiento</h3>
              <p className="text-xs text-indigo-100">Préstamo original #{loan.id} - {loan.clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-3">
          {[
            { s: 1, title: '1. Deuda Acumulada' },
            { s: 2, title: '2. Nuevas Condiciones' },
            { s: 3, title: '3. Finalización' }
          ].map(st => (
            <div key={st.s} className={`flex-1 text-center font-bold text-xs py-1 rounded-xl transition-all ${step === st.s ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>
              {st.title}
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* STEP 1: DEBT UNIFICATION */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Balance Capital Pendiente Actual</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">{globalCurrency} {(loan.remainingBalance || 0).toLocaleString()}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full">
                  Estado: {loan.status}
                </span>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" /> Consolidación de Deuda Pendiente
                </h4>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={includeArrears} 
                        onChange={e => setIncludeArrears(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded" 
                      />
                      Sumar Intereses Moratorios / Penalidades ($)
                    </label>
                    {includeArrears && (
                      <input 
                        type="number" 
                        value={customArrearsAmount}
                        onChange={e => setCustomArrearsAmount(e.target.value)}
                        className="w-32 px-3 py-1.5 border rounded-lg text-sm font-bold bg-white dark:bg-slate-800 text-right"
                        placeholder="0.00"
                      />
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Descuento / Condonación Especial de Saldo ($)
                    </label>
                    <input 
                      type="number" 
                      value={discountAmount}
                      onChange={e => setDiscountAmount(e.target.value)}
                      className="w-32 px-3 py-1.5 border rounded-lg text-sm font-bold bg-white dark:bg-slate-800 text-right text-rose-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-900 text-white rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-indigo-300 font-bold uppercase">Nuevo Capital Unificado Resultante</p>
                  <p className="text-2xl font-extrabold text-emerald-400">{globalCurrency} {consolidatedCapital.toLocaleString()}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-indigo-400" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancelar</button>
                <button onClick={() => setStep(2)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md">
                  Siguiente: Nuevas Condiciones <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: NEW CREDIT TERMS */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nuevo Método de Amortización</label>
                  <CustomSelect 
                    className="w-full"
                    value={newLoanType}
                    onChange={e => setNewLoanType(e as LoanType)}
                    options={[
                      { value: 'Amortizado (Cuota Fija)', label: 'Amortizado (Cuota Fija / Francés)' },
                      { value: 'Amortizado (Capital Fijo)', label: 'Amortizado (Capital Fijo / Alemán)' },
                      { value: 'Rédito (Solo Interés)', label: 'Rédito (Solo Interés)' },
                      { value: 'Interés Adelantado', label: 'Interés Adelantado' },
                      { value: 'Pagaré / Préstamo Abierto', label: 'Pagaré / Préstamo Abierto' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nueva Tasa de Interés (%)</label>
                  <input 
                    type="number" 
                    value={newInterestRate} 
                    onChange={e => setNewInterestRate(e.target.value)} 
                    className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-white dark:bg-slate-800" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nuevo Plazo (Cantidad de Cuotas)</label>
                  <input 
                    type="number" 
                    value={newInstallments} 
                    onChange={e => setNewInstallments(e.target.value)} 
                    className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-white dark:bg-slate-800" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nueva Frecuencia de Pago</label>
                  <CustomSelect 
                    className="w-full"
                    value={newFrequency}
                    onChange={setNewFrequency}
                    options={[
                      { value: 'Diario', label: 'Diario' },
                      { value: 'Semanal', label: 'Semanal' },
                      { value: 'Quincenal', label: 'Quincenal' },
                      { value: 'Mensual', label: 'Mensual' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha Primer Pago</label>
                  <input 
                    type="date" 
                    value={newStartDate} 
                    onChange={e => setNewStartDate(e.target.value)} 
                    className="w-full px-3 py-2 border rounded-xl text-sm font-bold bg-white dark:bg-slate-800" 
                  />
                </div>
              </div>

              {/* Projections Card */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nueva Cuota Periódica Estimada:</span>
                  <span className="text-lg font-bold text-indigo-300">{globalCurrency} {newScheduleSummary.installmentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Proyectado a Pagar:</span>
                  <span className="text-sm font-bold text-white">{globalCurrency} {newScheduleSummary.totalToPay.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Atrás</button>
                <button 
                  onClick={handleConfirmRefinance} 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md">
                  {isSubmitting ? 'Procesando...' : 'Confirmar y Refinanciar'} <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS & CONTRACT PRINT */}
          {step === 3 && (
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white">¡Refinanciamiento Exitoso!</h4>
                <p className="text-xs text-slate-500 mt-1">El préstamo anterior #{loan.id} fue marcado como <strong>Refinanciado</strong> y se generó el nuevo contrato activo.</p>
              </div>

              <div className="flex justify-center gap-3">
                <button 
                  onClick={downloadAddendumPDF}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md">
                  <FileText className="w-4 h-4" /> Descargar Contrato de Refinanciamiento (PDF)
                </button>
                <button 
                  onClick={onClose}
                  className="px-5 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl">
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
