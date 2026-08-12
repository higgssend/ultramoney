import React, { useState, useEffect } from 'react';
import { Calculator, Save, User, Plus, Search, Filter, ArrowRight, ChevronLeft, Clock, Banknote, Briefcase, FileCheck, RefreshCw, Scissors, Coins, ExternalLink, Calendar, CheckCircle, XCircle, Smartphone } from 'lucide-react';
import { useClients, useLoans, useSettings } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LoanEngine, InstallmentPreview } from '../utils/LoanEngine';
import { LoanType, ClosingCostMode, LoanRequest as ILoanRequest, Collateral, Loan, LoanProduct } from '../types';
import { CollateralForm } from './features/CollateralForm';
import { CustomSelect } from '../components/CustomSelect';
import { maskCedula } from '../utils/masks';

const LoanRequest: React.FC = () => {
  const { addLoanRequest, createLoan, refinanceLoan, deleteLoanRequest, loanRequests, loanProducts, loans } = useLoans();
  const { updateClient, clients } = useClients();
  const { globalCurrency } = useSettings();
  const navigate = useNavigate();
  
  // Refinancing State
  const [isRefinanceEnabled, setIsRefinanceEnabled] = useState(false);
  const [selectedLoanToRefinance, setSelectedLoanToRefinance] = useState<string>('');
  
  // View State
  const [viewMode, setViewMode] = useState<'create' | 'queue'>('queue');
  const [creationMode, setCreationMode] = useState<'request' | 'direct'>('request'); // 'request' = Solicitud, 'direct' = Loan
  
  // Track if we are processing a pending request (to delete it later)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [amount, setAmount] = useState(10000);
  const [weeks, setWeeks] = useState(12); // Duración
  const [interest, setInterest] = useState(10); // Porcentaje
  const [frequency, setFrequency] = useState('Semanal');
  const [paymentDay, setPaymentDay] = useState(1); // For Monthly Loans
  const [loanType, setLoanType] = useState<LoanType>('Amortizado (Cuota Fija)');

  // Equipment / Item Financing State (Con/Sin Inicial)
  const [itemPrice, setItemPrice] = useState(15000);
  const [hasInitialPayment, setHasInitialPayment] = useState(true);
  const [downPayment, setDownPayment] = useState(3000);
  const [downPaymentMode, setDownPaymentMode] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque'>('Efectivo');
  
  // Closing Costs State
  const [chargeClosingCost, setChargeClosingCost] = useState(false);
  const [closingCostType, setClosingCostType] = useState<'Manual' | 'Porcentaje'>('Porcentaje');
  const [closingCostPercentage, setClosingCostPercentage] = useState(5);
  const [closingCost, setClosingCost] = useState(0);
  const [closingCostMode, setClosingCostMode] = useState<ClosingCostMode>('Descontado');

  // Collateral State
  const [collateral, setCollateral] = useState<Collateral | undefined>(undefined);

  // PRD Category, Destination and Observations
  const [loanCategory, setLoanCategory] = useState<Loan['loanCategory']>('Personal');
  const [loanDestination, setLoanDestination] = useState('');
  const [observations, setObservations] = useState('');

  // Arrears Config (Moras)
  const [lateFeePercentage, setLateFeePercentage] = useState(10);
  const [graceDays, setGraceDays] = useState(3);

  // New: Calculation Mode (Time vs Amount)
  const [calcMode, setCalcMode] = useState<'time' | 'installment'>('time');
  const [targetInstallment, setTargetInstallment] = useState(1000);

  // Portal Access Options
  const [enablePortal, setEnablePortal] = useState(true);
  const [portalPin, setPortalPin] = useState('');
  const [schedulePreview, setSchedulePreview] = useState<InstallmentPreview[]>([]);
  const [activeProduct, setActiveProduct] = useState<LoanProduct | null>(null);

  // Dates State
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [firstPaymentDate, setFirstPaymentDate] = useState<string>('');

  const selectedClient = clients.find(c => c.id === selectedClientId);

  useEffect(() => {
    if (!startDate) return;
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return;
    let next = new Date(start);
    if (frequency === 'Mensual') {
      if (start.getDate() >= paymentDay) {
        next = new Date(start.getFullYear(), start.getMonth() + 1, paymentDay);
      } else {
        next = new Date(start.getFullYear(), start.getMonth(), paymentDay);
      }
    } else if (frequency === 'Quincenal') {
      next.setDate(next.getDate() + 15);
    } else if (frequency === 'Diario') {
      next.setDate(next.getDate() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setFirstPaymentDate(next.toISOString().split('T')[0]);
  }, [startDate, frequency, paymentDay]);
  
  const handleProductSelect = (productId: string) => {
      setSelectedProductId(productId);
      const product = loanProducts?.find(p => p.id === productId);
      if (product) {
          setActiveProduct(product);
          setAmount(product.minAmount);
          setInterest(product.interestRate);
          setFrequency(product.frequency === 'Mensual' ? 'Mensual' : product.frequency === 'Quincenal' ? 'Quincenal' : product.frequency === 'Diario' ? 'Diario' : 'Semanal');
          setWeeks(product.defaultInstallments);
          setClosingCost(product.disbursementFee);
          if (product.requiresCollateral) {
              setCollateral({ type: 'Vehículo', description: '', refNumber: '' });
          } else {
              setCollateral(undefined);
          }
          if (product.lateFeePercentage !== undefined) setLateFeePercentage(product.lateFeePercentage);
          if (product.graceDays !== undefined) setGraceDays(product.graceDays);
      } else {
          setActiveProduct(null);
      }
  };

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
    if (loanType.includes('Amortizado') && calcMode === 'installment') {
        const principal = getPrincipalForCalculation();
        const totalDebt = principal * (1 + (interest / 100));
        if (targetInstallment > 0) {
            const calculatedWeeks = Math.ceil(totalDebt / targetInstallment);
            setWeeks(calculatedWeeks > 0 ? calculatedWeeks : 1);
        }
    }
  }, [amount, interest, targetInstallment, calcMode, loanType, closingCost, closingCostMode]);

  useEffect(() => {
      if (chargeClosingCost) {
          if (closingCostType === 'Porcentaje') {
              setClosingCost(amount * (closingCostPercentage / 100));
          }
      } else {
          setClosingCost(0);
      }
  }, [chargeClosingCost, closingCostType, closingCostPercentage, amount]);

  
  const calculateTotal = () => {
      if (schedulePreview.length === 0) return 0;
      return schedulePreview.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateInstallment = () => {
      if (schedulePreview.length === 0) return 0;
      return schedulePreview[0].total; // Simplified
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
      if (req.closingCost) {
          setChargeClosingCost(true);
          setClosingCostType('Manual');
          setClosingCost(req.closingCost);
      }
      if (req.closingCostMode) setClosingCostMode(req.closingCostMode);
      if (req.paymentDay) setPaymentDay(req.paymentDay);
      if (req.collateral) setCollateral(req.collateral);
      if (req.lateFeePercentage !== undefined) setLateFeePercentage(req.lateFeePercentage);
      if (req.graceDays !== undefined) setGraceDays(req.graceDays);

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
    
    const finalWeeks = loanType === 'Rédito (Solo Interés)' ? 0 : weeks;
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
        if (isRefinanceEnabled && selectedLoanToRefinance) {
            refinanceLoan(selectedLoanToRefinance, {
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
                startDate: startDate || new Date().toISOString().split('T')[0],
                nextPaymentDate: firstPaymentDate || initialNextDate.toISOString().split('T')[0],
                collateral,
                loanCategory,
                note: observations || `Refinanciamiento del préstamo ${selectedLoanToRefinance}`,
                lateFeePercentage,
                graceDays
            });
        } else {
            createLoan({
                clientId: selectedClient.id,
                clientName: selectedClient.name,
                amount,
                interestRate: interest,
                durationWeeks: finalWeeks,
                frequency: frequency as any,
                loanType,
                itemPrice: loanType.includes('Financiamiento') ? itemPrice : undefined,
                downPayment: (loanType.includes('Financiamiento') && hasInitialPayment) ? downPayment : 0,
                downPaymentMode: (loanType.includes('Financiamiento') && hasInitialPayment) ? downPaymentMode : undefined,
                financedAmount: amount,
                closingCost,
                closingCostMode,
                paymentDay: frequency === 'Mensual' ? paymentDay : undefined,
                startDate: startDate || new Date().toISOString().split('T')[0],
                nextPaymentDate: firstPaymentDate || initialNextDate.toISOString().split('T')[0],
                collateral,
                loanCategory,
                note: observations,
                lateFeePercentage,
                graceDays
            });
        }
        
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
            itemPrice: loanType.includes('Financiamiento') ? itemPrice : undefined,
            downPayment: (loanType.includes('Financiamiento') && hasInitialPayment) ? downPayment : 0,
            downPaymentMode: (loanType.includes('Financiamiento') && hasInitialPayment) ? downPaymentMode : undefined,
            financedAmount: amount,
            closingCost,
            closingCostMode,
            paymentDay: frequency === 'Mensual' ? paymentDay : undefined,
            collateral,
            loanDestination,
            observations,
            lateFeePercentage,
            graceDays
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
                            <CustomSelect 
                                className="w-full text-sm"
                                value={selectedClientId}
                                onChange={(e) => {
                                    setSelectedClientId(e);
                                    setIsRefinanceEnabled(false);
                                    setSelectedLoanToRefinance('');
                                }}
                                options={[
                                    { value: '', label: '-- Buscar Cliente --' },
                                    ...clients.map(client => ({ value: client.id, label: `${client.name} - ${maskCedula(client.cedula)}` }))
                                ]}
                            />
                        </div>
                        
                        {selectedClientId && (
                            (() => {
                                const activeLoansForClient = loans.filter(l => l.clientId === selectedClientId && (l.status === 'Vigente' || l.status === 'Activo' || l.status === 'Atrasado') && l.remainingBalance > 0);
                                if (activeLoansForClient.length === 0) return null;
                                return (
                                    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                                                <RefreshCw className="w-4 h-4 text-amber-600" />
                                                <span>¿Refinanciar Préstamo Anterior?</span>
                                            </div>
                                            <input 
                                                type="checkbox"
                                                checked={isRefinanceEnabled}
                                                onChange={e => {
                                                    setIsRefinanceEnabled(e.target.checked);
                                                    if (e.target.checked && activeLoansForClient.length > 0) {
                                                        setSelectedLoanToRefinance(activeLoansForClient[0].id);
                                                    }
                                                }}
                                                className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                                            />
                                        </div>

                                        {isRefinanceEnabled && (
                                            <div className="mt-3 space-y-2 pt-2 border-t border-amber-200/60">
                                                <label className="block text-xs font-bold text-amber-800">Préstamo a saldar y consolidar:</label>
                                                <CustomSelect
                                                    value={selectedLoanToRefinance}
                                                    onChange={e => setSelectedLoanToRefinance(e)}
                                                    className="w-full text-xs"
                                                    options={activeLoansForClient.map(l => ({
                                                        value: l.id,
                                                        label: `Préstamo #${l.id.slice(0, 8)} - Balance Pendiente: RD$ ${l.remainingBalance.toLocaleString()}`
                                                    }))}
                                                />
                                                {selectedLoanToRefinance && (
                                                    <div className="text-xs text-amber-900 font-medium bg-white p-3 rounded-xl border border-amber-200 mt-2 space-y-1">
                                                        <p>🔄 <strong>Consolidación en 1 Clic:</strong></p>
                                                        <p>• Saldo anterior a saldar: <strong>RD$ {(loans.find(l => l.id === selectedLoanToRefinance)?.remainingBalance || 0).toLocaleString()}</strong></p>
                                                        <p>• Desembolso neto al cliente: <strong className="text-emerald-700">RD$ {Math.max(0, amount - (loans.find(l => l.id === selectedLoanToRefinance)?.remainingBalance || 0) - closingCost).toLocaleString()}</strong></p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        )}
                        </div>
                    </div>

                    {/* Financial Config */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Calculator className="w-5 h-5" /></div>
                        Configuración Financiera
                        </h3>
                        
                        {/* Loan Type Selector */}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div 
                                onClick={() => { setLoanType('Amortizado (Cuota Fija)'); setCalcMode('time'); }}
                                className={`cursor-pointer border rounded-2xl p-4 flex flex-col gap-2 transition-all ${loanType.includes('Amortizado') ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm">Cuotas Fijas</span>
                                    {loanType.includes('Amortizado') && <FileCheck className="w-5 h-5 text-indigo-600" />}
                                </div>
                                <span className="text-xs opacity-70">Capital + Interés dividido en pagos</span>
                            </div>
                            
                            <div 
                                onClick={() => { setLoanType('Rédito (Solo Interés)'); setCalcMode('time'); }}
                                className={`cursor-pointer border rounded-2xl p-4 flex flex-col gap-2 transition-all ${(loanType === 'Rédito' || loanType.includes('Rédito')) ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm">Pagaré Abierto</span>
                                    {(loanType === 'Rédito' || loanType.includes('Rédito')) && <FileCheck className="w-5 h-5 text-purple-600" />}
                                </div>
                                <span className="text-xs opacity-70">Solo paga interés. Capital al final.</span>
                            </div>

                            <div 
                                onClick={() => { setLoanType('Financiamiento de Equipo (Con/Sin Inicial)'); setCalcMode('time'); }}
                                className={`cursor-pointer border rounded-2xl p-4 flex flex-col gap-2 transition-all ${loanType.includes('Financiamiento') ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm flex items-center gap-1.5">
                                        <Smartphone className="w-4 h-4 text-emerald-600" /> Financiamiento
                                    </span>
                                    {loanType.includes('Financiamiento') && <FileCheck className="w-5 h-5 text-emerald-600" />}
                                </div>
                                <span className="text-xs opacity-70">Con o Sin inicial (Celulares, Equipos, etc.)</span>
                            </div>
                        </div>

                        {/* Special Controls for Financiamiento de Equipos (Con/Sin Inicial) */}
                        {loanType.includes('Financiamiento') && (
                            <div className="mb-6 bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                                        <Coins className="w-5 h-5 text-emerald-600" />
                                        Detalles del Artículo y Pago Inicial (Enganche)
                                    </h4>
                                    <div className="flex bg-emerald-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHasInitialPayment(true);
                                                const net = Math.max(0, itemPrice - downPayment);
                                                setAmount(net);
                                            }}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${hasInitialPayment ? 'bg-white text-emerald-700 shadow-xs' : 'text-emerald-700 opacity-70'}`}
                                        >
                                            Con Inicial
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHasInitialPayment(false);
                                                setAmount(itemPrice);
                                            }}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${!hasInitialPayment ? 'bg-white text-emerald-700 shadow-xs' : 'text-emerald-700 opacity-70'}`}
                                        >
                                            Sin Inicial (0 Inicial)
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-900 mb-1">Precio Total del Artículo / Equipo (RD$)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-emerald-600 font-bold">$</span>
                                            <input
                                                type="number"
                                                value={itemPrice === 0 ? '' : itemPrice}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                    setItemPrice(val);
                                                    const net = hasInitialPayment ? Math.max(0, val - downPayment) : val;
                                                    setAmount(net);
                                                }}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-4 py-2 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {hasInitialPayment ? (
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-900 mb-1">Monto de la Inicial / Enganche (RD$)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-emerald-600 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={downPayment === 0 ? '' : downPayment}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                        setDownPayment(val);
                                                        const net = Math.max(0, itemPrice - val);
                                                        setAmount(net);
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-full pl-8 pr-4 py-2 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center bg-emerald-100/50 rounded-xl p-3 border border-emerald-200/60">
                                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                Llévatelo Hoy Sin Inicial (0% Inicial)
                                            </span>
                                        </div>
                                    )}

                                    {hasInitialPayment && (
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                            <div>
                                                <label className="block text-xs font-bold text-emerald-900 mb-1">Método de Pago de la Inicial</label>
                                                <CustomSelect
                                                    value={downPaymentMode}
                                                    onChange={(v) => setDownPaymentMode(v as any)}
                                                    className="w-full text-xs font-medium"
                                                    options={[
                                                        { value: 'Efectivo', label: '💵 Efectivo (Cobro Inmediato)' },
                                                        { value: 'Transferencia', label: '🏦 Transferencia Bancaria' },
                                                        { value: 'Tarjeta', label: '💳 Tarjeta de Crédito / Débito' },
                                                        { value: 'Cheque', label: '📄 Cheque' }
                                                    ]}
                                                />
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                                                <span className="text-slate-600">Porcentaje de Inicial:</span>
                                                <span className="font-bold text-emerald-700 font-mono text-sm">
                                                    {itemPrice > 0 ? `${((downPayment / itemPrice) * 100).toFixed(1)}%` : '0%'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-emerald-200 flex items-center justify-between text-xs md:text-sm">
                                    <span className="font-bold text-slate-700">Monto Neto a Financiar en Cuotas (Capital):</span>
                                    <span className="font-extrabold text-emerald-700 text-lg">
                                        RD$ {(hasInitialPayment ? Math.max(0, itemPrice - downPayment) : itemPrice).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Monto */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {loanType.includes('Financiamiento') ? 'Monto a Financiar (Capital Calculado)' : 'Monto a Prestar (Capital)'}
                                </label>
                                <div className="relative">
                                <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                                <input 
                                    type="number" 
                                    value={amount === 0 ? '' : amount}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-lg" 
                                />
                                </div>
                            </div>

                            {/* Interés */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {loanType.includes('Amortizado') ? 'Tasa de Interés Total (%)' : 'Tasa por Periodo (%)'}
                                </label>
                                <input 
                                type="number" 
                                value={interest === 0 ? '' : interest}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setInterest(e.target.value === '' ? 0 : Number(e.target.value))}
                                placeholder="0"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                                />
                            </div>

                            {/* Frecuencia */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Frecuencia de Pago</label>
                                <CustomSelect 
                                    value={frequency}
                                    onChange={(e) => setFrequency(e)}
                                    className="w-full font-medium"
                                    options={[
                                        { value: 'Semanal', label: 'Semanal' },
                                        { value: 'Quincenal', label: 'Quincenal' },
                                        { value: 'Mensual', label: 'Mensual' },
                                        { value: 'Diario', label: 'Diario' }
                                    ]}
                                />
                            </div>

                            {/* Specific Payment Day (Only for Mensual) */}
                            {frequency === 'Mensual' && (
                                <div className="md:col-span-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <label className="block text-sm font-bold text-indigo-800 mb-2">Día de Pago Mensual</label>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-indigo-500" />
                                        <CustomSelect 
                                            value={paymentDay.toString()}
                                            onChange={(e) => setPaymentDay(Number(e))}
                                            className="w-full"
                                            options={Array.from({length: 31}, (_, i) => i + 1).map(day => ({
                                                value: day.toString(),
                                                label: `Día ${day} de cada mes`
                                            }))}
                                        />
                                    </div>
                                    <p className="text-xs text-indigo-500 mt-2">El sistema ajustará el primer pago al próximo día {paymentDay}.</p>
                                </div>
                            )}

                            {/* Calculation Mode Tabs */}
                            {loanType.includes('Amortizado') && (
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
                                                value={weeks === 0 ? '' : weeks}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => setWeeks(e.target.value === '' ? 0 : Number(e.target.value))}
                                                placeholder="0"
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
                                                    value={targetInstallment === 0 ? '' : targetInstallment}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => setTargetInstallment(e.target.value === '' ? 0 : Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full pl-8 pr-4 py-3 border border-indigo-200 bg-indigo-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900"
                                                />
                                            </div>
                                            <p className="text-xs text-indigo-500 mt-1">El sistema calculará el tiempo necesario.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Date Picker Grid */}
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Inicio / Desembolso</label>
                                    <input 
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-indigo-700 mb-1">Fecha del Primer Cobro / Pago</label>
                                    <input 
                                        type="date"
                                        value={firstPaymentDate}
                                        onChange={(e) => setFirstPaymentDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-indigo-300 bg-white rounded-lg text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-[11px] text-indigo-500 mt-1">El cliente pagará su primera cuota/rédito en esta fecha.</p>
                                </div>
                            </div>
                            
                            {(loanType === 'Rédito' || loanType.includes('Rédito')) && (
                                <div className="md:col-span-2 bg-purple-50 border border-purple-200 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <RefreshCw className="w-4 h-4 text-purple-600" />
                                        <span className="font-bold text-purple-800 text-sm">Modo Pagaré Abierto (Rédito)</span>
                                    </div>
                                    <p className="text-xs text-purple-700 mb-3">
                                        Este préstamo no tiene una fecha de fin establecida. El cliente pagará <strong>RD$ {(getPrincipalForCalculation() * (interest / 100)).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> de intereses cada <strong>{frequency.toLowerCase()}</strong> a partir del <strong>{firstPaymentDate || 'día programado'}</strong> hasta cancelar el capital.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 text-xs bg-white/80 p-3 rounded-lg border border-purple-100">
                                        <div><span className="text-slate-500 block">Interés por periodo:</span><span className="font-bold text-purple-900">RD$ {(getPrincipalForCalculation() * (interest / 100)).toLocaleString()} / {frequency}</span></div>
                                        <div><span className="text-slate-500 block">Primer cobro programado:</span><span className="font-bold text-purple-900">{firstPaymentDate || 'Por definir'}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Collateral Form */}
                    <CollateralForm collateral={collateral} onChange={setCollateral} />

                    {/* Arrears Config (Moras) */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                            Configuración de Moras (Automatización)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Porcentaje de Mora (%)</label>
                                <input 
                                    type="number" 
                                    value={lateFeePercentage === 0 ? '' : lateFeePercentage}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setLateFeePercentage(e.target.value === '' ? 0 : Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-slate-700" 
                                />
                                <p className="text-xs text-slate-500 mt-2">Cargo que se sumará al balance vencido automáticamente.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Días de Gracia</label>
                                <input 
                                    type="number" 
                                    value={graceDays === 0 ? '' : graceDays}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setGraceDays(e.target.value === '' ? 0 : Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-slate-700" 
                                />
                                <p className="text-xs text-slate-500 mt-2">Días extra antes de aplicar la mora (0 = mora inmediata).</p>
                            </div>
                        </div>
                    </div>

                    {/* Closing Costs Config */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Scissors className="w-5 h-5" /></div>
                                Gastos de Cierre / Legal
                            </h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={chargeClosingCost} onChange={(e) => setChargeClosingCost(e.target.checked)} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>
                        
                        {chargeClosingCost && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in border-t border-slate-100 pt-6">
                                <div className="md:col-span-2">
                                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4 w-fit">
                                        <button 
                                            onClick={() => setClosingCostType('Porcentaje')}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${closingCostType === 'Porcentaje' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Porcentaje (%)
                                        </button>
                                        <button 
                                            onClick={() => setClosingCostType('Manual')}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${closingCostType === 'Manual' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Monto Fijo
                                        </button>
                                    </div>
                                </div>
                                
                                {closingCostType === 'Porcentaje' ? (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Porcentaje de Gasto (%)</label>
                                        <div className="relative">
                                            <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                                            <input 
                                                type="number" 
                                                value={closingCostPercentage === 0 ? '' : closingCostPercentage}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => setClosingCostPercentage(e.target.value === '' ? 0 : Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full pl-4 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700" 
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Calculado: ${closingCost.toLocaleString()}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Monto Fijo ($)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                                            <input 
                                                type="number" 
                                                value={closingCost === 0 ? '' : closingCost}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => setClosingCost(e.target.value === '' ? 0 : Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700" 
                                            />
                                        </div>
                                    </div>
                                )}
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
                        )}
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

                            {loanType.includes('Amortizado') ? (
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
                            
                            {loanType.includes('Amortizado') && calcMode === 'installment' && (
                                <div className="bg-white/10 p-3 rounded-lg text-center backdrop-blur-sm">
                                    <span className="block text-indigo-200 text-xs mb-1">Duración Calculada</span>
                                    <span className="text-xl font-bold text-white">{weeks} {frequency}(s)</span>
                                </div>
                            )}

                            <div className="mt-8 pt-4">
                                <p className="text-xs text-indigo-200 text-center uppercase font-bold tracking-wider mb-2">
                                    {loanType.includes('Amortizado') ? 'Cuota Fija' : 'Interés Periódico'}
                                </p>
                                <div className="text-center text-4xl font-bold bg-white/10 py-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                ${calculateInstallment().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </div>
                                {(loanType === 'Rédito' || loanType.includes('Rédito')) && (
                                    <p className="text-center text-[10px] text-indigo-200 mt-2 bg-black/20 rounded py-1 px-2">
                                        * Cliente debe pagar esto cada {frequency} (Primer cobro: {firstPaymentDate})
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