import re

path = r'c:\Users\Dell\Downloads\ultramoney\pages\Simulator.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add loanProducts to useStore
content = content.replace("const { clients, loans, createLoan, refinanceLoan } = useStore();", "const { clients, loans, createLoan, refinanceLoan, loanProducts } = useStore();")

# 2. Add state
content = content.replace("const [type, setType] = useState<'Amortizado' | 'Rédito'>('Amortizado');", "const [type, setType] = useState<'Amortizado' | 'Rédito'>('Amortizado');\n  const [selectedProductId, setSelectedProductId] = useState('');")

# 3. Add handler
handler_code = """
  const handleProductSelect = (productId: string) => {
      setSelectedProductId(productId);
      const product = loanProducts?.find(p => p.id === productId);
      if (product) {
          setAmount(product.minAmount);
          setInterest(product.interestRate);
          setFrequency(product.frequency === 'Mensual' ? 'Mensual' : product.frequency === 'Quincenal' ? 'Quincenal' : product.frequency === 'Diario' ? 'Diario' : 'Semanal');
          setWeeks(product.defaultInstallments);
          setType(product.interestType === 'Fijo' ? 'Rédito' : 'Amortizado'); // Basic mapping for now
      }
  };
"""
content = content.replace("  // Refinance State", handler_code + "\n  // Refinance State")

# 4. Add UI
ui_code = """
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Plantilla de Producto</label>
                            <select 
                                value={selectedProductId}
                                onChange={(e) => handleProductSelect(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            >
                                <option value="">-- Personalizado / Sin Plantilla --</option>
                                {(loanProducts || []).filter(p => p.isActive).map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.interestRate}% {p.frequency})</option>
                                ))}
                            </select>
                        </div>
"""
content = content.replace('                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 space-y-6">', '                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 space-y-6">\n' + ui_code)


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Simulator.tsx patched successfully!")
