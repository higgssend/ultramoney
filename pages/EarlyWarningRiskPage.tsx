import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, ShieldAlert, Activity, TrendingDown, Users, 
  DollarSign, CheckCircle2, Clock, ArrowUpRight, Search, 
  Filter, Phone, MessageCircle, FileText, ChevronRight, 
  ExternalLink, BarChart3, PieChart, Sparkles, RefreshCw,
  SlidersHorizontal, Check, AlertCircle, ArrowDownRight, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLoans, useClients, useAccounting, useSettings } from '../context/StoreContext';
import { EarlyWarningEngine } from '../utils/EarlyWarningEngine';
import { AgingBucketSummary, EarlyWarningClientMetric, formatLoanId, PaymentVelocityTrend } from '../types';
import StatCard from '../components/StatCard';
import { CustomSelect } from '../components/CustomSelect';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { toast } from 'sonner';

export const EarlyWarningRiskPage: React.FC = () => {
  const navigate = useNavigate();
  const { loans } = useLoans();
  const { clients } = useClients();
  const { transactions } = useAccounting();
  const { companySettings } = useSettings();

  const [activeTab, setActiveTab] = useState<'buckets' | 'velocity' | 'provisions'>('buckets');
  const [selectedBucket, setSelectedBucket] = useState<string>('ALL');
  const [trendFilter, setTrendFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Calculate Aging Buckets (Tramos de Mora)
  const agingBuckets: AgingBucketSummary[] = useMemo(() => {
    return EarlyWarningEngine.calculateAgingBuckets(loans);
  }, [loans]);

  // 2. Evaluate Payment Velocity & Predictive Degradation
  const velocityMetrics: EarlyWarningClientMetric[] = useMemo(() => {
    return EarlyWarningEngine.evaluatePaymentVelocity(clients, loans, transactions);
  }, [clients, loans, transactions]);

  // Financial Stats
  const totalActivePortfolio = useMemo(() => {
    return agingBuckets.reduce((sum, b) => sum + b.totalBalance, 0);
  }, [agingBuckets]);

  const totalOverdueBalance = useMemo(() => {
    return agingBuckets
      .filter(b => b.bucketId !== 'current')
      .reduce((sum, b) => sum + b.totalBalance, 0);
  }, [agingBuckets]);

  const totalSuggestedProvisions = useMemo(() => {
    return agingBuckets.reduce((sum, b) => sum + b.suggestedProvision, 0);
  }, [agingBuckets]);

  const highRiskBorrowersCount = useMemo(() => {
    return velocityMetrics.filter(m => m.trend === 'Riesgo Inminente de Default' || m.trend === 'Deterioro Progresivo').length;
  }, [velocityMetrics]);

  // Filtered Velocity Metrics
  const filteredMetrics = useMemo(() => {
    return velocityMetrics.filter(m => {
      const matchesSearch = searchQuery === '' ||
        m.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.client.cedula && m.client.cedula.includes(searchQuery)) ||
        (m.client.phone && m.client.phone.includes(searchQuery)) ||
        m.loan.id.includes(searchQuery);

      const matchesTrend = trendFilter === 'ALL' || m.trend === trendFilter;

      let matchesBucket = true;
      if (selectedBucket !== 'ALL') {
        if (selectedBucket === 'current') matchesBucket = m.overdueDays === 0;
        else if (selectedBucket === 'early') matchesBucket = m.overdueDays >= 1 && m.overdueDays <= 15;
        else if (selectedBucket === 'medium') matchesBucket = m.overdueDays >= 16 && m.overdueDays <= 30;
        else if (selectedBucket === 'critical') matchesBucket = m.overdueDays >= 31 && m.overdueDays <= 60;
        else if (selectedBucket === 'severe') matchesBucket = m.overdueDays >= 61 && m.overdueDays <= 90;
        else if (selectedBucket === 'legal_castigada') matchesBucket = m.overdueDays > 90 || m.loan.status === 'Cobro Legal';
      }

      return matchesSearch && matchesTrend && matchesBucket;
    });
  }, [velocityMetrics, searchQuery, trendFilter, selectedBucket]);

  // WhatsApp Contact Helper
  const handleSendWhatsAppReminder = (metric: EarlyWarningClientMetric) => {
    const cleanPhone = metric.client.phone?.replace(/\D/g, '') || '';
    if (!cleanPhone) {
      toast.error('El cliente no tiene teléfono registrado');
      return;
    }

    let message = `Hola *${metric.client.name.split(' ')[0]}*,\n\n`;
    message += `Le saludamos de *${companySettings.name || 'UltraMoney'}* respecto a su Préstamo #${formatLoanId(metric.loan.id)}.\n\n`;
    if (metric.overdueDays > 0) {
      message += `Le recordamos que presenta un balance vencido de *RD$ ${(metric.loan.remainingBalance || 0).toLocaleString()}* con *${metric.overdueDays} días de retraso*.\n`;
      message += `Por favor contáctenos hoy para coordinar su pago o evaluar una reestructuración de cuotas.\n\n`;
    } else {
      message += `Queremos recordarle que su próxima cuota vence el *${metric.loan.nextPaymentDate || 'próximamente'}* por valor de *RD$ ${((metric.loan.totalToPay || metric.loan.amount) / Math.max(1, metric.loan.durationWeeks || 4)).toLocaleString()}*.\n`;
      message += `Mantenga su récord impecable para calificar a mayores montos.\n\n`;
    }
    message += `Gracias por su atención.`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getTrendBadge = (trend: PaymentVelocityTrend) => {
    switch (trend) {
      case 'Puntual / Sólido':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">Puntual / Sólido</span>;
      case 'Retraso Recurrente':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">Retraso Recurrente (3-7d)</span>;
      case 'Deterioro Progresivo':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200">Deterioro Progresivo</span>;
      case 'Riesgo Inminente de Default':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 animate-pulse">Riesgo de Default</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" /> Early Warning System (EWS) & Aging Analysis
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Sistema de Alerta Temprana de Riesgo</h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Clasificación de cartera viva por tramos de mora (0 a +90 días), detección predictiva de deterioro de pago y cálculo regulatorio de provisiones para pérdidas crediticias.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/prestamos')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all text-xs flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Ver Todos los Préstamos
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Cartera Activa Total"
          value={`RD$ ${totalActivePortfolio.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend="Balance de Capital Vigente"
          trendUp={true}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-indigo-600 to-blue-700"
          glowColor="shadow-indigo-500/20"
        />
        <StatCard
          title="Cartera Vencida (En Riesgo)"
          value={`RD$ ${totalOverdueBalance.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend={`${totalActivePortfolio > 0 ? ((totalOverdueBalance / totalActivePortfolio) * 100).toFixed(1) : 0}% de la cartera total`}
          trendUp={false}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-rose-500 to-red-700"
          glowColor="shadow-rose-500/20"
        />
        <StatCard
          title="Provisión de Riesgo Sugerida"
          value={`RD$ ${totalSuggestedProvisions.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`}
          trend="Reserva para Créditos Dudosos"
          trendUp={false}
          icon={ShieldAlert}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          glowColor="shadow-amber-500/20"
        />
        <StatCard
          title="Deudores en Alerta Preventiva"
          value={String(highRiskBorrowersCount)}
          trend="Deterioro o Riesgo Inminente"
          trendUp={false}
          icon={Activity}
          gradient="bg-gradient-to-br from-purple-600 to-indigo-700"
          glowColor="shadow-purple-500/20"
        />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
          <button 
            onClick={() => setActiveTab('buckets')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'buckets' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Tramos de Mora (Aging Buckets)
          </button>
          <button 
            onClick={() => setActiveTab('velocity')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'velocity' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Indicadores de Deterioro & Velocidad ({velocityMetrics.length})
          </button>
          <button 
            onClick={() => setActiveTab('provisions')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'provisions' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Matriz de Provisiones y Reservas
          </button>
        </div>
      </div>

      {/* ─── TAB 1: TRAMOS DE MORA (AGING BUCKETS) ─── */}
      {activeTab === 'buckets' && (
        <div className="space-y-6">
          
          {/* Aging Buckets Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agingBuckets.map((bucket) => (
              <div 
                key={bucket.bucketId}
                onClick={() => {
                  setSelectedBucket(selectedBucket === bucket.bucketId ? 'ALL' : bucket.bucketId);
                  setActiveTab('velocity');
                }}
                className={`p-6 rounded-3xl border bg-white dark:bg-slate-900 transition-all cursor-pointer hover:shadow-md ${
                  selectedBucket === bucket.bucketId 
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {bucket.dayRange}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">{bucket.bucketName}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl">
                    {bucket.loansCount} Préstamos
                  </span>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Balance en Tramo:</span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">RD$ {bucket.totalBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">% de Cartera:</span>
                    <span className="font-mono font-bold text-indigo-600">{bucket.percentageOfPortfolio}%</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-600">
                    <span>Provisión Sugerida ({bucket.provisionRate}%):</span>
                    <span className="font-mono font-bold">RD$ {bucket.suggestedProvision.toLocaleString()}</span>
                  </div>

                  {/* Progress Bar of concentration */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full ${
                        bucket.bucketId === 'current' ? 'bg-emerald-500' :
                        bucket.bucketId === 'early' ? 'bg-yellow-500' :
                        bucket.bucketId === 'medium' ? 'bg-amber-500' :
                        bucket.bucketId === 'critical' ? 'bg-orange-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, bucket.percentageOfPortfolio))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Aging Distribution Visual Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Distribución Visual de la Cartera por Rango de Vencimiento</h3>
            <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex shadow-inner">
              {agingBuckets.map((b) => (
                <div
                  key={b.bucketId}
                  title={`${b.bucketName}: ${b.percentageOfPortfolio}% (RD$ ${b.totalBalance.toLocaleString()})`}
                  className={`h-full flex items-center justify-center text-[10px] font-bold text-white transition-all ${
                    b.bucketId === 'current' ? 'bg-emerald-500' :
                    b.bucketId === 'early' ? 'bg-yellow-500' :
                    b.bucketId === 'medium' ? 'bg-amber-500' :
                    b.bucketId === 'critical' ? 'bg-orange-500' :
                    b.bucketId === 'severe' ? 'bg-rose-500' : 'bg-red-700'
                  }`}
                  style={{ width: `${Math.max(b.percentageOfPortfolio > 0 ? 3 : 0, b.percentageOfPortfolio)}%` }}
                >
                  {b.percentageOfPortfolio >= 8 ? `${b.percentageOfPortfolio}%` : ''}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 text-xs">
              {agingBuckets.map((b) => (
                <div key={b.bucketId} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    b.bucketId === 'current' ? 'bg-emerald-500' :
                    b.bucketId === 'early' ? 'bg-yellow-500' :
                    b.bucketId === 'medium' ? 'bg-amber-500' :
                    b.bucketId === 'critical' ? 'bg-orange-500' :
                    b.bucketId === 'severe' ? 'bg-rose-500' : 'bg-red-700'
                  }`} />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">{b.bucketName}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 2: INDICADOR DE DETERIORO & VELOCIDAD DE PAGO ─── */}
      {activeTab === 'velocity' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, cédula o préstamo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <CustomSelect
              value={trendFilter}
              onChange={(val) => setTrendFilter(val)}
              options={[
                { value: 'ALL', label: 'Todas las Tendencias de Pago' },
                { value: 'Puntual / Sólido', label: 'Puntual / Sólido' },
                { value: 'Retraso Recurrente', label: 'Retraso Recurrente (3 a 7 días)' },
                { value: 'Deterioro Progresivo', label: 'Deterioro Progresivo' },
                { value: 'Riesgo Inminente de Default', label: 'Riesgo Inminente de Default' },
              ]}
              className="text-xs"
            />

            <CustomSelect
              value={selectedBucket}
              onChange={(val) => setSelectedBucket(val)}
              options={[
                { value: 'ALL', label: 'Todos los Tramos de Mora' },
                { value: 'current', label: 'Al Día (0 días)' },
                { value: 'early', label: 'Mora Temprana (1 a 15 días)' },
                { value: 'medium', label: 'Mora Media (16 a 30 días)' },
                { value: 'critical', label: 'Mora Crítica (31 a 60 días)' },
                { value: 'severe', label: 'Mora Severa (61 a 90 días)' },
                { value: 'legal_castigada', label: 'Cobro Judicial / Castigada (+90 días)' },
              ]}
              className="text-xs"
            />
          </div>

          {/* Velocity Metrics Table / List */}
          {filteredMetrics.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No se encontraron clientes con el criterio seleccionado</h3>
              <p className="text-xs text-slate-400">Todos los créditos en esta categoría se encuentran evaluados correctamente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMetrics.map((metric) => (
                <div 
                  key={metric.loan.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{metric.client.name}</h4>
                      <span className="font-mono text-xs text-slate-400">Préstamo #{formatLoanId(metric.loan.id)}</span>
                      {getTrendBadge(metric.trend)}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Balance Pendiente:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">RD$ {(metric.loan.remainingBalance || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Días de Mora:</span>
                        <span className={`font-mono font-bold ${metric.overdueDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {metric.overdueDays} días
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Capacidad de Pago:</span>
                        <span className="font-mono font-bold text-indigo-600">{metric.paymentCapacityScore} / 100</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Abonos Incompletos:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{metric.recentPartialPaymentsCount} registrados</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <b className="text-slate-700 dark:text-slate-300">Acción Sugerida:</b> {metric.recommendedAction}
                    </p>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 md:flex-col justify-end">
                    <button
                      onClick={() => handleSendWhatsAppReminder(metric)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all w-full justify-center"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-white" /> WhatsApp
                    </button>
                    <button
                      onClick={() => navigate(`/prestamos/${metric.loan.id}`)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1 transition-all w-full justify-center"
                    >
                      <FileText className="w-3.5 h-3.5" /> Ver Detalle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ─── TAB 3: MATRIZ DE PROVISIONES Y RESERVAS REGULATORIAS ─── */}
      {activeTab === 'provisions' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Matriz de Provisiones para Pérdidas Crediticias</h3>
              <p className="text-xs text-slate-400">Reserva técnica sugerida según el nivel de riesgo y días de atraso de cada tramo.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Provisión Total Recomendada</span>
              <span className="text-lg font-black font-mono text-rose-600">RD$ {totalSuggestedProvisions.toLocaleString()}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Tramo de Cartera</th>
                  <th className="py-3 px-4">Días de Mora</th>
                  <th className="py-3 px-4">No. Préstamos</th>
                  <th className="py-3 px-4">Balance en Riesgo</th>
                  <th className="py-3 px-4">% de Cartera</th>
                  <th className="py-3 px-4">Tasa Provisión</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Monto Provisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {agingBuckets.map((b) => (
                  <tr key={b.bucketId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{b.bucketName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{b.dayRange}</td>
                    <td className="py-3.5 px-4">{b.loansCount}</td>
                    <td className="py-3.5 px-4 font-mono font-bold">RD$ {b.totalBalance.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono">{b.percentageOfPortfolio}%</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{b.provisionRate}%</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600 text-right">RD$ {b.suggestedProvision.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default EarlyWarningRiskPage;
