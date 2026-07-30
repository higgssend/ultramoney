
import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw, DollarSign, Calendar, ChevronLeft, CheckSquare, Square, Layers, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const Simulator: React.FC = () => {
  const navigate = useNavigate();
  const { clients, loans, createLoan, refinanceLoan } = useStore();

  const [activeTab, setActiveTab] = useState<'simulation' | 'refinance'>('simulation');

  // Simulation State
  const [amount, setAmount] = useState(10000);
  const [weeks, setWeeks] = useState(12);
  const [interest, setInterest] = useState(10);
  const [frequency, setFrequency] = useState('Semanal');
  const [type, setType] = useState<'Amortizado' | 'Rédito'>('Amortizado');

  const [result, setResult] = useState({
      installment: 0,
      total: 0,
      totalInterest: 0
  });

  // Refinance / Consolidation State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
  const [newInterestRate, setNewInterestRate] = useState(10);
  const [newDurationWeeks, setNewDurationWeeks] = useState(12);
  const [newFrequency, setNewFrequency] = useState<'Semanal' | 'Quincenal' | 'Mensual' | 'Diario'>('Semanal');

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientActiveLoans = loans.filter(l => l.clientId === selectedClientId && l.status !== 'Pagado' && l.status !== 'Rechazado');

  const consolidatedCapital = selectedLoanIds.reduce((sum, loanId) => {
    const l = loans.find(item => item.id === loanId);
    return sum + (l ? l.remainingBalance : 0);
  }, 0);

  const consolidatedTotalToPay = consolidatedCapital * (1 + (newInterestRate / 100));
  const consolidatedInstallment = consolidatedTotalToPay / newDurationWeeks;

  useEffect(() => {
      let totalToPay = 0;
      let installment = 0;

      if (type === 'Amortizado') {
          const interestAmount = amount * (interest / 100);
          totalToPay = amount + interestAmount;
          installment = totalToPay / weeks;
      } else {
          // Rédito
          const interestAmount = amount * (interest / 100);
          totalToPay = amount;
          installment = interestAmount;
      }

      setResult({
          installment,
          total: totalToPay,
          totalInterest: type === 'Amortizado' ? (amount * (interest/100)) : (amount * (interest/100)) * weeks
      });
  }, [amount, weeks, interest, frequency, type]);

  const toggleLoanSelection = (id: string) => {
    setSelectedLoanIds(prev => prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]);
  };

  const handleConsolidateSubmit = () => {
    if (!selectedClient || selectedLoanIds.length === 0 || consolidatedCapital <= 0) return;

    // Create consolidated loan
    createLoan({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      amount: consolidatedCapital,
      interestRate: newInterestRate,
      durationWeeks: newDurationWeeks,
      frequency: newFrequency,
      startDate: new Date().toISOString().split('T')[0],
      loanType: 'Amortizado',
      nextPaymentDate: new Date().toISOString().split('T')[0],
      loanCategory: 'Refinanciamiento'
    });

    navigate('/prestamos');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Simulador y Consolidación</h2>
                    <p className="text-slate-500 dark:text-slate-400">Simulación de cuotas y consolidación de múltiples préstamos.</p>
                </div>
            </div>
            <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
              <button
                onClick={() => setActiveTab('simulation')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'simulation' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
              >
                Simulador Rápido
              </button>
              <button
                onClick={() => setActiveTab('refinance')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'refinance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
              >
                Consolidar / Refinanciar
              </button>
            </div>
        </div>

        {activeTab === 'simulation' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Monto a Prestar</label>
                      <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                          <input type="number" className="w-full pl-8 pr-4 py-3 border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-lg" 
                              value={amount} onChange={e => setAmount(Number(e.target.value))} />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Interés (%)</label>
                          <input type="number" className="w-full px-4 py-3 border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500" 
                              value={interest} onChange={e => setInterest(Number(e.target.value))} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Duración</label>
                          <input type="number" className="w-full px-4 py-3 border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500" 
                              value={weeks} onChange={e => setWeeks(Number(e.target.value))} disabled={type === 'Rédito'} />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Frecuencia</label>
                          <select className="w-full px-4 py-3 border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                              value={frequency} onChange={e => setFrequency(e.target.value)}>
                              <option>Semanal</option>
                              <option>Quincenal</option>
                              <option>Mensual</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tipo</label>
                          <select className="w-full px-4 py-3 border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                              value={type} onChange={e => setType(e.target.value as any)}>
                              <option value="Amortizado">Amortizado</option>
                              <option value="Rédito">Rédito</option>
                          </select>
                      </div>
                  </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white flex flex-col justify-center shadow-xl shadow-indigo-500/30">
                  <div className="text-center mb-8">
                      <p className="text-indigo-200 font-bold uppercase tracking-wider text-sm mb-2">
                          {type === 'Amortizado' ? 'Cuota Fija Estimada' : 'Interés Periódico'}
                      </p>
                      <div className="text-5xl font-bold tracking-tight">
                          ${result.installment.toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </div>
                      <p className="text-sm mt-2 opacity-80">Pagadero {frequency.toLowerCase()}</p>
                  </div>

                  <div className="space-y-4 border-t border-white/10 pt-6">
                      <div className="flex justify-between items-center">
                          <span className="text-indigo-100">Total a Devolver</span>
                          <span className="font-bold text-xl">${result.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-indigo-100">Ganancia (Interés)</span>
                          <span className="font-bold text-emerald-300">+${result.totalInterest.toLocaleString()}</span>
                      </div>
                  </div>
              </div>
          </div>
        ) : (
          /* Consolidation View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Selecciona Cliente</label>
                <select
                  value={selectedClientId}
                  onChange={e => { setSelectedClientId(e.target.value); setSelectedLoanIds([]); }}
                  className="w-full px-4 py-3 border rounded-xl font-bold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.cedula})</option>
                  ))}
                </select>
              </div>

              {selectedClientId && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Préstamos Activos para Consolidar</label>
                  {clientActiveLoans.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl">Este cliente no tiene préstamos activos para consolidar.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {clientActiveLoans.map(l => (
                        <div
                          key={l.id}
                          onClick={() => toggleLoanSelection(l.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${selectedLoanIds.includes(l.id) ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-white border-slate-200 text-slate-700'}`}
                        >
                          <div className="flex items-center gap-3">
                            {selectedLoanIds.includes(l.id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                            <div>
                              <p className="font-bold text-xs">Préstamo #{l.id}</p>
                              <p className="text-[11px] text-slate-500">{l.frequency} • {l.loanType}</p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-sm">RD$ {l.remainingBalance.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nueva Tasa (%)</label>
                  <input type="number" value={newInterestRate} onChange={e => setNewInterestRate(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nuevo Plazo</label>
                  <input type="number" value={newDurationWeeks} onChange={e => setNewDurationWeeks(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
            </div>

            {/* Consolidated Summary */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Layers className="w-6 h-6 text-indigo-400" />
                  <h3 className="font-bold text-lg">Resumen de Consolidación</h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Préstamos Seleccionados</span>
                    <span className="font-bold">{selectedLoanIds.length} préstamos</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Capital Unificado</span>
                    <span className="font-bold font-mono text-xl text-emerald-400">RD$ {consolidatedCapital.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Nueva Cuota Estimada</span>
                    <span className="font-bold font-mono text-xl">RD$ {consolidatedInstallment.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConsolidateSubmit}
                disabled={selectedLoanIds.length === 0 || consolidatedCapital <= 0}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                PROCESAR CONSOLIDACIÓN <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default Simulator;
