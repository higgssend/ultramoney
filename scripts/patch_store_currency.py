import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update StoreContextType
if "globalCurrency:" not in content:
    content = content.replace(
        "addAuditLog: (action: string, details: string) => void;",
        "addAuditLog: (action: string, details: string) => void;\n  globalCurrency: 'DOP' | 'USD';\n  setGlobalCurrency: (currency: 'DOP' | 'USD') => void;"
    )

# 2. Update StoreContext Export Values
if "globalCurrency, setGlobalCurrency" not in content:
    content = content.replace(
        "const [isLoadingAuth, setIsLoadingAuth] = useState(true);",
        "const [isLoadingAuth, setIsLoadingAuth] = useState(true);\n  const [globalCurrency, setGlobalCurrency] = useState<'DOP' | 'USD'>('DOP');"
    )

    # We also need to add it to the return object at the bottom. We'll find `return (\n    <StoreContext.Provider value={{`
    content = content.replace(
        "<StoreContext.Provider value={{",
        "<StoreContext.Provider value={{\n      globalCurrency, setGlobalCurrency,"
    )

# 3. Update getFinancialStats
old_stats = """  const getFinancialStats = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const incomeToday = transactions
      .filter(t => t.type === 'Ingreso' && t.date.startsWith(today))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseToday = transactions
      .filter(t => t.type === 'Gasto' && t.date.startsWith(today))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = transactions
      .reduce((sum, t) => sum + (t.type === 'Ingreso' ? Number(t.amount) : -Number(t.amount)), 0);

    return { balance, incomeToday, expenseToday };
  };"""

new_stats = """  const getFinancialStats = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const currencyTransactions = transactions.filter(t => (t.currency || 'DOP') === globalCurrency);

    const incomeToday = currencyTransactions
      .filter(t => t.type === 'Ingreso' && t.date.startsWith(today))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseToday = currencyTransactions
      .filter(t => t.type === 'Gasto' && t.date.startsWith(today))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = currencyTransactions
      .reduce((sum, t) => sum + (t.type === 'Ingreso' ? Number(t.amount) : -Number(t.amount)), 0);

    return { balance, incomeToday, expenseToday };
  };"""

content = content.replace(old_stats, new_stats)

# 4. Update getCashShiftSummary
old_cash_stats = """    const cashCollected = transactions
      .filter(t => t.type === 'Ingreso' && new Date(t.date).getTime() >= shiftStartTime && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const cashExpenses = transactions
      .filter(t => t.type === 'Gasto' && new Date(t.date).getTime() >= shiftStartTime && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((sum, t) => sum + Number(t.amount), 0);"""

new_cash_stats = """    const cashCollected = transactions
      .filter(t => (t.currency || 'DOP') === globalCurrency && t.type === 'Ingreso' && new Date(t.date).getTime() >= shiftStartTime && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const cashExpenses = transactions
      .filter(t => (t.currency || 'DOP') === globalCurrency && t.type === 'Gasto' && new Date(t.date).getTime() >= shiftStartTime && (t.paymentMethod === 'Efectivo' || !t.paymentMethod))
      .reduce((sum, t) => sum + Number(t.amount), 0);"""

content = content.replace(old_cash_stats, new_cash_stats)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("StoreContext.tsx patched successfully for Multicurrency!")
