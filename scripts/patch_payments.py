import re

path = r'c:\Users\Dell\Downloads\ultramoney\pages\Payments.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import LoanEngine
import_str = "import { LoanEngine } from '../utils/LoanEngine';"
content = content.replace("import { Loan, CompanySettings, PaymentMethod", import_str + "\nimport { Loan, CompanySettings, PaymentMethod")

# 2. In handlePayment, use LoanEngine to get distribution
# Find the start of handlePayment
handle_payment_find = """  const handlePayment = () => {
    if (!selectedLoanId || !payAmount || !selectedLoan) return;
    
    const amountVal = Number(payAmount);
    const previousBalance = selectedLoan.remainingBalance;
    const newBalance = Math.max(0, previousBalance - amountVal);
    
    const capitalAmountVal = paymentType === 'Mixto' ? Number(capitalAmount) : undefined;
    // Register the payment
    registerPayment(selectedLoanId, amountVal, payNote, paymentDate, invoiceDate, paymentType, capitalAmountVal, paymentMethod);
    
    // Logic for Receipt Details
    const allInstallments = generateInstallments(selectedLoan);
    const overdueInsts = allInstallments.filter(i => i.status === 'Atrasado' || (i.status !== 'Pagado' && new Date(i.date) < new Date()));
    const overdueAmount = overdueInsts.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);"""

handle_payment_replace = """  const handlePayment = () => {
    if (!selectedLoanId || !payAmount || !selectedLoan) return;
    
    const amountVal = Number(payAmount);
    const previousBalance = selectedLoan.remainingBalance;
    const newBalance = Math.max(0, previousBalance - amountVal);
    
    const capitalAmountVal = paymentType === 'Mixto' ? Number(capitalAmount) : undefined;
    // Register the payment
    registerPayment(selectedLoanId, amountVal, payNote, paymentDate, invoiceDate, paymentType, capitalAmountVal, paymentMethod);
    
    // Logic for Receipt Details
    const allInstallments = generateInstallments(selectedLoan);
    const overdueInsts = allInstallments.filter(i => i.status === 'Atrasado' || (i.status !== 'Pagado' && new Date(i.date) < new Date()));
    const overdueAmount = overdueInsts.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
    
    // Engine Distribution logic for detailed receipt
    const distribution = LoanEngine.applyPaymentDistribution(amountVal, overdueAmount > 0 ? (overdueAmount * 0.1) : 0, 0, (selectedLoan.remainingBalance * 0.05), amountVal);
    // Overdue Mora estimated as 10% of overdue amount, Interest estimated as 5% of remaining balance for receipt demo.
"""
content = content.replace(handle_payment_find, handle_payment_replace)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Payments.tsx patched successfully!")
