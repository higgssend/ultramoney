
import React from 'react';
import { Download, Filter, ChevronLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const DeepAccounting: React.FC = () => {
  const { transactions } = useStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Contabilidad Profunda</h2>
                <p className="text-slate-500">Libro mayor y registro detallado de movimientos.</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 bg-white">
                <Filter className="w-4 h-4" /> Filtrar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Download className="w-4 h-4" /> Exportar Excel
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Fecha</th>
                        <th className="px-6 py-4 font-semibold">Descripción</th>
                        <th className="px-6 py-4 font-semibold">Categoría</th>
                        <th className="px-6 py-4 font-semibold text-right">Entrada</th>
                        <th className="px-6 py-4 font-semibold text-right">Salida</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-slate-600 font-mono text-xs">{t.date}</td>
                            <td className="px-6 py-4 font-medium text-slate-800">{t.description}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                                    {t.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                                {t.type === 'Ingreso' ? `$${t.amount.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-right text-rose-600 font-medium">
                                {t.type === 'Gasto' ? `$${t.amount.toLocaleString()}` : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default DeepAccounting;
