
import React from 'react';
import { Star, ShieldAlert, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Classification: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Clasificación de Créditos</h2>
            <p className="text-slate-500">Reglas automáticas para la calificación de clientes.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-emerald-50/50">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                    <Star className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Categoría A (Premium)</h3>
                    <p className="text-slate-600 text-sm mt-1">Clientes con excelente historial de pago. Elegibles para montos mayores y tasas preferenciales.</p>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded border border-emerald-100">
                    <span className="block text-slate-500 text-xs">Score Mínimo</span>
                    <span className="font-bold text-emerald-700">80 - 100</span>
                </div>
                <div className="bg-white p-3 rounded border border-emerald-100">
                    <span className="block text-slate-500 text-xs">Atrasos Permitidos</span>
                    <span className="font-bold text-emerald-700">0 días</span>
                </div>
                <div className="bg-white p-3 rounded border border-emerald-100">
                    <span className="block text-slate-500 text-xs">Beneficio</span>
                    <span className="font-bold text-emerald-700">-2% Tasa Interés</span>
                </div>
            </div>
        </div>

        <div className="p-6 border-b border-slate-100 bg-blue-50/50">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Categoría B (Estándar)</h3>
                    <p className="text-slate-600 text-sm mt-1">Clientes regulares. Condiciones estándar de préstamo.</p>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                 <div className="bg-white p-3 rounded border border-blue-100">
                    <span className="block text-slate-500 text-xs">Score Mínimo</span>
                    <span className="font-bold text-blue-700">50 - 79</span>
                </div>
                <div className="bg-white p-3 rounded border border-blue-100">
                    <span className="block text-slate-500 text-xs">Atrasos Permitidos</span>
                    <span className="font-bold text-blue-700">Hasta 5 días</span>
                </div>
            </div>
        </div>

        <div className="p-6 bg-rose-50/50">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Categoría C (Alto Riesgo)</h3>
                    <p className="text-slate-600 text-sm mt-1">Clientes con historial irregular. Requieren aprobación manual y garantes.</p>
                </div>
            </div>
             <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                 <div className="bg-white p-3 rounded border border-rose-100">
                    <span className="block text-slate-500 text-xs">Score Mínimo</span>
                    <span className="font-bold text-rose-700">0 - 49</span>
                </div>
                <div className="bg-white p-3 rounded border border-rose-100">
                    <span className="block text-slate-500 text-xs">Restricción</span>
                    <span className="font-bold text-rose-700">Requiere Garante</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Classification;
