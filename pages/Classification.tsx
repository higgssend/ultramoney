import React, { useState, useMemo } from 'react';
import { 
  Award, ShieldCheck, AlertTriangle, ShieldAlert, ChevronLeft, Search, 
  Filter, TrendingUp, Users, DollarSign, ArrowRight, BookOpen, 
  Sparkles, CheckCircle2, Phone, User, Calendar, ExternalLink,
  Shield, Check, Clock, RefreshCw, BarChart2, ChevronRight, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, useLoans, useSettings } from '../context/StoreContext';
import { Client, Loan, LoanStatus } from '../types';
import { CreditScoreEngine, CreditScoreResult } from '../utils/CreditScoreEngine';
import { DataExportToolbar } from '../components/DataExportToolbar';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

interface EvaluatedClient {
  client: Client;
  scoreResult: CreditScoreResult;
  loans: Loan[];
  activeLoansCount: number;
  totalBorrowed: number;
  activeDebt: number;
  punctuality: number;
}

export const Classification: React.FC = () => {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { loans } = useLoans();
  const { companySettings } = useSettings();

  const [activeTab, setActiveTab] = useState<'matrix' | 'rules'>('matrix');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'debt_desc' | 'name_asc'>('score_desc');

  // 1. Evaluate all clients dynamically in real-time
  const evaluatedClients: EvaluatedClient[] = useMemo(() => {
    return clients.map(client => {
      const clientLoans = loans.filter(l => l.clientId === client.id);
      const scoreResult = CreditScoreEngine.calculateScore(client, loans);
      const activeLoans = clientLoans.filter(l => 
        l.status === LoanStatus.ACTIVE || 
        l.status === LoanStatus.OVERDUE || 
        (l.status as string) === 'Vigente'
      );
      const totalBorrowed = clientLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
      const activeDebt = activeLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);

      return {
        client,
        scoreResult,
        loans: clientLoans,
        activeLoansCount: activeLoans.length,
        totalBorrowed,
        activeDebt,
        punctuality: scoreResult.metrics.punctualityPercentage
      };
    });
  }, [clients, loans]);

  // 2. Global Portfolio Risk Statistics
  const stats = useMemo(() => {
    const totalClientsCount = evaluatedClients.length;
    const totalActiveDebt = evaluatedClients.reduce((sum, item) => sum + item.activeDebt, 0);
    const avgScore = totalClientsCount > 0 
      ? Math.round(evaluatedClients.reduce((sum, item) => sum + item.scoreResult.score, 0) / totalClientsCount) 
      : 650;

    const gradeCounts: Record<'A' | 'B' | 'C' | 'D' | 'E', { count: number; debt: number }> = {
      A: { count: 0, debt: 0 },
      B: { count: 0, debt: 0 },
      C: { count: 0, debt: 0 },
      D: { count: 0, debt: 0 },
      E: { count: 0, debt: 0 }
    };

    evaluatedClients.forEach(item => {
      const g = item.scoreResult.grade;
      if (gradeCounts[g]) {
        gradeCounts[g].count += 1;
        gradeCounts[g].debt += item.activeDebt;
      }
    });

    const atRiskDebt = gradeCounts.C.debt + gradeCounts.D.debt + gradeCounts.E.debt;
    const atRiskPercentage = totalActiveDebt > 0 ? Math.round((atRiskDebt / totalActiveDebt) * 100) : 0;

    return {
      totalClientsCount,
      totalActiveDebt,
      avgScore,
      gradeCounts,
      atRiskDebt,
      atRiskPercentage
    };
  }, [evaluatedClients]);

  // 3. Filter and Sort Clients
  const filteredAndSortedClients = useMemo(() => {
    return evaluatedClients
      .filter(item => {
        // Grade filter
        if (selectedGrade !== 'ALL' && item.scoreResult.grade !== selectedGrade) {
          return false;
        }
        // Search filter
        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase().replace(/-/g, '');
          const fullName = `${item.client.name} ${item.client.lastName || ''}`.toLowerCase();
          const cedulaClean = (item.client.cedula || '').replace(/-/g, '');
          const phoneClean = (item.client.phone || '').replace(/-/g, '');
          return fullName.includes(term) || cedulaClean.includes(term) || phoneClean.includes(term);
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'score_desc':
            return b.scoreResult.score - a.scoreResult.score;
          case 'score_asc':
            return a.scoreResult.score - b.scoreResult.score;
          case 'debt_desc':
            return b.activeDebt - a.activeDebt;
          case 'name_asc':
          default:
            return a.client.name.localeCompare(b.client.name);
        }
      });
  }, [evaluatedClients, selectedGrade, searchTerm, sortBy]);

  // 4. Export Table Rows
  const exportData = useMemo(() => {
    return filteredAndSortedClients.map(item => ({
      nombre: `${item.client.name} ${item.client.lastName || ''}`.trim(),
      cedula: item.client.cedula || 'N/A',
      telefono: item.client.phone || 'N/A',
      score: item.scoreResult.score,
      grado: `Grado ${item.scoreResult.grade}`,
      categoria: item.scoreResult.label,
      deudaActiva: item.activeDebt,
      totalPrestado: item.totalBorrowed,
      prestamosActivos: item.activeLoansCount,
      puntualidad: `${item.punctuality}%`,
      recomendacion: item.scoreResult.recommendation
    }));
  }, [filteredAndSortedClients]);

  const handleShareClientStatusWhatsApp = (item: EvaluatedClient) => {
    const clientPhone = item.client.phone ? item.client.phone.replace(/[^0-9]/g, '') : '';
    const compName = companySettings?.name || 'UltraMoney Financial';
    const text = `*${compName} - Estado Crediticio*\n\nEstimado(a) *${item.client.name}*:\nSu calificación crediticia actual en nuestro sistema es:\n\n*Score*: ${item.scoreResult.score} / 850 pts\n*Clasificación*: Grado ${item.scoreResult.grade} (${item.scoreResult.label})\n*Puntualidad de pago*: ${item.punctuality}%\n\n${item.scoreResult.recommendation}\n\nGracias por su confianza.`;
    const waUrl = clientPhone ? `https://wa.me/1${clientPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="w-full space-y-8 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow rounded-xl transition-all"
            title="Volver"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clasificación y Score Crediticio</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Motor Algorítmico 300-850
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Monitoreo en tiempo real del riesgo de cartera, segmentación prudencial y puntuación de deudores.
            </p>
          </div>
        </div>

        {/* Action Tabs & Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Cartera y Clientes
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'rules'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Normas y Políticas
            </button>
          </div>

          <button
            onClick={() => navigate('/consultar')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20"
          >
            <Search className="w-3.5 h-3.5" />
            Consulta Individual
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Score Promedio */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Score Promedio</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.avgScore}</span>
            <span className="text-xs font-bold text-slate-400">/ 850 pts</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {stats.avgScore >= 700 ? 'Cartera con Perfil Confiable' : 'Cartera con Riesgo Moderado'}
          </p>
        </div>

        {/* Card 2: Clientes Clasificados */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Clientes Evaluados</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.totalClientsCount}</span>
            <span className="text-xs font-bold text-slate-400">clientes</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2">
            100% Sincronizados con préstamos y pagos
          </p>
        </div>

        {/* Card 3: Deuda Total en Cartera */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Deuda Activa Total</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">RD$</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.totalActiveDebt.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2">
            Distribución en {loans.length} colocaciones
          </p>
        </div>

        {/* Card 4: Cartera en Riesgo (Grados C, D, E) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Capital en Riesgo</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-400">RD$</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {stats.atRiskDebt.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2">
            {stats.atRiskPercentage}% del capital total (Grados C, D, E)
          </p>
        </div>

      </div>

      {activeTab === 'matrix' && (
        <>
          {/* Interactive Category Selector Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Segmentación de Cartera por Categoría Prudencial
              </h2>
              <span className="text-xs text-slate-400">Haga clic en una categoría para filtrar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Category A */}
              <div 
                onClick={() => setSelectedGrade(selectedGrade === 'A' ? 'ALL' : 'A')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  selectedGrade === 'A' 
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.02]' 
                    : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Award className={`w-4 h-4 ${selectedGrade === 'A' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span className={`text-xs font-black uppercase ${selectedGrade === 'A' ? 'text-white' : 'text-emerald-800 dark:text-emerald-300'}`}>
                      Grado A • Platino
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    selectedGrade === 'A' ? 'bg-white/20 text-white' : 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  }`}>
                    750 - 850
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className={`text-xl font-black font-mono ${selectedGrade === 'A' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {stats.gradeCounts.A.count}
                  </span>
                  <span className={`text-xs font-bold ${selectedGrade === 'A' ? 'text-white/80' : 'text-slate-500'}`}>
                    RD$ {stats.gradeCounts.A.debt.toLocaleString()}
                  </span>
                </div>
                <p className={`text-[11px] mt-2 font-medium ${selectedGrade === 'A' ? 'text-white/90' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  Riesgo Mínimo • 0 días mora
                </p>
              </div>

              {/* Category B */}
              <div 
                onClick={() => setSelectedGrade(selectedGrade === 'B' ? 'ALL' : 'B')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  selectedGrade === 'B' 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-[1.02]' 
                    : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className={`w-4 h-4 ${selectedGrade === 'B' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                    <span className={`text-xs font-black uppercase ${selectedGrade === 'B' ? 'text-white' : 'text-indigo-800 dark:text-indigo-300'}`}>
                      Grado B • Confiable
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    selectedGrade === 'B' ? 'bg-white/20 text-white' : 'bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200'
                  }`}>
                    670 - 749
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className={`text-xl font-black font-mono ${selectedGrade === 'B' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {stats.gradeCounts.B.count}
                  </span>
                  <span className={`text-xs font-bold ${selectedGrade === 'B' ? 'text-white/80' : 'text-slate-500'}`}>
                    RD$ {stats.gradeCounts.B.debt.toLocaleString()}
                  </span>
                </div>
                <p className={`text-[11px] mt-2 font-medium ${selectedGrade === 'B' ? 'text-white/90' : 'text-indigo-700 dark:text-indigo-400'}`}>
                  Riesgo Normal • Desembolso estándar
                </p>
              </div>

              {/* Category C */}
              <div 
                onClick={() => setSelectedGrade(selectedGrade === 'C' ? 'ALL' : 'C')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  selectedGrade === 'C' 
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-[1.02]' 
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={`w-4 h-4 ${selectedGrade === 'C' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                    <span className={`text-xs font-black uppercase ${selectedGrade === 'C' ? 'text-white' : 'text-amber-800 dark:text-amber-300'}`}>
                      Grado C • Regular
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    selectedGrade === 'C' ? 'bg-white/20 text-white' : 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                  }`}>
                    580 - 669
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className={`text-xl font-black font-mono ${selectedGrade === 'C' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {stats.gradeCounts.C.count}
                  </span>
                  <span className={`text-xs font-bold ${selectedGrade === 'C' ? 'text-white/80' : 'text-slate-500'}`}>
                    RD$ {stats.gradeCounts.C.debt.toLocaleString()}
                  </span>
                </div>
                <p className={`text-[11px] mt-2 font-medium ${selectedGrade === 'C' ? 'text-white/90' : 'text-amber-700 dark:text-amber-400'}`}>
                  Riesgo Medio • Requiere Garante
                </p>
              </div>

              {/* Category D */}
              <div 
                onClick={() => setSelectedGrade(selectedGrade === 'D' ? 'ALL' : 'D')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  selectedGrade === 'D' 
                    ? 'bg-rose-600 text-white border-rose-700 shadow-md scale-[1.02]' 
                    : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className={`w-4 h-4 ${selectedGrade === 'D' ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
                    <span className={`text-xs font-black uppercase ${selectedGrade === 'D' ? 'text-white' : 'text-rose-800 dark:text-rose-300'}`}>
                      Grado D • Alto Riesgo
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    selectedGrade === 'D' ? 'bg-white/20 text-white' : 'bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                  }`}>
                    450 - 579
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className={`text-xl font-black font-mono ${selectedGrade === 'D' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {stats.gradeCounts.D.count}
                  </span>
                  <span className={`text-xs font-bold ${selectedGrade === 'D' ? 'text-white/80' : 'text-slate-500'}`}>
                    RD$ {stats.gradeCounts.D.debt.toLocaleString()}
                  </span>
                </div>
                <p className={`text-[11px] mt-2 font-medium ${selectedGrade === 'D' ? 'text-white/90' : 'text-rose-700 dark:text-rose-400'}`}>
                  Riesgo Alto • Exige Garantía Sólida
                </p>
              </div>

              {/* Category E */}
              <div 
                onClick={() => setSelectedGrade(selectedGrade === 'E' ? 'ALL' : 'E')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  selectedGrade === 'E' 
                    ? 'bg-red-800 text-white border-red-900 shadow-md scale-[1.02]' 
                    : 'bg-red-100/70 dark:bg-red-950/40 border-red-300 dark:border-red-900 hover:border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className={`w-4 h-4 ${selectedGrade === 'E' ? 'text-white' : 'text-red-700 dark:text-red-400'}`} />
                    <span className={`text-xs font-black uppercase ${selectedGrade === 'E' ? 'text-white' : 'text-red-900 dark:text-red-300'}`}>
                      Grado E • Crítico
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    selectedGrade === 'E' ? 'bg-white/20 text-white' : 'bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200'
                  }`}>
                    300 - 449
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className={`text-xl font-black font-mono ${selectedGrade === 'E' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {stats.gradeCounts.E.count}
                  </span>
                  <span className={`text-xs font-bold ${selectedGrade === 'E' ? 'text-white/80' : 'text-slate-500'}`}>
                    RD$ {stats.gradeCounts.E.debt.toLocaleString()}
                  </span>
                </div>
                <p className={`text-[11px] mt-2 font-medium ${selectedGrade === 'E' ? 'text-white/90' : 'text-red-800 dark:text-red-300'}`}>
                  Mora Crítica • Bloqueo / Cobro Legal
                </p>
              </div>

            </div>
          </div>

          {/* Table Toolbar (Search, Filter, Export) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, cédula o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Filter Pills and Sorting */}
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-between md:justify-end">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['ALL', 'A', 'B', 'C', 'D', 'E'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGrade(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedGrade === g
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {g === 'ALL' ? 'Todos' : `Grado ${g}`}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score_desc' | 'score_asc' | 'debt_desc' | 'name_asc')}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="score_desc">Mayor Score (850 - 300)</option>
                <option value="score_asc">Menor Score (300 - 850)</option>
                <option value="debt_desc">Mayor Deuda Activa</option>
                <option value="name_asc">Nombre (A - Z)</option>
              </select>

              {/* Data Export Toolbar */}
              <DataExportToolbar
                data={exportData}
                filename="clasificacion_cartera_score"
                title="Clasificación Prudencial de Cartera y Score Crediticio"
                columns={[
                  { header: 'Cliente', key: 'nombre' },
                  { header: 'Cédula', key: 'cedula' },
                  { header: 'Teléfono', key: 'telefono' },
                  { header: 'Score FICO', key: 'score' },
                  { header: 'Grado', key: 'grado' },
                  { header: 'Categoría', key: 'categoria' },
                  { header: 'Deuda Activa', key: 'deudaActiva', format: (v) => `RD$ ${Number(v || 0).toLocaleString()}` },
                  { header: 'Total Prestado', key: 'totalPrestado', format: (v) => `RD$ ${Number(v || 0).toLocaleString()}` },
                  { header: 'Puntualidad', key: 'puntualidad' },
                  { header: 'Recomendación', key: 'recomendacion' }
                ]}
              />

            </div>

          </div>

          {/* Clients Classification Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Cliente / Identificación</th>
                    <th className="py-3.5 px-4 text-center">Score Crediticio</th>
                    <th className="py-3.5 px-4 text-center">Clasificación Prudencial</th>
                    <th className="py-3.5 px-4 text-right">Préstamos / Deuda Activa</th>
                    <th className="py-3.5 px-4 text-center">Puntualidad</th>
                    <th className="py-3.5 px-4">Política / Recomendación</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredAndSortedClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">No se encontraron clientes con los filtros aplicados.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedClients.map((item) => {
                      const { client, scoreResult } = item;
                      const scorePercentage = Math.round(((scoreResult.score - 300) / 550) * 100);

                      return (
                        <tr key={client.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          
                          {/* Client Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <button
                                  onClick={() => navigate(`/clientes/${client.id}`)}
                                  className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left block"
                                >
                                  {client.name} {client.lastName || ''}
                                </button>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                  <span>{client.cedula || 'Sin cédula'}</span>
                                  {client.phone && (
                                    <>
                                      <span>•</span>
                                      <span>{client.phone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Score Crediticio (Gauge Bar) */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <div className="flex items-baseline gap-1">
                                <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                                  {scoreResult.score}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">/ 850</span>
                              </div>
                              {/* Progress bar */}
                              <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className={`h-full rounded-full ${scoreResult.dotColor}`}
                                  style={{ width: `${scorePercentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Clasificación Prudencial */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase border ${scoreResult.badgeBg} ${scoreResult.badgeBorder} ${scoreResult.badgeColor}`}>
                                Grado {scoreResult.grade} • {scoreResult.category}
                              </span>
                            </div>
                          </td>

                          {/* Préstamos y Deuda Activa */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                              RD$ {item.activeDebt.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {item.activeLoansCount} activo(s) • Total: RD$ {item.totalBorrowed.toLocaleString()}
                            </span>
                          </td>

                          {/* Puntualidad */}
                          <td className="py-3.5 px-4 text-center">
                            <span className={`font-mono font-bold text-xs ${
                              item.punctuality >= 90 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : item.punctuality >= 70 
                                  ? 'text-amber-600 dark:text-amber-400' 
                                  : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {item.punctuality}%
                            </span>
                          </td>

                          {/* Política / Recomendación */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {scoreResult.recommendation}
                            </p>
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => navigate(`/clientes/${client.id}`)}
                                title="Ver Expediente de Cliente"
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg transition-colors"
                              >
                                <User className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => navigate(`/solicitud?clientId=${client.id}`)}
                                title="Nueva Solicitud de Préstamo"
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-lg transition-colors"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleShareClientStatusWhatsApp(item)}
                                title="Enviar Calificación por WhatsApp"
                                className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-6">
          
          {/* Conceptual Clarification: Score vs Clasificación */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-4">
            <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wider text-xs">
              <Shield className="w-4 h-4" />
              Guía de Arquitectura de Riesgo Financiero
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Diferencia entre Score Crediticio y Clasificación de Cartera
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-sm text-slate-300">
              <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-xs">
                <div className="flex items-center gap-2 font-bold text-white mb-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Score Crediticio (300 - 850 Puntos)
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Es la puntuación algorítmica <strong>individual</strong> de cada cliente. Se calcula en tiempo real evaluando la puntualidad de pagos, saldo pendiente actual, relación deuda/ingresos y cantidad de préstamos saldados exitosamente. Predice la probabilidad estadística de pago del deudor.
                </p>
              </div>

              <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-xs">
                <div className="flex items-center gap-2 font-bold text-white mb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Clasificación Prudencial de Cartera (Grados A a E)
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Es la categorización normativa de riesgo de la <strong>cartera global</strong> según las normas bancarias y regulatorias. Clasifica los créditos según sus días de atraso y perfil de riesgo para determinar las <strong>provisiones de pérdida</strong>, las políticas de desembolso y las exigencias de garantes o garantías.
                </p>
              </div>
            </div>
          </div>

          {/* Matrix of Rules and Policies */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Matriz Oficial de Políticas y Reglas por Grado de Riesgo
            </h3>

            <div className="space-y-4">
              
              {/* Rule A */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-black text-slate-900 dark:text-white text-sm uppercase">
                      Grado A • Riesgo Mínimo (Platino)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-md">
                    Score: 750 a 850 pts
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Clientes con excelente comportamiento de pago y solvencia comprobada. Cero atrasos registrados.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Desembolso</span>
                    <span className="font-bold text-emerald-600">Inmediato / Express</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tasa Preferencial</span>
                    <span className="font-bold text-emerald-600">-2% Descuento en Tasa</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Garante Solidario</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Opcional / Sin Garante</span>
                  </div>
                </div>
              </div>

              {/* Rule B */}
              <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-600" />
                    <span className="font-black text-slate-900 dark:text-white text-sm uppercase">
                      Grado B • Riesgo Bajo (Confiable)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-md">
                    Score: 670 a 749 pts
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Clientes regulares con capacidad de pago demostrada y atrasos menores a 15 días.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Desembolso</span>
                    <span className="font-bold text-indigo-600">Aprobación Estándar</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tasa Aplicable</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Tasa Estándar</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Garante Solidario</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Según Monto Solicitado</span>
                  </div>
                </div>
              </div>

              {/* Rule C */}
              <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-black text-slate-900 dark:text-white text-sm uppercase">
                      Grado C • Riesgo Medio (Regular / Alerta)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-md">
                    Score: 580 a 669 pts
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Clientes con historial irregular o atrasos entre 16 y 30 días. Requieren mitigación de riesgo.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Desembolso</span>
                    <span className="font-bold text-amber-600">Aprobación Condicionada</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tasa Aplicable</span>
                    <span className="font-bold text-amber-600">+1% a +2% por Riesgo</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Garante Solidario</span>
                    <span className="font-bold text-amber-600">Obligatorio (1 Garante)</span>
                  </div>
                </div>
              </div>

              {/* Rule D & E */}
              <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-600" />
                    <span className="font-black text-slate-900 dark:text-white text-sm uppercase">
                      Grados D y E • Alto Riesgo y Crítico (Mora y Pérdida)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-md">
                    Score: Menor a 580 pts
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Atrasos superiores a 31 días o mora crítica. Operaciones restringidas o sujetas a cobro legal y ejecución de garantías.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Desembolso</span>
                    <span className="font-bold text-rose-600">Restringido / Bloqueado</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Garantía Exigida</span>
                    <span className="font-bold text-rose-600">Garantía Prendaria + 2 Garantes</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Gestión de Cobro</span>
                    <span className="font-bold text-rose-600">Cobro Extrajudicial / Legal</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Classification;
