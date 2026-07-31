import re

path = r'c:\Users\Dell\Downloads\ultramoney\pages\LoanRequest.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add loanProducts to useStore
content = content.replace("const { clients, createLoanRequest, createLoan, loanRequests, deleteLoanRequest } = useStore();", "const { clients, createLoanRequest, createLoan, loanRequests, deleteLoanRequest, loanProducts } = useStore();")

# 2. Add selectedProductId state
content = content.replace("const [selectedClientId, setSelectedClientId] = useState('');", "const [selectedProductId, setSelectedProductId] = useState('');\n  const [selectedClientId, setSelectedClientId] = useState('');")

# 3. Add handleProductSelect function
handle_product_code = """
  const handleProductSelect = (productId: string) => {
      setSelectedProductId(productId);
      const product = loanProducts?.find(p => p.id === productId);
      if (product) {
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
      }
  };

"""
content = content.replace("  // --- Core Calculation Logic ---", handle_product_code + "  // --- Core Calculation Logic ---")

# 4. Add the UI Selector
selector_ui_code = """
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-500" /> Plantilla de Producto</h3>
                            <select 
                                value={selectedProductId}
                                onChange={(e) => handleProductSelect(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                            >
                                <option value="">-- Personalizado / Sin Plantilla --</option>
                                {(loanProducts || []).filter(p => p.isActive).map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.interestRate}% {p.frequency})</option>
                                ))}
                            </select>
                        </div>
"""
# Find where to insert it. Usually under the Client selection.
# Let's see where `<User` or `Seleccionar Cliente` is.
content = content.replace('                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><User className="w-5 h-5 text-indigo-500" /> Seleccionar Cliente</h3>', selector_ui_code + '\n                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 mt-8"><User className="w-5 h-5 text-indigo-500" /> Seleccionar Cliente</h3>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("LoanRequest.tsx patched successfully!")
