import React, { useState, useMemo } from 'react';
import { 
  Scale, Plus, Search, Filter, ShieldAlert, FileText, Gavel, 
  Building2, Phone, Mail, User, Clock, CheckCircle2, AlertCircle, 
  DollarSign, ArrowUpRight, Calendar, Printer, ExternalLink, 
  Edit, Trash2, ChevronRight, X, Sparkles, RefreshCw, Send, Check
} from 'lucide-react';
import { useLegal, useLoans, useClients, useSettings } from '../context/StoreContext';
import { 
  LegalCase, LegalLawyer, LegalEvent, LegalAgreement, 
  LegalCaseStage, LegalCaseStatus, Loan, LoanStatus, formatLoanId 
} from '../types';
import StatCard from '../components/StatCard';
import { CustomSelect } from '../components/CustomSelect';
import { toast } from 'sonner';

export const LegalCollectionPage: React.FC = () => {
  const { 
    lawyers, legalCases, legalEvents, legalAgreements, isLoadingLegal,
    refreshLegalData, openLegalCase, updateLegalCaseStage, addLegalEvent,
    createLegalAgreement, addLawyer, updateLawyer, deleteLawyer, closeLegalCase 
  } = useLegal();
  const { loans } = useLoans();
  const { clients } = useClients();
  const { companySettings } = useSettings();

  const [activeTab, setActiveTab] = useState<'cases' | 'timeline' | 'agreements' | 'lawyers'>('cases');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Modal: Open New Legal Case
  const [isOpenCaseModalOpen, setIsOpenCaseModalOpen] = useState(false);
  const [selectedLoanIdForCase, setSelectedLoanIdForCase] = useState('');
  const [selectedLawyerIdForCase, setSelectedLawyerIdForCase] = useState('');
  const [courtJurisdiction, setCourtJurisdiction] = useState('Juzgado de Paz / Primera Instancia');
  const [initialLegalCost, setInitialLegalCost] = useState('0');
  const [initialStage, setInitialStage] = useState<LegalCaseStage>('Intimación Extrajudicial');
  const [caseNotes, setCaseNotes] = useState('');

  // Modal: Add Legal Event / Cost
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedCaseForEvent, setSelectedCaseForEvent] = useState<LegalCase | null>(null);
  const [eventType, setEventType] = useState<LegalEvent['eventType']>('Acto de Alguacil');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventCost, setEventCost] = useState('0');
  const [addToDebt, setAddToDebt] = useState(true);
  const [bailiffName, setBailiffName] = useState('');
  const [docNumber, setDocNumber] = useState('');

  // Modal: Create Homologated Agreement
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [selectedCaseForAgreement, setSelectedCaseForAgreement] = useState<LegalCase | null>(null);
  const [agreedTotal, setAgreedTotal] = useState('');
  const [agreementDownPayment, setAgreementDownPayment] = useState('0');
  const [agreementInstallments, setAgreementInstallments] = useState(6);
  const [agreementFrequency, setAgreementFrequency] = useState<'Quincenal' | 'Semanal' | 'Mensual'>('Quincenal');
  const [agreementDate, setAgreementDate] = useState(new Date().toISOString().split('T')[0]);
  const [homologatedByCourt, setHomologatedByCourt] = useState(true);
  const [courtReference, setCourtReference] = useState('');
  const [agreementNotes, setAgreementNotes] = useState('');

  // Modal: Lawyer CRUD
  const [isLawyerModalOpen, setIsLawyerModalOpen] = useState(false);
  const [editingLawyerId, setEditingLawyerId] = useState<string | null>(null);
  const [lawyerName, setLawyerName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [lawyerRnc, setLawyerRnc] = useState('');
  const [lawyerPhone, setLawyerPhone] = useState('');
  const [lawyerWhatsapp, setLawyerWhatsapp] = useState('');
  const [lawyerEmail, setLawyerEmail] = useState('');
  const [lawyerAddress, setLawyerAddress] = useState('');
  const [feePercentage, setFeePercentage] = useState('15');
  const [fixedFee, setFixedFee] = useState('0');

  // Modal: Case Dossier Detail View
  const [viewingCaseDetail, setViewingCaseDetail] = useState<LegalCase | null>(null);

  // Available Overdue Loans to Move to Legal
  const availableOverdueLoans = useMemo(() => {
    return loans.filter(l => (
      l.status === LoanStatus.OVERDUE || 
      l.status === LoanStatus.LEGAL || 
      (l.remainingBalance > 0 && l.status !== LoanStatus.PAID)
    ));
  }, [loans]);

  // Financial Metrics
  const totalLitigationDebt = useMemo(() => {
    return legalCases
      .filter(c => c.status !== 'Cerrado' && c.status !== 'Recuperado')
      .reduce((sum, c) => sum + (c.totalLegalDebt || c.initialDebt), 0);
  }, [legalCases]);

  const totalLegalCostsAccumulated = useMemo(() => {
    return legalCases.reduce((sum, c) => sum + (c.legalFees || 0) + (c.courtCosts || 0), 0);
  }, [legalCases]);

  const activeCasesCount = useMemo(() => {
    return legalCases.filter(c => c.status === 'En Trámite' || c.status === 'Acuerdo Vigente').length;
  }, [legalCases]);

  // Filter Cases
  const filteredCases = useMemo(() => {
    return legalCases.filter(c => {
      const matchesSearch = searchQuery === '' || 
        c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.expedienteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lawyerName && c.lawyerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.loanId && c.loanId.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStage = stageFilter === 'ALL' || c.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [legalCases, searchQuery, stageFilter]);

  // Open New Legal Case Handler
  const handleOpenCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanIdForCase) {
      toast.error('Seleccione un préstamo para trasladar a cobranza legal');
      return;
    }

    const created = await openLegalCase({
      loanId: selectedLoanIdForCase,
      lawyerId: selectedLawyerIdForCase || undefined,
      courtJurisdiction: courtJurisdiction.trim() || undefined,
      initialLegalCost: Number(initialLegalCost) || 0,
      initialStage,
      notes: caseNotes.trim() || undefined
    });

    if (created) {
      setIsOpenCaseModalOpen(false);
      setSelectedLoanIdForCase('');
      setSelectedLawyerIdForCase('');
      setInitialLegalCost('0');
      setCaseNotes('');
    }
  };

  // Add Event Handler
  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForEvent || !eventTitle.trim()) {
      toast.error('Complete el título de la actuación');
      return;
    }

    const created = await addLegalEvent({
      caseId: selectedCaseForEvent.id,
      eventType,
      title: eventTitle.trim(),
      description: eventDescription.trim() || undefined,
      eventDate,
      cost: Number(eventCost) || 0,
      addToDebt,
      notaryOrBailiffName: bailiffName.trim() || undefined,
      documentNumber: docNumber.trim() || undefined,
      status: 'Completado'
    });

    if (created) {
      setIsEventModalOpen(false);
      setSelectedCaseForEvent(null);
      setEventTitle('');
      setEventDescription('');
      setEventCost('0');
      setBailiffName('');
      setDocNumber('');
    }
  };

  // Create Agreement Handler
  const handleCreateAgreementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForAgreement || Number(agreedTotal) <= 0) {
      toast.error('Ingrese el monto total pactado en el acuerdo');
      return;
    }

    const totalVal = Number(agreedTotal);
    const downVal = Number(agreementDownPayment) || 0;
    const installmentsCountVal = Math.max(1, agreementInstallments);
    const installmentAmt = Math.round(((totalVal - downVal) / installmentsCountVal) * 100) / 100;

    const created = await createLegalAgreement({
      caseId: selectedCaseForAgreement.id,
      loanId: selectedCaseForAgreement.loanId,
      clientId: selectedCaseForAgreement.clientId,
      agreementDate,
      agreedTotal: totalVal,
      downPayment: downVal,
      installmentsCount: installmentsCountVal,
      installmentAmount: installmentAmt,
      frequency: agreementFrequency,
      homologatedByCourt,
      courtReference: courtReference.trim() || undefined,
      status: 'Cumpliendo',
      notes: agreementNotes.trim() || undefined
    });

    if (created) {
      setIsAgreementModalOpen(false);
      setSelectedCaseForAgreement(null);
      setAgreedTotal('');
      setAgreementDownPayment('0');
      setCourtReference('');
      setAgreementNotes('');
    }
  };

  // Lawyer CRUD Submit
  const handleSaveLawyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lawyerName.trim()) {
      toast.error('El nombre del abogado es obligatorio');
      return;
    }

    const payload = {
      name: lawyerName.trim(),
      firmName: firmName.trim() || undefined,
      rncOrCedula: lawyerRnc.trim() || undefined,
      phone: lawyerPhone.trim() || undefined,
      whatsapp: lawyerWhatsapp.trim() || undefined,
      email: lawyerEmail.trim() || undefined,
      address: lawyerAddress.trim() || undefined,
      feePercentage: Number(feePercentage) || 15,
      fixedFee: Number(fixedFee) || 0,
      status: 'Activo' as const
    };

    if (editingLawyerId) {
      await updateLawyer(editingLawyerId, payload);
    } else {
      await addLawyer(payload);
    }

    setIsLawyerModalOpen(false);
    setEditingLawyerId(null);
    setLawyerName('');
    setFirmName('');
    setLawyerRnc('');
    setLawyerPhone('');
    setLawyerWhatsapp('');
    setLawyerEmail('');
    setLawyerAddress('');
    setFeePercentage('15');
    setFixedFee('0');
  };

  // Open Lawyer Edit Modal
  const handleOpenEditLawyer = (l: LegalLawyer) => {
    setEditingLawyerId(l.id);
    setLawyerName(l.name);
    setFirmName(l.firmName || '');
    setLawyerRnc(l.rncOrCedula || '');
    setLawyerPhone(l.phone || '');
    setLawyerWhatsapp(l.whatsapp || '');
    setLawyerEmail(l.email || '');
    setLawyerAddress(l.address || '');
    setFeePercentage(String(l.feePercentage || 15));
    setFixedFee(String(l.fixedFee || 0));
    setIsLawyerModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" /> Cobro Compulsivo & Control Procesal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Expedientes de Cobranza Legal</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Traslado de préstamos a estatus jurídico, asignación de bufetes y abogados, control de gastos notariales que se suman a la deuda y bitácora procesal.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                setEditingLawyerId(null);
                setLawyerName('');
                setFirmName('');
                setLawyerRnc('');
                setLawyerPhone('');
                setLawyerWhatsapp('');
                setLawyerEmail('');
                setLawyerAddress('');
                setFeePercentage('15');
                setFixedFee('0');
                setIsLawyerModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 text-xs flex items-center gap-1.5 transition-all"
            >
              <User className="w-3.5 h-3.5" /> + Abogado / Firma
            </button>
            <button
              onClick={() => setIsOpenCaseModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all text-xs flex items-center gap-2"
            >
              <Gavel className="w-4 h-4" /> + Iniciar Expediente Legal
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cartera en Litigio"
          value={`RD$ ${totalLitigationDebt.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend="Total Deuda Base + Gastos"
          trendUp={false}
          icon={Scale}
          gradient="bg-gradient-to-br from-rose-600 to-red-700"
          glowColor="shadow-rose-500/20"
        />
        <StatCard
          title="Expedientes Activos"
          value={String(activeCasesCount)}
          trend={`${legalCases.filter(c => c.status === 'Acuerdo Vigente').length} Acuerdos de Pago`}
          trendUp={true}
          icon={Gavel}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          glowColor="shadow-amber-500/20"
        />
        <StatCard
          title="Gastos Legales y Alguacil"
          value={`RD$ ${totalLegalCostsAccumulated.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend="Sumados a la Deuda del Cliente"
          trendUp={true}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-indigo-600 to-purple-700"
          glowColor="shadow-indigo-500/20"
        />
        <StatCard
          title="Abogados y Firmas"
          value={String(lawyers.length)}
          trend={`${lawyers.filter(l => l.status === 'Activo').length} Disponibles`}
          trendUp={true}
          icon={Building2}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          glowColor="shadow-emerald-500/20"
        />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          <button 
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cases' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" /> Expedientes en Trámite ({legalCases.length})
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'timeline' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Bitácora Procesal ({legalEvents.length})
          </button>
          <button 
            onClick={() => setActiveTab('agreements')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'agreements' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Acuerdos Homologados ({legalAgreements.length})
          </button>
          <button 
            onClick={() => setActiveTab('lawyers')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'lawyers' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Directorio de Abogados ({lawyers.length})
          </button>
        </div>

        <button
          onClick={refreshLegalData}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── TAB 1: EXPEDIENTES EN TRÁMITE ─── */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, expediente, abogado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <CustomSelect
              value={stageFilter}
              onChange={(val) => setStageFilter(val)}
              options={[
                { value: 'ALL', label: 'Todas las Etapas Procesales' },
                { value: 'Intimación Extrajudicial', label: 'Intimación Extrajudicial' },
                { value: 'Demanda Principal', label: 'Demanda Principal' },
                { value: 'Embargo en Trámite', label: 'Embargos (Retentivo / Ejecutivo)' },
                { value: 'Audiencia / Juicio', label: 'Audiencias en Tribunal' },
                { value: 'Sentencia Obtenida', label: 'Sentencia Obtenida' },
                { value: 'Acuerdo de Pago', label: 'Acuerdo Homologado' },
                { value: 'Cerrado / Recuperado', label: 'Cerrado / Recuperado' },
              ]}
              className="w-64 text-xs"
            />
          </div>

          {/* Legal Cases Grid */}
          {filteredCases.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Scale className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No hay expedientes jurídicos registrados</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Los préstamos morosos trasladados a cobro compulsivo aparecerán aquí con su historial de actuaciones y honorarios.
              </p>
              <button
                onClick={() => setIsOpenCaseModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <Gavel className="w-3.5 h-3.5" /> Iniciar Primer Expediente Legal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map((cs) => {
                const isOverdue = cs.status === 'En Trámite';
                return (
                  <div 
                    key={cs.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      
                      {/* Expediente Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {cs.expedienteNumber}
                          </span>
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1.5">{cs.clientName}</h3>
                          <p className="text-xs text-slate-400 font-mono">Préstamo #{formatLoanId(cs.loanId)}</p>
                        </div>
                        
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          cs.status === 'Recuperado' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200' 
                            : cs.status === 'Acuerdo Vigente'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 animate-pulse'
                        }`}>
                          {cs.status}
                        </span>
                      </div>

                      {/* Stage Pill */}
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                        <span>Etapa Procesal:</span>
                        <span className="font-bold">{cs.stage}</span>
                      </div>

                      {/* Financial Breakdown */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800 font-medium">
                        <div className="flex justify-between text-slate-500">
                          <span>Deuda Base Capital:</span>
                          <span className="font-mono">RD$ {cs.initialDebt.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                          <span>Gastos Legales & Actos:</span>
                          <span className="font-mono font-bold">+ RD$ {(cs.legalFees || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700 text-sm">
                          <span>Total Deuda Reclamada:</span>
                          <span className="font-mono text-rose-600 dark:text-rose-400">
                            RD$ {cs.totalLegalDebt.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Assigned Lawyer */}
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{cs.lawyerName ? `${cs.lawyerName} (${cs.lawyerFirm || 'Bufete'})` : 'Sin abogado asignado'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-5">{cs.courtJurisdiction || 'Tribunal Ordinario'}</p>
                      </div>

                    </div>

                    {/* Quick Action Footer Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedCaseForEvent(cs);
                            setEventTitle(`Acto de Notificación - ${cs.clientName}`);
                            setIsEventModalOpen(true);
                          }}
                          className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-xl text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Actuación / Gasto
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCaseForAgreement(cs);
                            setAgreedTotal(String(cs.totalLegalDebt));
                            setIsAgreementModalOpen(true);
                          }}
                          className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-xl text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Pactar Acuerdo
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingCaseDetail(cs)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Ver Expediente
                        </button>
                        {cs.status === 'En Trámite' && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Marcar el expediente de ${cs.clientName} como recuperado/saldado?`)) {
                                closeLegalCase(cs.id, 'Recuperado');
                              }
                            }}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                            title="Marcar Recuperado"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ─── TAB 2: BITÁCORA PROCESAL ─── */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Bitácora Procesal & Historial de Actuaciones</h3>
              <p className="text-xs text-slate-400">Registro cronológico de intimaciones notariales, actos de alguacil y comparecencias.</p>
            </div>
          </div>

          {legalEvents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No hay actuaciones registradas en la bitácora todavía.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900 ml-4 space-y-6 pl-6">
              {legalEvents.map((ev) => {
                const parentCase = legalCases.find(c => c.id === ev.caseId);
                return (
                  <div key={ev.id} className="relative space-y-1 group">
                    {/* Timeline Node Bullet */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-950 border border-white dark:border-slate-900" />
                    
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                            {ev.eventType}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{ev.eventDate}</span>
                          {parentCase && (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              • Caso: {parentCase.clientName} ({parentCase.expedienteNumber})
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">{ev.title}</h4>
                      </div>

                      {ev.cost > 0 && (
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 block">
                            RD$ {ev.cost.toLocaleString()}
                          </span>
                          {ev.addToDebt && (
                            <span className="text-[10px] text-emerald-600 font-semibold block">Sumado a la Deuda</span>
                          )}
                        </div>
                      )}
                    </div>

                    {ev.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">{ev.description}</p>
                    )}

                    {(ev.notaryOrBailiffName || ev.documentNumber) && (
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                        {ev.notaryOrBailiffName && <span>Alguacil / Notario: <b>{ev.notaryOrBailiffName}</b></span>}
                        {ev.documentNumber && <span>No. Acto: <b>{ev.documentNumber}</b></span>}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: ACUERDOS HOMOLOGADOS DE PAGO ─── */}
      {activeTab === 'agreements' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Acuerdos de Pago Homologados</h3>
              <p className="text-xs text-slate-400">Convenios transaccionales alcanzados con clientes para detener la ejecución judicial.</p>
            </div>
          </div>

          {legalAgreements.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No hay acuerdos transaccionales formalizados todavía.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {legalAgreements.map((agr) => {
                const parentCase = legalCases.find(c => c.id === agr.caseId);
                return (
                  <div key={agr.id} className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{parentCase?.clientName || 'Cliente'}</h4>
                        <p className="text-xs text-slate-400 font-mono">Expediente: {parentCase?.expedienteNumber || 'N/A'}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                        {agr.status}
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monto Acordado:</span>
                        <span className="font-mono font-bold text-indigo-600">RD$ {agr.agreedTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Inicial Pagado:</span>
                        <span className="font-mono">RD$ {agr.downPayment?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plan de Pago:</span>
                        <span>{agr.installmentsCount} cuotas de RD$ {agr.installmentAmount.toLocaleString()} ({agr.frequency})</span>
                      </div>
                      {agr.homologatedByCourt && (
                        <div className="flex justify-between text-emerald-600 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>Homologación Judicial:</span>
                          <span>{agr.courtReference || 'Aprobada'}</span>
                        </div>
                      )}
                    </div>

                    {agr.notes && <p className="text-xs text-slate-400 italic">{agr.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: DIRECTORIO DE ABOGADOS & FIRMAS ─── */}
      {activeTab === 'lawyers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Directorio de Abogados & Bufetes Jurídicos</h3>
              <p className="text-xs text-slate-400">Profesionales habilitados para la gestión de demandas y actos notariales.</p>
            </div>
            <button
              onClick={() => {
                setEditingLawyerId(null);
                setLawyerName('');
                setFirmName('');
                setLawyerRnc('');
                setLawyerPhone('');
                setLawyerWhatsapp('');
                setLawyerEmail('');
                setLawyerAddress('');
                setFeePercentage('15');
                setFixedFee('0');
                setIsLawyerModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Abogado
            </button>
          </div>

          {lawyers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No hay abogados registrados</h3>
              <p className="text-xs text-slate-400">Registre los abogados internos o firmas externas para asignarlos a los casos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lawyers.map((lw) => {
                const assignedCasesCount = legalCases.filter(c => c.lawyerId === lw.id && c.status === 'En Trámite').length;
                return (
                  <div key={lw.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{lw.name}</h4>
                          <p className="text-xs text-indigo-600 font-semibold">{lw.firmName || 'Abogado Independiente'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditLawyer(lw)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar al abogado ${lw.name}?`)) {
                                deleteLawyer(lw.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                        {lw.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" /> {lw.phone}
                          </div>
                        )}
                        {lw.email && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Mail className="w-3 h-3 text-slate-400" /> {lw.email}
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-slate-400">Honorarios / Comisión:</span>
                          <span className="font-bold text-indigo-600">{lw.feePercentage}% de recuperación</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Casos Asignados Activos:</span>
                          <span className="font-bold text-slate-800 dark:text-white">{assignedCasesCount} casos</span>
                        </div>
                      </div>
                    </div>

                    {lw.whatsapp && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <a
                          href={`https://wa.me/${lw.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" /> Contactar por WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: INICIAR EXPEDIENTE LEGAL ─── */}
      {isOpenCaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Gavel className="w-5 h-5 text-indigo-600" /> Traslado a Cobranza Legal (Cobro Compulsivo)
              </h3>
              <button onClick={() => setIsOpenCaseModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleOpenCaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Seleccionar Préstamo Moroso *
                </label>
                <CustomSelect
                  value={selectedLoanIdForCase}
                  onChange={(val) => setSelectedLoanIdForCase(val)}
                  options={[
                    { value: '', label: 'Seleccione un préstamo...' },
                    ...availableOverdueLoans.map(l => ({
                      value: l.id,
                      label: `${l.clientName} • Préstamo #${formatLoanId(l.id)} • Saldo RD$ ${l.remainingBalance.toLocaleString()}`
                    }))
                  ]}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Abogado / Firma Jurídica Asignada
                </label>
                <CustomSelect
                  value={selectedLawyerIdForCase}
                  onChange={(val) => setSelectedLawyerIdForCase(val)}
                  options={[
                    { value: '', label: 'Asignar más tarde / En gestión interna' },
                    ...lawyers.map(lw => ({ value: lw.id, label: `${lw.name} (${lw.firmName || 'Bufete'})` }))
                  ]}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tribunal / Jurisdicción
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juzgado de Paz de Santiago / Primera Instancia Civil"
                  value={courtJurisdiction}
                  onChange={(e) => setCourtJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Costo Inicial de Intimación Notarial / Acto (RD$)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={initialLegalCost}
                  onChange={(e) => setInitialLegalCost(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Se sumará automáticamente al saldo exigible del deudor.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas de Inicio / Motivo
                </label>
                <textarea
                  rows={2}
                  placeholder="Comentarios sobre intentos de cobro previo o acuerdos rotos..."
                  value={caseNotes}
                  onChange={(e) => setCaseNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpenCaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Abrir Expediente Legal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTRAR ACTUACIÓN / GASTO LEGAL ─── */}
      {isEventModalOpen && selectedCaseForEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Registrar Actuación & Gasto Legal</h3>
                <p className="text-xs text-slate-400">Expediente: {selectedCaseForEvent.expedienteNumber} ({selectedCaseForEvent.clientName})</p>
              </div>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddEventSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Actuación *</label>
                <CustomSelect
                  value={eventType}
                  onChange={(val) => setEventType(val as LegalEvent['eventType'])}
                  options={[
                    { value: 'Acto de Alguacil', label: 'Acto de Alguacil (Notificación)' },
                    { value: 'Intimación Notarial', label: 'Intimación de Pago y Puesta en Mora' },
                    { value: 'Embargo Retentivo', label: 'Embargo Retentivo (Bancos)' },
                    { value: 'Embargo Ejecutivo', label: 'Embargo Ejecutivo (Bienes Muebles)' },
                    { value: 'Audiencia', label: 'Audiencia / Comparecencia en Juzgado' },
                    { value: 'Sentencia', label: 'Sentencia / Mandamiento de Pago' },
                    { value: 'Acuerdo Homologado', label: 'Acuerdo Transaccional' },
                    { value: 'Otro', label: 'Otra Actuación Procesal' },
                  ]}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Título de la Actuación *</label>
                <input
                  type="text"
                  placeholder="Ej. Acto No. 492/2026 de Intimación de Pago"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Costo / Honorarios (RD$)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={eventCost}
                    onChange={(e) => setEventCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha del Acto</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <input
                  type="checkbox"
                  id="addToDebtCheck"
                  checked={addToDebt}
                  onChange={(e) => setAddToDebt(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="addToDebtCheck" className="text-xs font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                  Sumar este costo de honorarios/alguacil al saldo del deudor
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Alguacil / Notario Actuante</label>
                  <input
                    type="text"
                    placeholder="Ej. Lic. Pedro Martínez"
                    value={bailiffName}
                    onChange={(e) => setBailiffName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">No. de Acto / Protocolo</label>
                  <input
                    type="text"
                    placeholder="Ej. 104-2026"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Detalle / Resultados</label>
                <textarea
                  rows={2}
                  placeholder="Detalle de la notificación o acuerdo alcanzado..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Guardar en Bitácora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: FORMALIZAR ACUERDO DE PAGO HOMOLOGADO ─── */}
      {isAgreementModalOpen && selectedCaseForAgreement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Formalizar Acuerdo Homologado</h3>
                <p className="text-xs text-slate-400">Cliente: {selectedCaseForAgreement.clientName} ({selectedCaseForAgreement.expedienteNumber})</p>
              </div>
              <button onClick={() => setIsAgreementModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateAgreementSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Monto Total Acordado (RD$) *</label>
                  <input
                    type="number"
                    value={agreedTotal}
                    onChange={(e) => setAgreedTotal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pago Inicial Inmediato (RD$)</label>
                  <input
                    type="number"
                    value={agreementDownPayment}
                    onChange={(e) => setAgreementDownPayment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Cantidad de Cuotas</label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    value={agreementInstallments}
                    onChange={(e) => setAgreementInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Frecuencia</label>
                  <CustomSelect
                    value={agreementFrequency}
                    onChange={(val) => setAgreementFrequency(val as 'Semanal' | 'Quincenal' | 'Mensual')}
                    options={[
                      { value: 'Quincenal', label: 'Quincenal' },
                      { value: 'Mensual', label: 'Mensual' },
                      { value: 'Semanal', label: 'Semanal' },
                    ]}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <input
                  type="checkbox"
                  id="homologatedCheck"
                  checked={homologatedByCourt}
                  onChange={(e) => setHomologatedByCourt(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="homologatedCheck" className="text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
                  Acuerdo Homologado Judicialmente (Fuerza Ejecutoria Inmediata)
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Sentencia / Referencia de Homologación</label>
                <input
                  type="text"
                  placeholder="Ej. Auto No. 82/2026 de Homologación de Acuerdo"
                  value={courtReference}
                  onChange={(e) => setCourtReference(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Condiciones & Notas</label>
                <textarea
                  rows={2}
                  placeholder="Cláusulas penales en caso de incumplimiento de cuota..."
                  value={agreementNotes}
                  onChange={(e) => setAgreementNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAgreementModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Formalizar Acuerdo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTRAR / EDITAR ABOGADO ─── */}
      {isLawyerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingLawyerId ? 'Editar Abogado / Firma' : 'Registrar Abogado o Bufete'}
              </h3>
              <button onClick={() => setIsLawyerModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveLawyer} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo del Abogado *</label>
                <input
                  type="text"
                  placeholder="Ej. Lic. Manuel Alcántara"
                  value={lawyerName}
                  onChange={(e) => setLawyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Firma / Bufete Jurídico</label>
                <input
                  type="text"
                  placeholder="Ej. Alcántara & Asociados Abogados"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Cédula / RNC</label>
                  <input
                    type="text"
                    placeholder="001-0000000-0"
                    value={lawyerRnc}
                    onChange={(e) => setLawyerRnc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono / Celular</label>
                  <input
                    type="tel"
                    placeholder="809-000-0000"
                    value={lawyerPhone}
                    onChange={(e) => { setLawyerPhone(e.target.value); setLawyerWhatsapp(e.target.value); }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="abogado@firma.com"
                  value={lawyerEmail}
                  onChange={(e) => setLawyerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">% Honorarios Sobre Cobro</label>
                  <input
                    type="number"
                    value={feePercentage}
                    onChange={(e) => setFeePercentage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tarifa Fija por Caso (RD$)</label>
                  <input
                    type="number"
                    value={fixedFee}
                    onChange={(e) => setFixedFee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLawyerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  {editingLawyerId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DETALLE COMPLETO DEL EXPEDIENTE ─── */}
      {viewingCaseDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200">
                  {viewingCaseDetail.expedienteNumber}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                  Expediente Judicial: {viewingCaseDetail.clientName}
                </h3>
              </div>
              <button onClick={() => setViewingCaseDetail(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente Deudor</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{viewingCaseDetail.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Abogado Asignado</span>
                  <span className="font-semibold text-indigo-600">{viewingCaseDetail.lawyerName || 'Gestión Interna'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Etapa Procesal Actual</span>
                  <span className="font-bold text-amber-600">{viewingCaseDetail.stage}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tribunal</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewingCaseDetail.courtJurisdiction || 'Ordinario'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">Deuda Base</span>
                  <span className="font-mono font-bold text-xs">RD$ {viewingCaseDetail.initialDebt.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-indigo-500 block font-bold">Costas & Honorarios</span>
                  <span className="font-mono font-bold text-xs text-indigo-600">+ RD$ {(viewingCaseDetail.legalFees || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
                  <span className="text-[10px] text-rose-600 block font-bold">Total Reclamado</span>
                  <span className="font-mono font-black text-xs text-rose-600">RD$ {viewingCaseDetail.totalLegalDebt.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actuaciones del Expediente */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Actuaciones en este Expediente</h4>
              {legalEvents.filter(e => e.caseId === viewingCaseDetail.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay actuaciones registradas en este caso.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {legalEvents.filter(e => e.caseId === viewingCaseDetail.id).map(ev => (
                    <div key={ev.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs flex items-center justify-between border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{ev.title}</span>
                        <p className="text-[10px] text-slate-400 font-mono">{ev.eventType} • {ev.eventDate}</p>
                      </div>
                      {ev.cost > 0 && <span className="font-mono font-bold text-rose-600">RD$ {ev.cost.toLocaleString()}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Carátula
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LegalCollectionPage;
