import re

path = r'c:\Users\Dell\Downloads\ultramoney\components\LoanProductsTab.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Default values for new form fields
form_state_find = """    const [formData, setFormData] = useState<Partial<LoanProduct>>({
        name: '', description: '', minAmount: 1000, maxAmount: 100000,
        interestRate: 10, interestType: 'Fijo', frequency: 'Mensual',
        termMonths: 12, defaultInstallments: 12, requiresCollateral: false,
        disbursementFee: 0, lateFeePercentage: 0, graceDays: 0,
        prepaymentAllowed: true, autoCalculateInterest: true, isActive: true
    });"""

form_state_replace = """    const [formData, setFormData] = useState<Partial<LoanProduct>>({
        name: '', description: '', minAmount: 1000, maxAmount: 100000,
        interestRate: 10, interestType: 'Simple', frequency: 'Mensual',
        termMonths: 12, defaultInstallments: 12, requiresCollateral: false,
        disbursementFee: 0, lateFeePercentage: 0, graceDays: 0,
        prepaymentAllowed: true, autoCalculateInterest: true, isActive: true,
        amortizationMethod: 'Amortizado', paymentOrder: 'Mora_Expenses_Interest_Capital',
        recalculateInterestOnEarlyPayoff: false, capitalizationFrequency: 'Mensual'
    });"""
content = content.replace(form_state_find, form_state_replace)

# Form reset
form_reset_find = """        setFormData({
            name: '', description: '', minAmount: 1000, maxAmount: 100000,
            interestRate: 10, interestType: 'Fijo', frequency: 'Mensual',
            termMonths: 12, defaultInstallments: 12, requiresCollateral: false,
            disbursementFee: 0, lateFeePercentage: 0, graceDays: 0,
            prepaymentAllowed: true, autoCalculateInterest: true, isActive: true
        });"""

form_reset_replace = """        setFormData({
            name: '', description: '', minAmount: 1000, maxAmount: 100000,
            interestRate: 10, interestType: 'Simple', frequency: 'Mensual',
            termMonths: 12, defaultInstallments: 12, requiresCollateral: false,
            disbursementFee: 0, lateFeePercentage: 0, graceDays: 0,
            prepaymentAllowed: true, autoCalculateInterest: true, isActive: true,
            amortizationMethod: 'Amortizado', paymentOrder: 'Mora_Expenses_Interest_Capital',
            recalculateInterestOnEarlyPayoff: false, capitalizationFrequency: 'Mensual'
        });"""
content = content.replace(form_reset_find, form_reset_replace)

# Advanced Configuration UI section
advanced_ui = """
                                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 mt-6">Motor de Cálculo (Avanzado)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Método de Amortización</label>
                                        <select value={formData.amortizationMethod} onChange={e => setFormData({...formData, amortizationMethod: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                            <option value="Amortizado">Amortizado (Cuota Fija)</option>
                                            <option value="Flat">Flat (Rédito Fijo)</option>
                                            <option value="DecliningBalance">Sobre Saldo Insoluto</option>
                                            <option value="Open">Préstamo Abierto (Open Loan)</option>
                                            <option value="Bullet">Solo Intereses (Bullet Loan)</option>
                                            <option value="Maturity">Capital al Vencimiento</option>
                                            <option value="CreditLine">Línea de Crédito</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Orden de Prelación de Pagos</label>
                                        <select value={formData.paymentOrder} onChange={e => setFormData({...formData, paymentOrder: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                            <option value="Mora_Expenses_Interest_Capital">Pago → Mora → Gastos → Interés → Capital</option>
                                            <option value="Interest_Capital_Mora_Expenses">Pago → Interés → Capital → Mora → Gastos</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={formData.recalculateInterestOnEarlyPayoff} onChange={e => setFormData({...formData, recalculateInterestOnEarlyPayoff: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <label className="text-sm font-medium text-slate-700">Recalcular interés en pagos anticipados</label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia de Capitalización (Si Compuesto)</label>
                                        <select value={formData.capitalizationFrequency} onChange={e => setFormData({...formData, capitalizationFrequency: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                            <option value="Ninguno">No aplica</option>
                                            <option value="Diario">Diario</option>
                                            <option value="Mensual">Mensual</option>
                                        </select>
                                    </div>
                                </div>
"""

# Insert advanced UI before "Opciones Adicionales"
options_header = '<h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 mt-6">Opciones Adicionales</h3>'
content = content.replace(options_header, advanced_ui + options_header)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("LoanProductsTab.tsx patched successfully!")
