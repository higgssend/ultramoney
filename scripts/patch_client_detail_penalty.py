import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\ClientDetail.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state for new fields
content = content.replace(
    "const [loanClosingCostMode, setLoanClosingCostMode] = useState<ClosingCostMode>('Financiado');",
    "const [loanClosingCostMode, setLoanClosingCostMode] = useState<ClosingCostMode>('Financiado');\n    const [loanLateFee, setLoanLateFee] = useState<number>(5);\n    const [loanGraceDays, setLoanGraceDays] = useState<number>(3);"
)

# 2. Update newLoan object inside handleSubmitLoan
content = content.replace(
    "            closingCostMode: loanClosingCostMode,",
    "            closingCostMode: loanClosingCostMode,\n            lateFeePercentage: loanLateFee,\n            graceDays: loanGraceDays,"
)

# 3. Add UI inputs
ui_to_add = """
                            {/* Penalidad y Días de Gracia */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Días de Gracia (Mora)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input type="number" min="0" value={loanGraceDays} onChange={(e) => setLoanGraceDays(Number(e.target.value))} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Días antes de aplicar mora</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Penalidad por Mora (%)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Percent className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input type="number" min="0" step="0.1" value={loanLateFee} onChange={(e) => setLoanLateFee(Number(e.target.value))} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Porcentaje de mora</p>
                                </div>
                            </div>
"""

content = content.replace(
    "                            {/* Resumen del Préstamo */}",
    ui_to_add + "\n                            {/* Resumen del Préstamo */}"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("ClientDetail.tsx patched successfully for loans penalty!")
