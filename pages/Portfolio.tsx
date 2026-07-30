
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Briefcase, TrendingUp, Users, ChevronLeft } from 'lucide-react';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';

const dataStatus = [
  { name: 'Al Día', value: 65, color: '#10b981' },
  { name: 'Atraso Leve', value: 20, color: '#f59e0b' },
  { name: 'Mora', value: 10, color: '#f43f5e' },
  { name: 'Incobrable', value: 5, color: '#64748b' },
];

const dataHistory = [
  { name: 'Q1', prestado: 40000, cobrado: 24000 },
  { name: 'Q2', prestado: 30000, cobrado: 13980 },
  { name: 'Q3', prestado: 20000, cobrado: 18000 },
  { name: 'Q4', prestado: 27800, cobrado: 29080 },
];

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
            <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Análisis de Cartera</h2>
            <p className="text-slate-500">Visión general del rendimiento de tu capital.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard 
            title="Capital en la Calle" 
            value="$450,200" 
            icon={Briefcase} 
            gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
            glowColor="shadow-indigo-500/30"
         />
         <StatCard 
            title="Interés Proyectado" 
            value="$85,100" 
            icon={TrendingUp} 
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            glowColor="shadow-emerald-500/30"
         />
         <StatCard 
            title="Total Clientes" 
            value="142" 
            icon={Users} 
            gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
            glowColor="shadow-blue-500/30"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 text-lg">Salud de la Cartera</h3>
            <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={dataStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {dataStatus.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 text-lg">Colocación vs Cobranza</h3>
            <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataHistory} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0'}} />
                        <Legend verticalAlign="bottom" height={36}/>
                        <Bar dataKey="prestado" name="Colocado" radius={[6, 6, 0, 0]}>
                            <Cell fill="url(#colorLent)" />
                        </Bar>
                        <Bar dataKey="cobrado" name="Cobrado" radius={[6, 6, 0, 0]}>
                            <Cell fill="url(#colorCollected)" />
                        </Bar>
                        <defs>
                            <linearGradient id="colorLent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                            <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
