import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Clients.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update getClientLoanStats
old_stats = """  const getClientLoanStats = (clientId: string) => {
    const clientLoans = loans.filter(l => l.clientId === clientId);
    const activeDebt = clientLoans
      .filter(l => l.status !== 'Pagado' && l.status !== 'Rechazado')
      .reduce((sum, l) => sum + l.remainingBalance, 0);
    const totalLoansCount = clientLoans.length;
    return { activeDebt, totalLoansCount };
  };"""

new_stats = """  const getClientLoanStats = (clientId: string) => {
    const clientLoans = loans.filter(l => l.clientId === clientId);
    const activeLoans = clientLoans.filter(l => l.status !== 'Pagado' && l.status !== 'Rechazado');
    const activeDebt = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const totalLoansCount = clientLoans.length;
    
    let nextPaymentDate = null;
    let isOverdue = false;
    
    if (activeLoans.length > 0) {
        const sortedLoans = [...activeLoans].sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
        nextPaymentDate = sortedLoans[0].nextPaymentDate;
        
        const daysDiff = Math.ceil((new Date(nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        isOverdue = daysDiff < 0;
    }
    
    return { activeDebt, totalLoansCount, nextPaymentDate, isOverdue };
  };"""

content = content.replace(old_stats, new_stats)

# 2. Add Column Header
old_header = """                <th className="px-6 py-4 font-semibold text-right">Deuda / Préstamos</th>
                <th className="px-6 py-4 font-semibold">Score</th>"""
new_header = """                <th className="px-6 py-4 font-semibold text-right">Deuda / Préstamos</th>
                <th className="px-6 py-4 font-semibold text-center">Próximo Pago</th>
                <th className="px-6 py-4 font-semibold">Score</th>"""

content = content.replace(old_header, new_header)

# 3. Add Table Cell
old_cell = """                    <td className="px-6 py-4 text-right">
                        <p className="font-bold text-rose-600 dark:text-rose-400">${stats.activeDebt.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{stats.totalLoansCount} préstamos hist.</p>
                    </td>
                    <td className="px-6 py-4">"""

new_cell = """                    <td className="px-6 py-4 text-right">
                        <p className="font-bold text-rose-600 dark:text-rose-400">${stats.activeDebt.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{stats.totalLoansCount} préstamos hist.</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {stats.nextPaymentDate ? (
                            <div className="flex flex-col items-center gap-1">
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stats.isOverdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                    {stats.nextPaymentDate}
                                </span>
                                {stats.isOverdue && <span className="text-[10px] text-rose-500 font-bold uppercase">Vencido</span>}
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400">Sin préstamos activos</span>
                        )}
                    </td>
                    <td className="px-6 py-4">"""

content = content.replace(old_cell, new_cell)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Clients.tsx updated successfully!")
