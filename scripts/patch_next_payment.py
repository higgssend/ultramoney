import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\context\StoreContext.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update mapLoan
old_map = """  const mapLoan = (l: any) => ({
    ...l,
    clientId: l.clientid || l.clientId || l.client_id,
    clientName: l.clientname || l.clientName || l.client_name || '',
    interestRate: l.interestrate ?? l.interestRate ?? l.interest_rate,
    durationWeeks: l.durationweeks ?? l.durationWeeks ?? l.duration_weeks,
    startDate: l.startdate || l.startDate || l.start_date,"""

new_map = """  const mapLoan = (l: any) => ({
    ...l,
    clientId: l.clientid || l.clientId || l.client_id,
    clientName: l.clientname || l.clientName || l.client_name || '',
    interestRate: l.interestrate ?? l.interestRate ?? l.interest_rate,
    durationWeeks: l.durationweeks ?? l.durationWeeks ?? l.duration_weeks,
    startDate: l.startdate || l.startDate || l.start_date,
    nextPaymentDate: l.nextpaymentdate || l.nextPaymentDate || l.next_payment_date,"""

content = content.replace(old_map, new_map)

# 2. Update insert in addLoan
old_insert = """    const { data: insertedLoan, error: loanError } = await insforge.database.from('loans').insert({
      lender_id: currentUser.id,
      clientId: loanData.clientId, clientName: loanData.clientName, amount: finalPrincipal,
      interestRate: loanData.interestRate, durationWeeks: loanData.durationWeeks,
      frequency: loanData.frequency, startDate: loanData.startDate, status: LoanStatus.ACTIVE,
      installmentAmount: loanData.loanType === 'Amortizado' ? (totalToPay / loanData.durationWeeks) : (finalPrincipal * (loanData.interestRate/100)),
      remainingBalance: initialBalance, totalToPay, loanType: loanData.loanType,"""

new_insert = """    const { data: insertedLoan, error: loanError } = await insforge.database.from('loans').insert({
      lender_id: currentUser.id,
      clientId: loanData.clientId, clientName: loanData.clientName, amount: finalPrincipal,
      interestRate: loanData.interestRate, durationWeeks: loanData.durationWeeks,
      frequency: loanData.frequency, startDate: loanData.startDate, status: LoanStatus.ACTIVE,
      next_payment_date: nextPaymentDate, nextPaymentDate: nextPaymentDate,
      installmentAmount: loanData.loanType === 'Amortizado' ? (totalToPay / loanData.durationWeeks) : (finalPrincipal * (loanData.interestRate/100)),
      remainingBalance: initialBalance, totalToPay, loanType: loanData.loanType,"""

content = content.replace(old_insert, new_insert)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("StoreContext.tsx updated!")
