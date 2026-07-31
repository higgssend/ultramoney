import re

path = r'c:\Users\Dell\Downloads\ultramoney\pages\LoanRequest.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import LoanEngine
import_str = "import { LoanEngine, InstallmentPreview } from '../utils/LoanEngine';"
content = content.replace("import { LoanType, ClosingCostMode", import_str + "\nimport { LoanType, ClosingCostMode")

# 2. Add schedulePreview state
content = content.replace("const [portalPin, setPortalPin] = useState('');", "const [portalPin, setPortalPin] = useState('');\n  const [schedulePreview, setSchedulePreview] = useState<InstallmentPreview[]>([]);\n  const [activeProduct, setActiveProduct] = useState<any>(null);")

# 3. Update handleProductSelect to store activeProduct
handle_product_replace = """
  const handleProductSelect = (productId: string) => {
      setSelectedProductId(productId);
      const product = loanProducts?.find(p => p.id === productId);
      if (product) {
          setActiveProduct(product);
          setAmount(product.minAmount);
          setInterest(product.interestRate);
          setFrequency(product.frequency === 'Mensual' ? 'Mensual' : product.frequency === 'Quincenal' ? 'Quincenal' : product.frequency === 'Diario' ? 'Diario' : 'Semanal');
          setWeeks(product.defaultInstallments);
          setClosingCost(product.disbursementFee);
          if (product.requiresCollateral) {
              setCollateral({ type: 'Vehículo', description: '', refNumber: '' });
          } else {
              setCollateral(undefined);
          }
      } else {
          setActiveProduct(null);
      }
  };
"""
# Note: In previous patch I added a handleProductSelect block. I'll replace it.
content = re.sub(r'const handleProductSelect =.*?};\n', handle_product_replace, content, flags=re.DOTALL)


# 4. Generate schedule with LoanEngine in useEffect
use_effect_replace = """
  useEffect(() => {
    if (amount > 0 && interest >= 0 && weeks > 0) {
       const p = activeProduct || { amortizationMethod: 'Amortizado' };
       const sched = LoanEngine.generateAmortizationSchedule(amount, interest, weeks, frequency, new Date().toISOString().split('T')[0], p);
       setSchedulePreview(sched);
    }
  }, [amount, interest, weeks, frequency, activeProduct]);
"""
content = re.sub(r'// Efecto para recalcular cuando cambian los inputs.*?// --- Core Calculation Logic ---', use_effect_replace + '\n// --- Core Calculation Logic ---', content, flags=re.DOTALL)


# 5. Calculate Total and Installment based on SchedulePreview
calc_replace = """
  const calculateTotal = () => {
      if (schedulePreview.length === 0) return 0;
      return schedulePreview.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateInstallment = () => {
      if (schedulePreview.length === 0) return 0;
      return schedulePreview[0].total; // Simplified
  };
"""
content = re.sub(r'const calculateTotal = \(\) => \{.*?const getNetDisbursement =', calc_replace + '\n\n  const getNetDisbursement =', content, flags=re.DOTALL)


# 6. UI for Schedule Table Preview
ui_schedule = """
                        {schedulePreview.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mt-6">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">Tabla de Amortización (Vista Previa)</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-700">
                                                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">#</th>
                                                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                                                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Capital</th>
                                                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Interés</th>
                                                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Total</th>
                                                <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedulePreview.slice(0, 10).map(row => (
                                                <tr key={row.installmentNumber} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="p-3 text-sm font-medium text-slate-700 dark:text-slate-300">{row.installmentNumber}</td>
                                                    <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{new Date(row.date).toLocaleDateString()}</td>
                                                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300">${row.principal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300">${row.interest.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                                    <td className="p-3 text-sm font-bold text-slate-800 dark:text-white">${row.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                                    <td className="p-3 text-sm text-slate-500 dark:text-slate-400">${row.balance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {schedulePreview.length > 10 && (
                                        <div className="text-center p-3 text-sm text-slate-500 bg-slate-50 dark:bg-slate-900/20">
                                            Mostrando 10 de {schedulePreview.length} cuotas...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
"""
content = content.replace('                    <div className="col-span-12 lg:col-span-4 space-y-6">', ui_schedule + '                    <div className="col-span-12 lg:col-span-4 space-y-6">')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("LoanRequest.tsx patched to use LoanEngine!")
