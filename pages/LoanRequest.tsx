import React, { useState, useEffect } from 'react';
import { Calculator, Save, User, Plus, Search, Filter, ArrowRight, ChevronLeft, Clock, Banknote, Briefcase, FileCheck, RefreshCw, Scissors, Coins, ExternalLink, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LoanType, ClosingCostMode, LoanRequest as ILoanRequest, Collateral } from '../types';
import { CollateralForm } from './features/CollateralForm';

const LoanRequest: React.FC = () => {
  const { addLoanRequest, createLoan, deleteLoanRequest, updateClient, clients, loanRequests } = useStore();
  const navigate = useNavigate();
  
  // View State
  const [viewMode, setViewMode] = useState<'create' | 'queue'>('queue');
  const [creationMode, setCreationMode] = useState<'request' | 'direct'>('request'); // 'request' = Solicitud, 'direct' = Loan
  
  // Track if we are processing a pending request (to delete it later)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState(10000);
  const [weeks, setWeeks] = useState(12); // Duración
  const [interest, setInterest] = useState(10); // Porcentaje
  const [frequency, setFrequency] = useState('Semanal');
  const [paymentDay, setPaymentDay] = useState(1); // For Monthly Loans
  const [loanType, setLoanType] = useState<LoanType>('Amortizado');
  
  // Closing Costs State
  const [closingCost, setClosingCost] = useState(0);
  const [closingCostMode, setClosingCostMode] = useState<ClosingCostMode>('Descontado');

  // Collateral State
  const [collateral, setCollateral] = useState<Collateral | undefined>(undefined);

  // PRD Category, Destination and Observations
  const [loanCategory, setLoanCategory] = useState<any>('Personal');
  const [loanDestination, setLoanDestination] = useState('');
  const [observations, setObservations] = useState('');

  // New: Calculation Mode (Time vs Amount)
  const [calcMode, setCalcMode] = useState<'time' | 'installment'>('time');
  const [targetInstallment, setTargetInstallment] = useState(1000);

  // Portal Access Options
  const [enablePortal, setEnablePortal] = useState(true);
  const [portalPin, setPortalPin] = useState('');

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // --- Core Calculation Logic ---

  const getPrincipalForCalculation = () => {
      // If "Financiado", the principal increases by the closing cost
      if (closingCostMode === 'Financiado') {
          return amount + closingCost;
      }
      return amount;
  };

  // Efecto para recalcular cuando cambian los inputs
  useEffect(() => {
    if (loanType === 'Amortizado' && calcMode === 'installment') {
        const principal = getPrincipalForCalculation();
        const totalDebt = principal * (1 + (interest / 100));
        if (targetInstallment > 0) {
            const calculatedWeeks = Math.ceil(totalDebt / targetInstallment);
            setWeeks(calculatedWeeks > 0 ? calculatedWeeks : 1);
        }
    }
  }, [amount, interest, targetInstallment, calcMode, loanType, closingCost, closingCostMode]);

  const calculateTotal = () => {
    const principal = getPrincipalForCalculation();
    if (loanType === 'Amortizado') {
        const totalInterest = principal * (interest / 100);
        return principal + totalInterest;
    } else {
        return principal; 
    }
  };

  const calculateInstallment = () => {
    const principal = getPrincipalForCalculation();
    if (loanType === 'Amortizado') {
        if (calcMode === 'installment') return targetInstallment; 
        return calculateTotal() / weeks; 
    } else {
        return principal * (interest / 100);
    }
  };

  const getNetDisbursement = () => {
      if (closingCostMode === 'Descontado') {
          return amount - closingCost;
      }
      return amount;
  };

  const handleProcessRequest = (req: ILoanRequest) => {
      // Load data into form
      setSelectedClientId(req.clientId);
      setAmount(req.amount);
      setInterest(req.interestRate);
      setWeeks(req.durationWeeks);
      setFrequency(req.frequency);
      setLoanType(req.loanType);
      if (req.closingCost) setClosingCost(req.closingCost);
      if (req.closingCostMode) setClosingCostMode(req.closingCostMode);
      if (req.paymentDay) setPaymentDay(req.paymentDay);
      if (req.collateral) setCollateral(req.collateral);

      // Set UI state to Creation Mode (Direct)
      setProcessingRequestId(req.id);
      setCreationMode('direct');
      setViewMode('create');
  };

  const handleSubmit = () => {
    if (!selectedClient) {
        toast.error("Por favor seleccione un cliente");
        return;
    }
    
    const finalWeeks = loanType === 'Rédito' ? 0 : weeks;
    // Calculate initial next payment date based on paymentDay (if direct loan + monthly)
    let initialNextDate = new Date();
    initialNextDate.setDate(initialNextDate.getDate() + 7); // Default fallback

    if (frequency === 'Mensual') {
        const today = new Date();
        if (today.getDate() >= paymentDay) {
            initialNextDate = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay);
        } else {
            initialNextDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
        }
    }

    if (creationMode === 'direct') {
        createLoan({
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            amount,
            interestRate: interest,
            durationWeeks: finalWeeks,
            frequency: frequency as any,
            loanType,
            closingCost,
            closingCostMode,
            paymentDay: frequency === 'Mensual' ? paymentDay : undefined,
            startDate: new Date().toISOString().split('T')[0],
            nextPaymentDate: initialNextDate.toISOString().split('T')[0],
            collateral,
            loanCategory
        });
        
        // If this came from a request, delete the request now that it is a loan
        if (processingRequestId) {
            deleteLoanRequest(processingRequestId);
            setProcessingRequestId(null);
        }

        // Update client portal access
        if (selectedClient) {
            updateClient({
                ...selectedClient,
                clientPin: enablePortal ? portalPin : undefined // If enablePortal is true but portalPin is empty, they log in without PIN
            });
        }

        navigate('/prestamos');
    } else {
        // Update client portal access
        if (selectedClient) {
            updateClient({
                ...selectedClient,
                clientPin: enablePortal ? portalPin : undefined
            });
        }

        addLoanRequest({
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            amount,
            interestRate: interest,
            durationWeeks: finalWeeks,
            frequency: frequency as any,
            loanType,
            closingCost,
            closingCostMode,
            paymentDay: frequency === 'Mensual' ? paymentDay : undefined,
            collateral,
            loanDestination,
            observations
        });
        toast.success("Solicitud guardada con éxito.");
        setViewMode('queue');
    }
  };

  if (viewMode === 'create') {
    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => { setViewMode('queue'); setProcessingRequestId(null); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Nueva {creationMode === 'request' ? 'Solicitud' : 'Concesión'}</h2>
                    <p className="text-slate-500">Configuración del préstamo y plan de pagos.</p>
                </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="bg-white p-2 rounded-xl inline-flex border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setCreationMode('request')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === 'request' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Crear Solicitud (Revisión)
                </button>
                <button 
                    onClick={() => setCreationMode('direct')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === 'direct' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Desembolso Directo
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Client Selection */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User className="w-5 h-5" /></div>
                        Información del Cliente
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Cliente</label>
                            <select 
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                            >
                                <option value="">-- Buscar Cliente --</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name} - {client.cedula}</option>
                                ))}
                            </select>
                        </div>
                        </div>
                    </div>

                    {/* Financial Config */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Calculator className="w-5 h-5" /></div>
                        Configuración Financiera
                        </h3>
                        
                        {/* Loan Type Selector */}
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div 
                                onClick={() => { setLoanType('Amortizado'); setCalcMode('time'); }}
                                className={`cursor-pointer border rounded-2xl p-4 flex flex-col gap-2 transition-all ${loanType === 'Amortizado' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between">
                                    <span className="font-bold text-sm">Cuotas Fijas (Amortizado)</span>
                                    {loanType === 'Amortizado' && <FileCheck className="w-5 h-5 text-indigo-600" />}
                                </div>
                                <span className="text-xs opacity-70">Capital + Interés dividido en pagos</span>
                            </div>
                            <div 
                                onClick={() => { setLoanType('Rédito'); setCalcMode('time'); }}
                                className={`cursor-pointer border rounded-2xl p-4 flex flex-col gap-2 transition-all ${loanType === 'Rédito' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between">
                                    <span className="font-bold text-sm">Pagaré Abierto (Rédito)</span>
                                    {loanType === 'Rédito' && <FileCheck className="w-5 h-5 text-purple-600" />}
                                </div>
                                <span className="text-xs opacity-70">Solo paga interés. Capital al final.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Monto */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Monto a Prestar (Capital)</label>
                                <div className="relative">
                                <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-lg" 
                                />
                                </div>
                            </div>

                            {/* Interés */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {loanType === 'Amortizado' ? 'Tasa de Interés Total (%)' : 'Tasa por Periodo (%)'}
                                </label>
                                <input 
                                type="number" 
                                value={interest}
                                onChange={(e) => setInterest(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                                />
                            </div>

                            {/* Frecuencia */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Frecuencia de Pago</label>
                                <select 
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium">
                                <option>Semanal</option>
                                <option>Quincenal</option>
                                <option>Mensual</option>
                                <option>Diario</option>
                                </select>
                            </div>

                            {/* Specific Payment Day (Only for Mensual) */}
                            {frequency === 'Mensual' && (
                                <div className="md:col-span-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <label className="block text-sm font-bold text-indigo-800 mb-2">Día de Pago Mensual</label>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-indigo-500" />
                                        <select 
                                            value={paymentDay}
                                            onChange={(e) => setPaymentDay(Number(e.target.value))}
                                            className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                                <option key={day} value={day}>Día {day} de cada mes</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-xs text-indigo-500 mt-2">El sistema ajustará el primer pago al próximo día {paymentDay}.</p>
                                </div>
                            )}

                            {/* Calculation Mode Tabs */}
                            {loanType === 'Amortizado' && (
                                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4 w-fit">
                                        <button 
                                            onClick={() => setCalcMode('time')}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${calcMode === 'time' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Calcular por Tiempo
                                        </button>
                                        <button 
                                            onClick={() => setCalcMode('installment')}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${calcMode === 'installment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Calcular por Cuota
                                        </button>
                                    </div>

                                    {calcMode === 'time' ? (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Duración (Cantidad Cuotas)</label>
                                            <input 
                                                type="number"
                                                value={weeks}
                                                onChange={(e) => setWeeks(Number(e.target.value))}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-bold text-indigo-700 mb-2">Monto de Cuota Deseada</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-indigo-400 font-bold">$</span>
                                                <input 
                                                    type="number"
                                                    value={targetInstallment}
                                                    onChange={(e) => setTargetInstallment(Number(e.target.value))}
                                                    className="w-full pl-8 pr-4 py-3 border border-indigo-200 bg-indigo-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900"
                                                />
                                            </div>
                                            <p className="text-xs text-indigo-500 mt-1">El sistema calculará el tiempo necesario.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {loanType === 'Rédito' && (
                                <div className="md:col-span-2 bg-purple-50 border border-purple-100 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <RefreshCw className="w-4 h-4 text-purple-600" />
                                        <span className="font-bold text-purple-800 text-sm">Modo Pagaré Abierto</span>
                                    </div>
                                    <p className="text-xs text-purple-600">
                                        Este préstamo no tiene una fecha de fin establecida. El cliente pagará intereses periódicamente hasta que decida saldar el capital completo.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Collateral Form */}
                    <CollateralForm collateral={collateral} onChange={setCollateral} />

                    {/* Closing Costs Config */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Scissors className="w-5 h-5" /></div>
                            Gastos de Cierre / Legal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Monto Gasto Cierre</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                                    <input 
                                        type="number" 
                                        value={closingCost}
                                        onChange={(e) => setClosingCost(Number(e.target.value))}
                                        className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Forma de Pago</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => setClosingCostMode('Descontado')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${closingCostMode === 'Descontado' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <Scissors className="w-4 h-4 mb-1" /> Descontar
                                    </button>
                                    <button 
                                        onClick={() => setClosingCostMode('Financiado')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${closingCostMode === 'Financiado' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <Coins className="w-4 h-4 mb-1" /> Sumar
                                    </button>
                                    <button 
                                        onClick={() => setClosingCostMode('Externo')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${closingCostMode === 'Externo' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <ExternalLink className="w-4 h-4 mb-1" /> Externo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Portal Access Config */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mt-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Smartphone className="w-5 h-5" /></div>
                        Acceso a Portal de Cliente
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={enablePortal}
                                onChange={(e) => setEnablePortal(e.target.checked)}
                                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <div>
                                <span className="font-bold text-slate-800 block">Habilitar Link de Acceso</span>
                                <span className="text-xs text-slate-500">Permite al cliente ver su balance en línea enviándole un Link.</span>
                            </div>
                        </label>
                        
                        {enablePortal && (
                            <div className="pl-8 border-l-2 border-indigo-100 ml-2 mt-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">PIN de Acceso (4 Dígitos)</label>
                                <input 
                                    type="text" 
                                    maxLength={4}
                                    value={portalPin}
                                    onChange={(e) => setPortalPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Dejar en blanco para acceso directo sin PIN"
                                    className="w-full max-w-[250px] px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-widest text-lg" 
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Si dejas el PIN vacío, el cliente podrá entrar a su portal directamente haciendo clic en el enlace, sin colocar contraseña.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl shadow-xl shadow-indigo-500/30 p-8 sticky top-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm"><Banknote className="w-6 h-6"/></div>
                            <h3 className="text-xl font-bold">Resumen</h3>
                        </div>
                        
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-white/10 pb-3">
                                <span className="text-indigo-100">Capital Solicitado</span>
                                <span className="font-semibold text-white">${amount.toLocaleString()}</span>
                            </div>
                            
                            {closingCost > 0 && (
                                <div className="flex justify-between border-b border-white/10 pb-3">
                                    <span className="text-amber-200 flex items-center gap-1"><Scissors className="w-3 h-3"/> Gastos Cierre</span>
                                    <span className="font-semibold text-amber-200">
                                        {closingCostMode === 'Descontado' ? '-' : closingCostMode === 'Financiado' ? '+' : ''}${closingCost.toLocaleString()}
                                        <span className="text-[9px] block text-right opacity-70 uppercase">{closingCostMode}</span>
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between border-b border-white/10 pb-3 bg-white/5 p-2 rounded-lg">
                                <span className="text-emerald-200 font-bold uppercase text-xs">Monto a Entregar (Neto)</span>
                                <span className="font-bold text-xl text-emerald-300">${getNetDisbursement().toLocaleString()}</span>
                            </div>

                            {/* Separator */}
                            <div className="my-2"></div>

                            {loanType === 'Amortizado' ? (
                                <div className="flex justify-between border-b border-white/10 pb-3">
                                    <span className="text-indigo-100">Total Deuda (Capital + Int)</span>
                                    <span className="font-bold text-lg text-white">${calculateTotal().toLocaleString()}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between border-b border-white/10 pb-3">
                                    <span className="text-indigo-100">Capital a Saldar</span>
                                    <span className="font-bold text-lg text-white">${getPrincipalForCalculation().toLocaleString()}</span>
                                </div>
                            )}
                            
                            {loanType === 'Amortizado' && calcMode === 'installment' && (
                                <div className="bg-white/10 p-3 rounded-lg text-center backdrop-blur-sm">
                                    <span className="block text-indigo-200 text-xs mb-1">Duración Calculada</span>
                                    <span className="text-xl font-bold text-white">{weeks} {frequency}(s)</span>
                                </div>
                            )}

                            <div className="mt-8 pt-4">
                                <p className="text-xs text-indigo-200 text-center uppercase font-bold tracking-wider mb-2">
                                    {loanType === 'Amortizado' ? 'Cuota Fija' : 'Interés Periódico'}
                                </p>
                                <div className="text-center text-4xl font-bold bg-white/10 py-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                ${calculateInstallment().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </div>
                                {loanType === 'Rédito' && (
                                    <p className="text-center text-[10px] text-indigo-200 mt-2 bg-black/20 rounded py-1 px-2">
                                        * Cliente debe pagar esto cada {frequency}
                                    </p>
                                )}
                            </div>

                            <button 
                                onClick={handleSubmit}
                                className={`w-full mt-6 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] ${creationMode === 'direct' ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                                disabled={!selectedClientId}
                            >
                                {creationMode === 'direct' ? <Banknote className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                                {creationMode === 'direct' ? 'Desembolsar Ahora' : 'Guardar Solicitud'}
                            </button>
                            {creationMode === 'direct' && (
                                <p className="text-center text-[10px] text-emerald-200 flex justify-center items-center gap-1 mt-2">
                                    <FileCheck className="w-3 h-3" /> Se generará contrato automáticamente
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // Queue View
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
             </button>
             <div>
                 <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Cola de Solicitudes</h2>
                 <p className="text-slate-500">Revisa y aprueba solicitudes antes del desembolso.</p>
             </div>
         </div>
         <button 
             onClick={() => { setViewMode('create'); setProcessingRequestId(null); setCreationMode('request'); }}
             className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
         >
             <Plus className="w-5 h-5" />
             <span className="font-bold text-sm">Nueva Solicitud</span>
         </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Buscar solicitud..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
         </div>
         <button className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
            <Filter className="w-5 h-5" />
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loanRequests.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                  <FileCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No hay solicitudes pendientes.</p>
              </div>
          ) : (
              loanRequests.map(req => (
                  <div key={req.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all relative overflow-hidden group">
                      <div className="flex justify-between items-center text-xs text-slate-500 mb-4 relative z-10">
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">{req.frequency}</span>
                          </div>
                          <span className="font-bold text-slate-400">#{req.id}</span>
                      </div>
                      
                      <div className="mb-4 relative z-10">
                          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 truncate">{req.clientName}</h3>
                          <p className="text-xs text-slate-400">Tipo: <span className="font-medium text-slate-600">{req.loanType}</span></p>
                      </div>
                      
                      <div className="flex justify-between items-end border-t border-slate-50 pt-4 mb-4 relative z-10">
                          <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Capital</p>
                              <span className="font-bold text-indigo-600 text-2xl">${req.amount.toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Tasa</p>
                              <span className="font-bold text-slate-700">{req.interestRate}%</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 relative z-10">
                          <button 
                            onClick={() => deleteLoanRequest(req.id)}
                            className="flex items-center justify-center gap-2 py-2 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-sm transition-colors"
                          >
                              <XCircle className="w-4 h-4" /> Rechazar
                          </button>
                          <button 
                            onClick={() => handleProcessRequest(req)}
                            className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-sm transition-colors shadow-md shadow-emerald-200"
                          >
                              <CheckCircle className="w-4 h-4" /> Aprobar
                          </button>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default LoanRequest;