import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Accounting.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Eye icon import
content = content.replace(
    "import { CreditCard, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Printer, Calculator, FileText, CheckCircle, Clock, Play, StopCircle, Calendar, AlertTriangle } from 'lucide-react';",
    "import { CreditCard, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Printer, Calculator, FileText, CheckCircle, Clock, Play, StopCircle, Calendar, AlertTriangle, Eye, EyeOff } from 'lucide-react';"
)

# 2. Add state for blind mode
content = content.replace(
    "const [closingData, setClosingData] = useState<CashReconciliation>({",
    "const [showSystemSummary, setShowSystemSummary] = useState(false);\n    const [closingData, setClosingData] = useState<CashReconciliation>({"
)

# 3. Replace Shift Summary Block (lines 348 - 378 approx)
old_block = """                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                <span className="text-slate-500">Monto Base Inicial</span>
                                <span className="font-mono font-bold text-slate-700">RD$ {shiftSummary.initialAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm">
                                <span className="text-emerald-700 font-medium">(+) Cobros en Efectivo</span>
                                <span className="font-mono font-bold text-emerald-800">+RD$ {shiftSummary.cashCollected.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl border border-rose-100 text-sm">
                                <span className="text-rose-700 font-medium">(-) Egresos en Efectivo</span>
                                <span className="font-mono font-bold text-rose-800">-RD$ {shiftSummary.cashExpenses.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <span className="text-sm font-bold text-indigo-900 font-bold">Total Esperado en Caja</span>
                                <span className="font-bold text-2xl text-indigo-700 font-mono">RD$ {shiftSummary.expectedAmount.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-slate-100 rounded-2xl border border-slate-200">
                                <span className="text-sm font-bold text-slate-700">Total Físico Contado</span>
                                <span className="font-bold text-2xl text-slate-900 font-mono">RD$ {countedTotal.toLocaleString()}</span>
                            </div>
                            
                            <div className={`flex justify-between items-center p-4 rounded-2xl border ${shiftDifference === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : shiftDifference > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                <span className="flex items-center gap-2 font-bold text-sm">
                                    <AlertTriangle className="w-5 h-5" /> 
                                    {shiftDifference === 0 ? 'Cuadre Perfecto' : shiftDifference > 0 ? 'Sobrante en Caja' : 'Faltante en Caja'}
                                </span>
                                <span className="font-bold text-xl font-mono">{shiftDifference > 0 ? '+' : ''}RD$ {shiftDifference.toLocaleString()}</span>
                            </div>"""

new_block = """                        <div className="space-y-3">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-4 text-blue-900 text-sm">
                                <h4 className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4"/> Modo de Cuadre Ciego</h4>
                                <p>Por seguridad, el sistema espera a que cuentes físicamente el dinero en caja antes de revelar el balance teórico. El cálculo de faltantes/sobrantes se registrará al cerrar el turno.</p>
                                <button 
                                  onClick={() => setShowSystemSummary(!showSystemSummary)} 
                                  className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  {showSystemSummary ? <><EyeOff className="w-3 h-3"/> Ocultar Balance Teórico</> : <><Eye className="w-3 h-3"/> Ver Balance Teórico (Solo Admin)</>}
                                </button>
                            </div>

                            {showSystemSummary && (
                                <div className="space-y-2 mb-4 animate-fade-in p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Monto Base Inicial</span>
                                        <span className="font-mono font-bold text-slate-700">RD$ {shiftSummary.initialAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-emerald-700 font-medium">(+) Cobros en Efectivo</span>
                                        <span className="font-mono font-bold text-emerald-800">+RD$ {shiftSummary.cashCollected.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-rose-700 font-medium">(-) Egresos en Efectivo</span>
                                        <span className="font-mono font-bold text-rose-800">-RD$ {shiftSummary.cashExpenses.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                                        <span className="text-sm font-bold text-indigo-900">Total Esperado</span>
                                        <span className="font-bold text-lg text-indigo-700 font-mono">RD$ {shiftSummary.expectedAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                                        <span className="flex items-center gap-2 font-bold text-sm text-slate-700">
                                            {shiftDifference === 0 ? 'Cuadre Perfecto' : shiftDifference > 0 ? 'Sobrante en Caja' : 'Faltante en Caja'}
                                        </span>
                                        <span className={`font-bold text-lg font-mono ${shiftDifference === 0 ? 'text-emerald-600' : shiftDifference > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                            {shiftDifference > 0 ? '+' : ''}RD$ {shiftDifference.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-2xl border border-indigo-200 shadow-sm">
                                <span className="text-sm font-bold text-indigo-900 flex flex-col">
                                    Total Físico Contado
                                    <span className="text-[10px] font-normal text-indigo-600 uppercase tracking-wider mt-0.5">Monto final a reportar</span>
                                </span>
                                <span className="font-bold text-3xl text-indigo-700 font-mono">RD$ {countedTotal.toLocaleString()}</span>
                            </div>"""

content = content.replace(old_block, new_block)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Accounting.tsx patched successfully for blind cash shifts!")
