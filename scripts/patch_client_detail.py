import re

path = r'c:\Users\Dell\Downloads\ultramoney\pages\ClientDetail.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add 'payments' to activeTab state type if not there
if "'payments'" not in content:
    content = content.replace("useState<'general' | 'loans' | 'documents'", "useState<'general' | 'loans' | 'payments' | 'documents'")

# 2. Add TabButton
tab_find = "<TabButton label=\"Préstamos\" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />"
tab_replace = "<TabButton label=\"Préstamos\" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />\n                <TabButton label=\"Historial de Pagos\" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />"
content = content.replace(tab_find, tab_replace)

# 3. Add Content Block for activeTab === 'payments'
payments_tab_ui = """
        {activeTab === 'payments' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Historial de Pagos del Cliente</h3>
                    <DataExportToolbar 
                        data={transactions.filter(t => clientLoans.some(l => l.id === t.referenceId) && t.type === 'Ingreso')} 
                        title={`Historial de Pagos de ${client.name}`}
                        filename={`pagos_${client.cedula}`}
                        columns={[
                            { header: 'ID', key: 'id' },
                            { header: 'Fecha', key: 'date' },
                            { header: 'Monto', key: 'amount', format: (v) => `$${v?.toLocaleString()}` },
                            { header: 'Tipo', key: 'type' },
                            { header: 'Nota', key: 'note' },
                            { header: 'Préstamo (Ref)', key: 'referenceId' }
                        ]}
                    />
                </div>
                {transactions.filter(t => clientLoans.some(l => l.id === t.referenceId) && t.type === 'Ingreso').length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                        <table className="w-full text-left border-collapse bg-white dark:bg-slate-800">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Recibo</th>
                                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Monto</th>
                                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Concepto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.filter(t => clientLoans.some(l => l.id === t.referenceId) && t.type === 'Ingreso').map(trx => (
                                    <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm text-slate-700 dark:text-slate-300 font-medium">{new Date(trx.date).toLocaleString()}</td>
                                        <td className="p-4 text-sm font-mono text-slate-500 dark:text-slate-400">{trx.id.substring(0,8)}</td>
                                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">${trx.amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{trx.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Banknote className="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 className="text-slate-700 dark:text-slate-300 font-bold mb-1">Sin historial de pagos</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Este cliente no ha realizado pagos todavía.</p>
                    </div>
                )}
            </div>
        )}
"""

content = content.replace("{activeTab === 'documents' && (", payments_tab_ui + "\n        {activeTab === 'documents' && (")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ClientDetail.tsx patched successfully!")
