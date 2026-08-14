import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Lock, Key, FileText, Search, Plus, 
  Sparkles, Filter, CheckCircle2, Clock, AlertTriangle, 
  DollarSign, ArrowUpRight, ArrowDownLeft, Eye, Edit, 
  Trash2, Printer, X, RefreshCw, Car, Gem, Home, Smartphone, 
  Package, Gavel, User, Calendar, Check, Send, AlertCircle
} from 'lucide-react';
import { useVault, useLoans, useClients, useSettings } from '../context/StoreContext';
import { 
  VaultCollateral, VaultCustodyLog, VaultCustodyStatus, 
  VaultMovementType, VaultItemType, PaymentMethod, formatLoanId 
} from '../types';
import StatCard from '../components/StatCard';
import { CustomSelect } from '../components/CustomSelect';
import { toast } from 'sonner';

export const VaultCustodyPage: React.FC = () => {
  const { 
    vaultCollaterals, custodyLogs, isLoadingVault,
    refreshVaultData, registerVaultCollateral, recordCustodyMovement,
    adjudicateCollateral, liquidateAuctionCollateral, updateVaultCollateral, deleteVaultCollateral 
  } = useVault();
  const { loans } = useLoans();
  const { clients } = useClients();
  const { companySettings } = useSettings();

  const [activeTab, setActiveTab] = useState<'inventory' | 'logs' | 'auctions'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal: Register Collateral in Vault
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [clientName, setClientName] = useState('');
  const [itemType, setItemType] = useState<VaultItemType>('Vehículo');
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [serialOrRef, setSerialOrRef] = useState('');
  const [appraisedValue, setAppraisedValue] = useState('');
  const [loanDebtBalance, setLoanDebtBalance] = useState('');
  const [vaultLocation, setVaultLocation] = useState('Caja Fuerte Principal');
  const [drawerOrShelf, setDrawerOrShelf] = useState('');
  const [sealNumber, setSealNumber] = useState(`PREC-${Math.floor(100000 + Math.random() * 900000)}`);
  const [custodianName, setCustodianName] = useState('Custodio de Bóveda');
  const [hasOriginalDocuments, setHasOriginalDocuments] = useState(true);
  const [documentsList, setDocumentsList] = useState('Matrícula Original, Pagaré Notarial, Contrato Firmado');
  const [hasKeys, setHasKeys] = useState(false);
  const [keysCount, setKeysCount] = useState(1);

  // Modal: Record Custody Movement (Salida / Reingreso / Devolución)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedCollateralForMovement, setSelectedCollateralForMovement] = useState<VaultCollateral | null>(null);
  const [movementType, setMovementType] = useState<VaultMovementType>('Salida Temporal');
  const [movementAuthorizedBy, setMovementAuthorizedBy] = useState('Gerencia General');
  const [movementReceivedBy, setMovementReceivedBy] = useState('');
  const [movementNewSeal, setMovementNewSeal] = useState('');
  const [movementKeysDelivered, setMovementKeysDelivered] = useState(false);
  const [movementDocsDelivered, setMovementDocsDelivered] = useState(false);
  const [movementReason, setMovementReason] = useState('');

  // Modal: Adjudication for Auction
  const [isAdjudicateModalOpen, setIsAdjudicateModalOpen] = useState(false);
  const [selectedCollateralForAdjudication, setSelectedCollateralForAdjudication] = useState<VaultCollateral | null>(null);
  const [auctionMinPrice, setAuctionMinPrice] = useState('');
  const [adjudicationNotes, setAdjudicationNotes] = useState('');

  // Modal: Liquidation / Auction Sale
  const [isLiquidateModalOpen, setIsLiquidateModalOpen] = useState(false);
  const [selectedCollateralForLiquidation, setSelectedCollateralForLiquidation] = useState<VaultCollateral | null>(null);
  const [liquidationPrice, setLiquidationPrice] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [liquidationPaymentMethod, setLiquidationPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [closeAssociatedLoan, setCloseAssociatedLoan] = useState(true);

  // Modal: Printable Vault Receipt / Ficha de Custodia
  const [viewingVaultReceipt, setViewingVaultReceipt] = useState<VaultCollateral | null>(null);

  // Financial Metrics
  const totalAppraisedInVault = useMemo(() => {
    return vaultCollaterals
      .filter(c => c.custodyStatus === 'En Bóveda / Custodia')
      .reduce((sum, c) => sum + (c.appraisedValue || 0), 0);
  }, [vaultCollaterals]);

  const inVaultCount = useMemo(() => {
    return vaultCollaterals.filter(c => c.custodyStatus === 'En Bóveda / Custodia').length;
  }, [vaultCollaterals]);

  const inAuctionCount = useMemo(() => {
    return vaultCollaterals.filter(c => c.custodyStatus === 'Adjudicado').length;
  }, [vaultCollaterals]);

  const temporaryExitCount = useMemo(() => {
    return vaultCollaterals.filter(c => c.custodyStatus === 'Retirado Temporalmente').length;
  }, [vaultCollaterals]);

  // Filter Collaterals
  const filteredCollaterals = useMemo(() => {
    return vaultCollaterals.filter(c => {
      const matchesSearch = searchQuery === '' ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.sealNumber && c.sealNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.serialOrRef && c.serialOrRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.vaultLocation && c.vaultLocation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLocation = locationFilter === 'ALL' || c.vaultLocation.includes(locationFilter);
      const matchesType = typeFilter === 'ALL' || c.itemType === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || c.custodyStatus === statusFilter;

      return matchesSearch && matchesLocation && matchesType && matchesStatus;
    });
  }, [vaultCollaterals, searchQuery, locationFilter, typeFilter, statusFilter]);

  // Auto populate when selecting a loan
  const handleLoanSelect = (loanId: string) => {
    setSelectedLoanId(loanId);
    if (!loanId) return;
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      setClientName(loan.clientName);
      setLoanDebtBalance(String(loan.remainingBalance || loan.amount));
      
      const coll = loan.collateral;
      if (coll && typeof coll === 'object') {
        const colObj = coll as Record<string, unknown>;
        const desc = String(colObj.description || colObj.brand || colObj.model || '');
        const ref = String(colObj.refNumber || colObj.imei || loan.collateralRef || '');
        const typeStr = String(colObj.type || '');
        
        if (desc) setItemTitle(desc);
        if (ref) setSerialOrRef(ref);
        if (typeStr.includes('Vehículo')) setItemType('Vehículo');
        else if (typeStr.includes('Propiedad')) setItemType('Propiedad / Título Inmobiliario');
        else if (typeStr.includes('Joya') || typeStr.includes('Oro')) setItemType('Joyas / Oro');
        else if (typeStr.includes('Celular') || typeStr.includes('Teléfono')) setItemType('Celular / Tecnología');
        else if (typeStr.includes('Electrodoméstico')) setItemType('Electrodoméstico');
      } else {
        setItemTitle(`Garantía de Préstamo #${formatLoanId(loan.id)}`);
      }
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !clientName.trim()) {
      toast.error('Complete el título del artículo y nombre del cliente');
      return;
    }

    const created = await registerVaultCollateral({
      loanId: selectedLoanId || undefined,
      clientName: clientName.trim(),
      itemType,
      title: itemTitle.trim(),
      description: itemDescription.trim() || undefined,
      serialOrRef: serialOrRef.trim() || undefined,
      appraisedValue: Number(appraisedValue) || 0,
      loanDebtBalance: Number(loanDebtBalance) || 0,
      vaultLocation: vaultLocation.trim() || 'Bóveda Principal',
      drawerOrShelf: drawerOrShelf.trim() || undefined,
      sealNumber: sealNumber.trim() || undefined,
      custodyStatus: 'En Bóveda / Custodia',
      custodianName: custodianName.trim() || undefined,
      entryDate: new Date().toISOString().split('T')[0],
      hasOriginalDocuments,
      documentsList: hasOriginalDocuments ? documentsList.trim() : undefined,
      hasKeys,
      keysCount: hasKeys ? keysCount : 0
    });

    if (created) {
      setIsRegisterModalOpen(false);
      setSelectedLoanId('');
      setClientName('');
      setItemTitle('');
      setItemDescription('');
      setSerialOrRef('');
      setAppraisedValue('');
      setLoanDebtBalance('');
      setDrawerOrShelf('');
      setSealNumber(`PREC-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  };

  // Submit Custody Movement
  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollateralForMovement || !movementReceivedBy.trim()) {
      toast.error('Indique quién recibe el artículo/documentos');
      return;
    }

    const created = await recordCustodyMovement({
      collateralId: selectedCollateralForMovement.id,
      movementType,
      authorizedBy: movementAuthorizedBy.trim(),
      receivedBy: movementReceivedBy.trim(),
      sealNumber: movementNewSeal.trim() || selectedCollateralForMovement.sealNumber,
      keysDelivered: movementKeysDelivered,
      documentsDelivered: movementDocsDelivered,
      reason: movementReason.trim() || undefined
    });

    if (created) {
      setIsMovementModalOpen(false);
      setSelectedCollateralForMovement(null);
      setMovementReceivedBy('');
      setMovementReason('');
      setMovementNewSeal('');
    }
  };

  // Submit Adjudication
  const handleAdjudicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollateralForAdjudication) return;

    await adjudicateCollateral(selectedCollateralForAdjudication.id, {
      auctionMinPrice: Number(auctionMinPrice) || 0,
      adjudicationNotes: adjudicationNotes.trim() || undefined
    });

    setIsAdjudicateModalOpen(false);
    setSelectedCollateralForAdjudication(null);
    setAuctionMinPrice('');
    setAdjudicationNotes('');
  };

  // Submit Liquidation / Auction
  const handleLiquidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollateralForLiquidation || !buyerName.trim() || Number(liquidationPrice) <= 0) {
      toast.error('Ingrese el precio de venta y nombre del comprador');
      return;
    }

    await liquidateAuctionCollateral(selectedCollateralForLiquidation.id, {
      liquidationPrice: Number(liquidationPrice),
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim() || undefined,
      paymentMethod: liquidationPaymentMethod,
      closeLoan: closeAssociatedLoan
    });

    setIsLiquidateModalOpen(false);
    setSelectedCollateralForLiquidation(null);
    setLiquidationPrice('');
    setBuyerName('');
    setBuyerPhone('');
  };

  // Helper Item Icon
  const getItemIcon = (type: VaultItemType) => {
    switch (type) {
      case 'Vehículo': return Car;
      case 'Joyas / Oro': return Gem;
      case 'Propiedad / Título Inmobiliario': return Home;
      case 'Celular / Tecnología': return Smartphone;
      case 'Electrodoméstico': return Package;
      default: return ShieldCheck;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" /> Bóveda, Precintos & Empeños Prendarios
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Control Físico de Bóveda & Custodia</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Ubicación física exacta de garantías (Gavetas, Cajas Fuertes, Parqueos), control de precintos de seguridad, custodia documental de matrículas/títulos y adjudicación a remate.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedLoanId('');
                setClientName('');
                setItemTitle('');
                setItemDescription('');
                setSerialOrRef('');
                setAppraisedValue('');
                setLoanDebtBalance('');
                setIsRegisterModalOpen(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> + Ingresar Garantía a Bóveda
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Valor en Custodia Bóveda"
          value={`RD$ ${totalAppraisedInVault.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend="Total Avalúo Físico Resguardado"
          trendUp={true}
          icon={Lock}
          gradient="bg-gradient-to-br from-sky-600 to-blue-700"
          glowColor="shadow-sky-500/20"
        />
        <StatCard
          title="Garantías en Bóveda"
          value={String(inVaultCount)}
          trend="En Gavetas y Cajas Fuertes"
          trendUp={true}
          icon={ShieldCheck}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          glowColor="shadow-emerald-500/20"
        />
        <StatCard
          title="En Proceso de Remate"
          value={String(inAuctionCount)}
          trend="Garantías Adjudicadas por Mora"
          trendUp={false}
          icon={Gavel}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          glowColor="shadow-amber-500/20"
        />
        <StatCard
          title="Salidas Temporales"
          value={String(temporaryExitCount)}
          trend="Documentos / Llaves Prestadas"
          trendUp={false}
          icon={Key}
          gradient="bg-gradient-to-br from-purple-600 to-indigo-700"
          glowColor="shadow-purple-500/20"
        />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'inventory' 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-600'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Inventario Físico de Bóveda ({vaultCollaterals.length})
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'logs' 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-600'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> Control de Precintos & Llaves ({custodyLogs.length})
          </button>
          <button 
            onClick={() => setActiveTab('auctions')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'auctions' 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-600'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" /> Adjudicación & Remates ({vaultCollaterals.filter(c => c.custodyStatus === 'Adjudicado' || c.custodyStatus === 'Rematado / Liquidado').length})
          </button>
        </div>

        <button
          onClick={refreshVaultData}
          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── TAB 1: INVENTARIO FÍSICO DE BÓVEDA ─── */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar artículo, cliente, precinto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <CustomSelect
              value={locationFilter}
              onChange={(val) => setLocationFilter(val)}
              options={[
                { value: 'ALL', label: 'Todas las Ubicaciones' },
                { value: 'Caja Fuerte Principal', label: 'Caja Fuerte Principal' },
                { value: 'Caja Fuerte 2', label: 'Caja Fuerte 2 (Joyas)' },
                { value: 'Gaveta', label: 'Gavetas de Seguridad' },
                { value: 'Parqueo', label: 'Parqueo / Patio de Vehículos' },
                { value: 'Almacén', label: 'Almacén Central' },
              ]}
              className="text-xs"
            />

            <CustomSelect
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              options={[
                { value: 'ALL', label: 'Todos los Tipos' },
                { value: 'Vehículo', label: 'Vehículos' },
                { value: 'Joyas / Oro', label: 'Joyas / Oro' },
                { value: 'Propiedad / Título Inmobiliario', label: 'Títulos Inmobiliarios' },
                { value: 'Celular / Tecnología', label: 'Celulares & Tecnología' },
                { value: 'Electrodoméstico', label: 'Electrodomésticos' },
              ]}
              className="text-xs"
            />

            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'ALL', label: 'Todos los Estados' },
                { value: 'En Bóveda / Custodia', label: 'En Bóveda / Custodia' },
                { value: 'Retirado Temporalmente', label: 'Retirado Temporalmente' },
                { value: 'Adjudicado', label: 'Adjudicado (Para Remate)' },
                { value: 'Rematado / Liquidado', label: 'Rematado / Liquidado' },
                { value: 'Devuelto al Cliente', label: 'Devuelto al Cliente' },
              ]}
              className="text-xs"
            />
          </div>

          {/* Collaterals Grid */}
          {filteredCollaterals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <Lock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No hay artículos o garantías en la bóveda</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Registre garantías prendarias con su ubicación física exacta, precinto de seguridad y control documental.
              </p>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Ingresar Primera Garantía
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollaterals.map((item) => {
                const ItemIcon = getItemIcon(item.itemType);
                return (
                  <div 
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      
                      {/* Header Item */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-200 dark:border-sky-800">
                            <ItemIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.itemType}
                            </span>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1 leading-tight">{item.title}</h3>
                            <p className="text-xs text-slate-400 font-mono">Cliente: {item.clientName}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          item.custodyStatus === 'En Bóveda / Custodia' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                            : item.custodyStatus === 'Adjudicado'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 animate-pulse'
                              : item.custodyStatus === 'Rematado / Liquidado'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                        }`}>
                          {item.custodyStatus}
                        </span>
                      </div>

                      {/* Exact Physical Location & Seal */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-2 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-semibold">Ubicación Física:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.vaultLocation} {item.drawerOrShelf ? `• ${item.drawerOrShelf}` : ''}
                          </span>
                        </div>

                        {item.sealNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">Precinto de Seguridad:</span>
                            <span className="font-mono font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                              {item.sealNumber}
                            </span>
                          </div>
                        )}

                        {item.serialOrRef && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">Matrícula / Serial:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">{item.serialOrRef}</span>
                          </div>
                        )}
                      </div>

                      {/* Keys & Document Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.hasOriginalDocuments && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                            <FileText className="w-3 h-3" /> Título / Matrícula Original
                          </span>
                        )}
                        {item.hasKeys && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold">
                            <Key className="w-3 h-3" /> {item.keysCount} Juego(s) de Llaves
                          </span>
                        )}
                      </div>

                      {/* Appraised Value vs Loan Debt */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-slate-500">
                          <span>Valor Tasado (Avalúo):</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">RD$ {item.appraisedValue.toLocaleString()}</span>
                        </div>
                        {item.loanDebtBalance > 0 && (
                          <div className="flex justify-between text-rose-600 font-medium">
                            <span>Deuda de Préstamo:</span>
                            <span className="font-mono">RD$ {item.loanDebtBalance.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Action Buttons Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedCollateralForMovement(item);
                            setMovementType(item.custodyStatus === 'En Bóveda / Custodia' ? 'Salida Temporal' : 'Reingreso a Bóveda');
                            setMovementKeysDelivered(item.hasKeys);
                            setMovementDocsDelivered(item.hasOriginalDocuments);
                            setIsMovementModalOpen(true);
                          }}
                          className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 dark:text-sky-300 rounded-xl text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1"
                        >
                          <Key className="w-3 h-3" /> Movimiento
                        </button>
                        
                        {item.custodyStatus === 'En Bóveda / Custodia' && (
                          <button
                            onClick={() => {
                              setSelectedCollateralForAdjudication(item);
                              setAuctionMinPrice(String(item.loanDebtBalance || item.appraisedValue));
                              setIsAdjudicateModalOpen(true);
                            }}
                            className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 rounded-xl text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1"
                          >
                            <Gavel className="w-3 h-3" /> Adjudicar
                          </button>
                        )}

                        {item.custodyStatus === 'Adjudicado' && (
                          <button
                            onClick={() => {
                              setSelectedCollateralForLiquidation(item);
                              setLiquidationPrice(String(item.auctionMinPrice || item.loanDebtBalance));
                              setIsLiquidateModalOpen(true);
                            }}
                            className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-xl text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" /> Liquidar / Vender
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setViewingVaultReceipt(item)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Ficha de Custodia & Recibo
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ─── TAB 2: CONTROL DE PRECINTOS, LLAVES & MOVIMIENTOS ─── */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Bitácora de Precintos, Llaves y Custodia</h3>
              <p className="text-xs text-slate-400">Control de entradas, salidas temporales y devoluciones de documentos y llaves.</p>
            </div>
          </div>

          {custodyLogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <Key className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No hay movimientos registrados en la bitácora todavía.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-sky-200 dark:border-sky-900 ml-4 space-y-6 pl-6">
              {custodyLogs.map((log) => {
                const parentItem = vaultCollaterals.find(c => c.id === log.collateralId);
                return (
                  <div key={log.id} className="relative space-y-1 group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-sky-600 ring-4 ring-sky-100 dark:ring-sky-950 border border-white dark:border-slate-900" />
                    
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                            log.movementType === 'Ingreso a Bóveda' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.movementType === 'Salida Temporal'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : log.movementType === 'Devolución Definitiva'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {log.movementType}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{log.movementDate}</span>
                          {parentItem && (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              • Artículo: {parentItem.title} ({parentItem.clientName})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1 font-medium">
                          <span>Autorizó: <b>{log.authorizedBy}</b></span>
                          <span>• Recibió: <b>{log.receivedBy}</b></span>
                          {log.sealNumber && <span>• Precinto: <b className="font-mono text-sky-600">{log.sealNumber}</b></span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {log.keysDelivered && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Llaves Entregadas
                          </span>
                        )}
                        {log.documentsDelivered && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Documentos Entregados
                          </span>
                        )}
                      </div>
                    </div>

                    {log.reason && <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">Motivo: {log.reason}</p>}
                    {log.notes && <p className="text-xs text-slate-400 italic">Notas: {log.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: ADJUDICACIÓN & REMATES DE GARANTÍAS ─── */}
      {activeTab === 'auctions' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Catálogo de Remate & Liquidación de Garantías</h3>
              <p className="text-xs text-slate-400">Venta de artículos adjudicados de préstamos castigados para la recuperación de capital.</p>
            </div>
          </div>

          {vaultCollaterals.filter(c => c.custodyStatus === 'Adjudicado' || c.custodyStatus === 'Rematado / Liquidado').length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <Gavel className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No hay garantías en proceso de adjudicación o remate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultCollaterals.filter(c => c.custodyStatus === 'Adjudicado' || c.custodyStatus === 'Rematado / Liquidado').map((item) => (
                <div key={item.id} className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 font-mono">Deudor: {item.clientName}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.custodyStatus === 'Rematado / Liquidado'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 animate-pulse'
                    }`}>
                      {item.custodyStatus}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Precio Base de Remate:</span>
                      <span className="font-mono font-bold text-indigo-600">RD$ {(item.auctionMinPrice || 0).toLocaleString()}</span>
                    </div>
                    {item.liquidationPrice && item.liquidationPrice > 0 ? (
                      <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>Vendido por:</span>
                        <span className="font-mono">RD$ {item.liquidationPrice.toLocaleString()}</span>
                      </div>
                    ) : null}
                    {item.buyerName && (
                      <div className="flex justify-between text-slate-500">
                        <span>Comprador:</span>
                        <span>{item.buyerName} {item.buyerPhone ? `(${item.buyerPhone})` : ''}</span>
                      </div>
                    )}
                  </div>

                  {item.custodyStatus === 'Adjudicado' && (
                    <button
                      onClick={() => {
                        setSelectedCollateralForLiquidation(item);
                        setLiquidationPrice(String(item.auctionMinPrice || item.loanDebtBalance));
                        setIsLiquidateModalOpen(true);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Registrar Venta en Remate
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: INGRESAR GARANTÍA A BÓVEDA ─── */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-sky-600" /> Ingreso de Garantía Prendaria a Bóveda
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vincular a Préstamo (Opcional)
                </label>
                <CustomSelect
                  value={selectedLoanId}
                  onChange={(val) => handleLoanSelect(val)}
                  options={[
                    { value: '', label: 'Garantía / Empeño Independiente (Sin Préstamo)' },
                    ...loans.filter(l => l.remainingBalance > 0).map(l => ({
                      value: l.id,
                      label: `${l.clientName} • Préstamo #${formatLoanId(l.id)} • Saldo RD$ ${l.remainingBalance.toLocaleString()}`
                    }))
                  ]}
                  className="w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Deudor / Depositante *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Artículo</label>
                  <CustomSelect
                    value={itemType}
                    onChange={(val) => setItemType(val as VaultItemType)}
                    options={[
                      { value: 'Vehículo', label: 'Vehículo (Auto / Moto)' },
                      { value: 'Joyas / Oro', label: 'Joyas / Oro / Reloj' },
                      { value: 'Propiedad / Título Inmobiliario', label: 'Título Inmobiliario' },
                      { value: 'Celular / Tecnología', label: 'Celular / Laptop' },
                      { value: 'Electrodoméstico', label: 'Electrodoméstico' },
                      { value: 'Otro', label: 'Otro Artículo' },
                    ]}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Descripción del Artículo *</label>
                <input
                  type="text"
                  placeholder="Ej. Anillo de Oro 14k 8.5g / Toyota Hilux 2022 Blanca"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Matrícula / Chasis / IMEI / Serial</label>
                  <input
                    type="text"
                    value={serialOrRef}
                    onChange={(e) => setSerialOrRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Tasado / Avalúo (RD$)</label>
                  <input
                    type="number"
                    value={appraisedValue}
                    onChange={(e) => setAppraisedValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-sky-600"
                  />
                </div>
              </div>

              {/* Physical Vault Location & Precinto */}
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-3">
                <h4 className="font-bold text-[11px] text-sky-900 dark:text-sky-200">Ubicación Física en Bóveda & Precinto</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">Bóveda / Depósito</label>
                    <CustomSelect
                      value={vaultLocation}
                      onChange={(val) => setVaultLocation(val)}
                      options={[
                        { value: 'Caja Fuerte Principal', label: 'Caja Fuerte Principal' },
                        { value: 'Caja Fuerte 2 (Joyas)', label: 'Caja Fuerte 2 (Joyas)' },
                        { value: 'Estante de Bóveda 1', label: 'Estante de Bóveda 1' },
                        { value: 'Parqueo / Patio 1', label: 'Parqueo / Patio 1 (Vehículos)' },
                        { value: 'Almacén Central', label: 'Almacén Central' },
                      ]}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">Gaveta / Casillero / Posición</label>
                    <input
                      type="text"
                      placeholder="Ej. Gaveta B-4 / Posición 12"
                      value={drawerOrShelf}
                      onChange={(e) => setDrawerOrShelf(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">No. de Precinto de Seguridad</label>
                    <input
                      type="text"
                      value={sealNumber}
                      onChange={(e) => setSealNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">Oficial Custodio Responsable</label>
                    <input
                      type="text"
                      value={custodianName}
                      onChange={(e) => setCustodianName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Custodia Documental y Llaves */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="origDocsCheck"
                      checked={hasOriginalDocuments}
                      onChange={(e) => setHasOriginalDocuments(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded"
                    />
                    <label htmlFor="origDocsCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Custodia de Documentos Originales (Matrícula, Título, Pagaré)
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="keysCheck"
                      checked={hasKeys}
                      onChange={(e) => setHasKeys(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded"
                    />
                    <label htmlFor="keysCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Custodia de Llaves Físicas
                    </label>
                  </div>
                  {hasKeys && (
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={keysCount}
                      onChange={(e) => setKeysCount(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg text-xs font-mono text-center"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Ingresar a Bóveda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTRAR MOVIMIENTO DE CUSTODIA (SALIDA / REINGRESO / DEVOLUCIÓN) ─── */}
      {isMovementModalOpen && selectedCollateralForMovement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Registrar Movimiento de Custodia</h3>
                <p className="text-xs text-slate-400">{selectedCollateralForMovement.title} ({selectedCollateralForMovement.clientName})</p>
              </div>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleMovementSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Movimiento *</label>
                <CustomSelect
                  value={movementType}
                  onChange={(val) => setMovementType(val as VaultMovementType)}
                  options={[
                    { value: 'Salida Temporal', label: 'Salida Temporal (Inspección / Peritaje / Traspaso)' },
                    { value: 'Reingreso a Bóveda', label: 'Reingreso a Bóveda (Retorno de Custodia)' },
                    { value: 'Devolución Definitiva', label: 'Devolución Definitiva (Préstamo Saldado)' },
                  ]}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Entregado a / Recibido por *</label>
                <input
                  type="text"
                  placeholder="Ej. Nombre del Oficial / Perito / Cliente"
                  value={movementReceivedBy}
                  onChange={(e) => setMovementReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Autorizado por</label>
                <input
                  type="text"
                  value={movementAuthorizedBy}
                  onChange={(e) => setMovementAuthorizedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              {movementType === 'Reingreso a Bóveda' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Nuevo No. de Precinto de Seguridad</label>
                  <input
                    type="text"
                    placeholder="PREC-XXXXXX"
                    value={movementNewSeal}
                    onChange={(e) => setMovementNewSeal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-sky-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Motivo del Movimiento</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Retiro de matrícula para traspaso en DGII / Entrega tras saldo total de deuda..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADJUDICAR GARANTÍA PARA REMATE ─── */}
      {isAdjudicateModalOpen && selectedCollateralForAdjudication && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Gavel className="w-5 h-5 text-amber-600" /> Adjudicar Garantía por Mora
                </h3>
                <p className="text-xs text-slate-400">{selectedCollateralForAdjudication.title} ({selectedCollateralForAdjudication.clientName})</p>
              </div>
              <button onClick={() => setIsAdjudicateModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAdjudicateSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Proceso de Dación en Pago / Ejecución Prendaria</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  El artículo pasará a propiedad de la empresa y quedará habilitado en el catálogo de remates para su venta y recuperación de capital.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Precio Base Mínimo de Remate (RD$) *</label>
                <input
                  type="number"
                  value={auctionMinPrice}
                  onChange={(e) => setAuctionMinPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Notas de Adjudicación</label>
                <textarea
                  rows={2}
                  placeholder="Detalle de mora, pacto comisorio o acuerdo de dación en pago firmado..."
                  value={adjudicationNotes}
                  onChange={(e) => setAdjudicationNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjudicateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Confirmar Adjudicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: LIQUIDAR / VENDER EN REMATE ─── */}
      {isLiquidateModalOpen && selectedCollateralForLiquidation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                  <DollarSign className="w-5 h-5 text-emerald-600" /> Liquidar / Vender en Remate
                </h3>
                <p className="text-xs text-slate-400">{selectedCollateralForLiquidation.title}</p>
              </div>
              <button onClick={() => setIsLiquidateModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleLiquidateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Precio Final de Venta (RD$) *</label>
                  <input
                    type="number"
                    value={liquidationPrice}
                    onChange={(e) => setLiquidationPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Método de Pago</label>
                  <CustomSelect
                    value={liquidationPaymentMethod}
                    onChange={(val) => setLiquidationPaymentMethod(val as PaymentMethod)}
                    options={[
                      { value: 'Efectivo', label: 'Efectivo' },
                      { value: 'Transferencia', label: 'Transferencia Bancaria' },
                      { value: 'Cheque', label: 'Cheque' },
                    ]}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Comprador *</label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="809-000-0000"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {selectedCollateralForLiquidation.loanId && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <input
                    type="checkbox"
                    id="closeLoanCheck"
                    checked={closeAssociatedLoan}
                    onChange={(e) => setCloseAssociatedLoan(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="closeLoanCheck" className="text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
                    Abonar el monto recaudado al préstamo moroso asociado
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLiquidateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Completar Venta y Registrar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: FICHA DE CUSTODIA & RECIBO DE BÓVEDA (IMPRIMIBLE) ─── */}
      {viewingVaultReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 md:p-8 space-y-4 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 border border-sky-200">
                  {viewingVaultReceipt.sealNumber || 'SIN PRECINTO'}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
                  Resguardo de Depósito en Bóveda & Custodia
                </h3>
              </div>
              <button onClick={() => setViewingVaultReceipt(null)} className="text-slate-400 print:hidden"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-3 border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Depositante / Cliente</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{viewingVaultReceipt.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Oficial Custodio</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingVaultReceipt.custodianName || 'Oficial de Bóveda'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ubicación de Resguardo</span>
                  <span className="font-bold text-sky-600">{viewingVaultReceipt.vaultLocation} {viewingVaultReceipt.drawerOrShelf ? `(${viewingVaultReceipt.drawerOrShelf})` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha de Ingreso</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{viewingVaultReceipt.entryDate}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Detalle del Artículo / Empeño</span>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">{viewingVaultReceipt.title}</p>
                {viewingVaultReceipt.serialOrRef && (
                  <p className="text-xs font-mono text-slate-500">Serial / Matrícula: {viewingVaultReceipt.serialOrRef}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Valor Tasado</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">RD$ {viewingVaultReceipt.appraisedValue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Documentos en Custodia</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewingVaultReceipt.hasOriginalDocuments ? (viewingVaultReceipt.documentsList || 'Sí') : 'Sin documentos'}</span>
                </div>
              </div>
            </div>

            {/* Firmas de Custodia */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-1">
                <div className="border-b border-slate-300 dark:border-slate-700 h-10" />
                <p className="font-bold text-slate-800 dark:text-slate-200">Firma del Deudor / Depositante</p>
                <p className="text-[10px] text-slate-400">{viewingVaultReceipt.clientName}</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-slate-300 dark:border-slate-700 h-10" />
                <p className="font-bold text-slate-800 dark:text-slate-200">Firma del Custodio de Bóveda</p>
                <p className="text-[10px] text-slate-400">{companySettings.name || 'UltraMoney'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Resguardo
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default VaultCustodyPage;
