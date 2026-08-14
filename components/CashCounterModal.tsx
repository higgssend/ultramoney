import React, { useState, useMemo } from 'react';
import { 
  Calculator, X, Copy, Check, RotateCcw, DollarSign, Wallet, 
  ArrowRight, ShieldCheck, AlertCircle, FileSpreadsheet, Share2 
} from 'lucide-react';
import { toast } from 'sonner';

interface CashCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemBalance: number;
  cashBoxName?: string;
}

interface Denomination {
  value: number;
  label: string;
  type: 'bill' | 'coin';
}

const DOMINICAN_DENOMINATIONS: Denomination[] = [
  { value: 2000, label: 'RD$ 2,000', type: 'bill' },
  { value: 1000, label: 'RD$ 1,000', type: 'bill' },
  { value: 500, label: 'RD$ 500', type: 'bill' },
  { value: 200, label: 'RD$ 200', type: 'bill' },
  { value: 100, label: 'RD$ 100', type: 'bill' },
  { value: 50, label: 'RD$ 50', type: 'bill' },
  { value: 25, label: 'RD$ 25', type: 'coin' },
  { value: 10, label: 'RD$ 10', type: 'coin' },
  { value: 5, label: 'RD$ 5', type: 'coin' },
  { value: 1, label: 'RD$ 1', type: 'coin' },
];

