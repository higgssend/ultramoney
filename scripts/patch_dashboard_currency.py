import os
import re

file_path = r"c:\Users\Dell\Downloads\ultramoney\pages\Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update useStore destructuring
if "globalCurrency" not in content:
    content = content.replace(
        "const { loans, clients, transactions, getFinancialStats } = useStore();",
        "const { loans, clients, transactions, getFinancialStats, globalCurrency } = useStore();"
    )

# 2. Filter loans by globalCurrency
old_metrics = """  // Metrics Logic (Filtered could be implemented here based on dateRange)
  const totalPortfolio = loans.reduce((sum, loan) => sum + (Number(loan.remainingBalance) || 0), 0);
  const activeClientsCount = clients.filter(c => c.status === 'Activo').length; 
  const overdueAmount = loans
    .filter(l => l.status === LoanStatus.OVERDUE)
    .reduce((sum, l) => sum + l.remainingBalance, 0);"""

new_metrics = """  // Metrics Logic (Filtered could be implemented here based on dateRange)
  const currencyLoans = loans.filter(l => (l.currency || 'DOP') === globalCurrency);
  const totalPortfolio = currencyLoans.reduce((sum, loan) => sum + (Number(loan.remainingBalance) || 0), 0);
  const activeClientsCount = clients.filter(c => c.status === 'Activo').length; 
  const overdueAmount = currencyLoans
    .filter(l => l.status === LoanStatus.OVERDUE)
    .reduce((sum, l) => sum + l.remainingBalance, 0);"""

content = content.replace(old_metrics, new_metrics)

# 3. Filter transactions for chart by globalCurrency
old_chart = """  transactions.forEach(t => {
    const dateObj = new Date(t.date);"""

new_chart = """  transactions.filter(t => (t.currency || 'DOP') === globalCurrency).forEach(t => {
    const dateObj = new Date(t.date);"""

content = content.replace(old_chart, new_chart)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Dashboard.tsx patched successfully for Multicurrency!")
