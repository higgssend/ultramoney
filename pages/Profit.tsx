
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, ChevronLeft, Download, FileSpreadsheet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const Profit: React.FC = () => {
  const { transactions, loans, clients, employees } = useStore();
  const navigate = useNavigate();

  const downloadCSV = (filename: string, rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportClientsReport = () => {
    const headers = ['ID', 'Nombre', 'Cédula', 'Teléfono', 'Provincia', 'Sector', 'Estatus'];
    const data = clients.map(c => [c.id, c.name, c.cedula, c.phone, c.province || '', c.sector || '', c.status]);
    downloadCSV('Reporte_Clientes_UltraMoney', [headers, ...data]);
  };

  const exportLoansReport = () => {
    const headers = ['ID Préstamo', 'Cliente', 'Monto', 'Interés %', 'Balance Pendiente', 'Frecuencia', 'Estado', 'Siguiente Pago'];
    const data = loans.map(l => [l.id, l.clientName, l.amount.toString(), l.interestRate.toString(), l.remainingBalance.toString(), l.frequency, l.status, l.nextPaymentDate]);
    downloadCSV('Reporte_Prestamos_UltraMoney', [headers, ...data]);
  };

  const exportFinancialReport = () => {
    const headers = ['ID Transacción', 'Tipo', 'Categoría', 'Monto (RD$)', 'Fecha', 'Método Pago', 'Descripción'];
    const data = transactions.map(t => [t.id, t.type, t.category, t.amount.toString(), t.date, t.paymentMethod || 'Efectivo', t.description]);
    downloadCSV('Reporte_Financiero_UltraMoney', [headers, ...data]);
  };

  const exportCollectorsReport = () => {
    const headers = ['ID Empleado', 'Nombre', 'Rol', 'Ruta Asignada', 'Total Recaudado', 'Rendimiento %'];
    const data = employees.map(e => [e.id, e.name, e.role, e.assignedRoute || 'Oficina', e.collections.toString(), `${e.performance}%`]);
    downloadCSV('Reporte_Cobradores_UltraMoney', [headers, ...data]);
  };

  // Financial Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'Ingreso' && t.category !== 'Capital')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'Gasto' && t.category !== 'Desembolso')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  const projectedInterest = loans.reduce((sum, loan) => {
    return sum + (loan.totalToPay - loan.amount);
  }, 0);

  const profitDataMap = new Map<number, { name: string, ingresos: number, gastos: number }>();
  const currentMonth = new Date().getMonth();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    if (m < 0) m += 12;
    profitDataMap.set(m, { name: monthNames[m], ingresos: 0, gastos: 0 });
  }

  transactions.forEach(t => {
    const dateObj = new Date(t.date);
    const diffMonths = (new Date().getFullYear() - dateObj.getFullYear()) * 12 + (currentMonth - dateObj.getMonth());
    if (diffMonths >= 0 && diffMonths <= 5) {
      const m = dateObj.getMonth();
      if (profitDataMap.has(m)) {
        const current = profitDataMap.get(m)!;
        if (t.type === 'Ingreso' && t.category !== 'Capital') current.ingresos += Number(t.amount);
        if (t.type === 'Gasto' && t.category !== 'Desembolso') current.gastos += Number(t.amount);
      }
    }
  });

  const profitData = Array.from(profitDataMap.values());

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold font-secondary text-slate-800 dark:text-white">Reportes Financieros y Exportación</h2>
              <p className="text-slate-500">Análisis de rentabilidad y descarga de reportes en Excel/CSV.</p>
            </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportFinancialReport} className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-emerald-700">
            <FileSpreadsheet className="w-4 h-4" /> Excel Financiero
          </button>
          <button onClick={exportLoansReport} className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-indigo-700">
            <FileSpreadsheet className="w-4 h-4" /> Excel Préstamos
          </button>
          <button onClick={exportClientsReport} className="px-3.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-purple-700">
            <FileSpreadsheet className="w-4 h-4" /> Excel Clientes
          </button>
          <button onClick={exportCollectorsReport} className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-900">
            <FileSpreadsheet className="w-4 h-4" /> Excel Cobradores
          </button>
        </div>
      </div>

      {/* Main Stats with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Ingresos Operativos" 
          value={`$${totalIncome.toLocaleString()}`} 
          trend="Intereses + Comisiones" 
          trendUp={true} 
          icon={TrendingUp} 
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          glowColor="shadow-emerald-500/30"
        />
        <StatCard 
          title="Gastos Operativos" 
          value={`$${totalExpenses.toLocaleString()}`} 
          trend="Nómina, Servicios, etc." 
          trendUp={false} 
          icon={TrendingDown} 
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
          glowColor="shadow-rose-500/30"
        />
        <StatCard 
          title="Ganancia Neta" 
          value={`$${netProfit.toLocaleString()}`} 
          trend={netProfit > 0 ? "Rentable" : "Pérdida"} 
          trendUp={netProfit > 0} 
          icon={DollarSign} 
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
          glowColor="shadow-indigo-500/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 text-lg">Tendencia de Ganancias (Mensual)</h3>
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} prefix="$" tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend />
                <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#10b981" strokeWidth={3} fill="url(#colorProfit)" name="Ingresos" />
                <Area type="monotone" dataKey="gastos" stackId="2" stroke="#f43f5e" strokeWidth={3} fill="url(#colorLoss)" name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projections Card with Gradient */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-3xl shadow-lg shadow-indigo-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                
                <h3 className="font-bold text-lg mb-1 relative z-10">Proyección de Intereses</h3>
                <p className="text-indigo-100 text-sm mb-6 relative z-10">Basado en cartera activa actual</p>
                <h2 className="text-4xl font-bold mb-4 relative z-10 tracking-tight">${projectedInterest.toLocaleString()}</h2>
                
                <div className="w-full bg-black/20 h-3 rounded-full relative z-10 backdrop-blur-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-3 rounded-full" style={{width: '60%'}}></div>
                </div>
                <p className="text-xs text-indigo-200 mt-2 relative z-10 font-medium">60% Recaudado del objetivo</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                    <PieIcon className="w-5 h-5 text-indigo-500" />
                    Distribución
                </h3>
                <div className="space-y-5">
                    {[
                        { label: 'Intereses Préstamos', val: 85, color: 'bg-emerald-500' },
                        { label: 'Cargos por Mora', val: 12, color: 'bg-amber-500' },
                        { label: 'Comisiones', val: 3, color: 'bg-indigo-500' }
                    ].map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-slate-600 font-medium">{item.label}</span>
                                <span className="font-bold text-slate-800">{item.val}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className={`${item.color} h-2.5 rounded-full`} style={{width: `${item.val}%`}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profit;