export const CashCounterModal: React.FC<CashCounterModalProps> = ({
  isOpen,
  onClose,
  systemBalance,
  cashBoxName = 'Caja General'
}) => {
  // Counts map: denomination value -> quantity
  const [counts, setCounts] = useState<Record<number, number>>({
    2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 25: 0, 10: 0, 5: 0, 1: 0
  });

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'bills' | 'coins'>('all');

  const handleCountChange = (val: number, countStr: string) => {
    const parsed = parseInt(countStr.replace(/\D/g, ''), 10) || 0;
    setCounts(prev => ({ ...prev, [val]: Math.max(0, parsed) }));
  };

  const handleIncrement = (val: number, delta: number) => {
    setCounts(prev => ({
      ...prev,
      [val]: Math.max(0, (prev[val] || 0) + delta)
    }));
  };

  const handleReset = () => {
    setCounts({ 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 25: 0, 10: 0, 5: 0, 1: 0 });
    toast.info('Contadores de billetes reiniciados');
  };

  // Calculations
  const totalBills = useMemo(() => {
    return DOMINICAN_DENOMINATIONS
      .filter(d => d.type === 'bill')
      .reduce((sum, d) => sum + (d.value * (counts[d.value] || 0)), 0);
  }, [counts]);

  const totalCoins = useMemo(() => {
    return DOMINICAN_DENOMINATIONS
      .filter(d => d.type === 'coin')
      .reduce((sum, d) => sum + (d.value * (counts[d.value] || 0)), 0);
  }, [counts]);

  const totalPhysicalCash = totalBills + totalCoins;
  const difference = totalPhysicalCash - systemBalance;

  // Generate breakdown report text
  const getBreakdownReport = () => {
    const lines: string[] = [
      `💰 *CUADRE DE CAJA RÁPIDO - ${cashBoxName.toUpperCase()}*`,
      `📅 Fecha: ${new Date().toLocaleString('es-DO')}`,
      `---------------------------------`,
      `💵 *DESGLOSE DE BILLETES Y MONEDAS:*`
    ];

    DOMINICAN_DENOMINATIONS.forEach(d => {
      const qty = counts[d.value] || 0;
      if (qty > 0) {
        lines.push(`• ${d.label} × ${qty} = RD$ ${(d.value * qty).toLocaleString()}`);
      }
    });

    lines.push(`---------------------------------`);
    lines.push(`💵 *Total Efectivo Físico:* RD$ ${totalPhysicalCash.toLocaleString()}`);
    lines.push(`💻 *Balance en Sistema:* RD$ ${systemBalance.toLocaleString()}`);
    
    if (Math.abs(difference) < 0.01) {
      lines.push(`✅ *ESTADO:* CUADRADO EXACTO (Diferencia: RD$ 0.00)`);
    } else if (difference > 0) {
      lines.push(`📈 *ESTADO:* SOBRANTE DE RD$ ${difference.toLocaleString()}`);
    } else {
      lines.push(`⚠️ *ESTADO:* FALTANTE DE RD$ ${Math.abs(difference).toLocaleString()}`);
    }

    return lines.join('\n');
  };

  const handleCopyReport = () => {
    const text = getBreakdownReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('¡Acta de cuadre copiada al portapapeles!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = getBreakdownReport();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isOpen) return null;

  const filteredDenominations = DOMINICAN_DENOMINATIONS.filter(d => {
    if (activeTab === 'bills') return d.type === 'bill';
    if (activeTab === 'coins') return d.type === 'coin';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-modal-pop">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white backdrop-blur-sm">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Herramienta Opcional
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight mt-0.5">Calculadora de Cuadre de Billetes</h3>
              <p className="text-xs text-indigo-200">Suma billetes físicos al instante y compara con tu saldo en caja.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Balance Summary Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Physical Cash Total */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Físico Contado</span>
            <h4 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              RD$ {totalPhysicalCash.toLocaleString()}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">Billetes: RD${totalBills.toLocaleString()} | Monedas: RD${totalCoins.toLocaleString()}</span>
          </div>

          {/* System Balance */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Balance Sistema ({cashBoxName})</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
              RD$ {systemBalance.toLocaleString()}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">Registrado en base de datos</span>
          </div>

          {/* Difference & Status */}
          <div className={`p-3.5 rounded-2xl border shadow-sm ${
            Math.abs(difference) < 0.01 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300' 
              : difference > 0 
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 text-blue-800 dark:text-blue-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
          }`}>
            <span className="text-[10px] font-extrabold uppercase opacity-80">
              {Math.abs(difference) < 0.01 ? 'Estado del Cuadre' : difference > 0 ? 'Sobrante en Efectivo' : 'Faltante en Efectivo'}
            </span>
            <h4 className="text-xl font-black mt-0.5">
              {Math.abs(difference) < 0.01 ? '✓ EXACTO' : `RD$ ${Math.abs(difference).toLocaleString()}`}
            </h4>
            <span className="text-[10px] font-semibold">
              {Math.abs(difference) < 0.01 ? 'Caja 100% cuadrada' : difference > 0 ? 'Hay más dinero físico que en sistema' : 'Falta dinero físico vs sistema'}
            </span>
          </div>

        </div>

        {/* Filter Sub-tabs */}
        <div className="px-6 pt-4 flex items-center justify-between">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              Todos (10)
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'bills' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              Solo Billetes (6)
            </button>
            <button
              onClick={() => setActiveTab('coins')}
              className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'coins' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              Solo Monedas (4)
            </button>
          </div>

          <button
            onClick={handleReset}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpiar
          </button>
        </div>

        {/* Denominations Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredDenominations.map(d => {
              const qty = counts[d.value] || 0;
              const subtotal = d.value * qty;

              return (
                <div 
                  key={d.value}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    qty > 0 
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' 
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${d.type === 'bill' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="font-black text-sm text-slate-900 dark:text-white">{d.label}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                      = RD$ {subtotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Quantity Input & Increments */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleIncrement(d.value, -1)}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-black text-sm flex items-center justify-center transition-all active:scale-95"
                    >
                      -
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={qty === 0 ? '' : qty}
                      onChange={e => handleCountChange(d.value, e.target.value)}
                      placeholder="0"
                      className="w-16 px-2 py-1.5 text-center font-mono font-black text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => handleIncrement(d.value, 1)}
                      className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center transition-all active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
            💡 Este cuadre es una herramienta auxiliar. No altera tus registros a menos que tú lo decidas.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyReport}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-indigo-500" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Acta'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              Listo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CashCounterModal;
