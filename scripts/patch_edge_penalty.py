import os

file_path = r"c:\Users\Dell\Downloads\ultramoney\insforge\functions\daily-overdue-check\index.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update the loop to check grace days and calculate penalty
new_logic = """
    for (const loan of (loans || [])) {
      const nextPayment = loan.nextpaymentdate || loan.startdate;
      if (!nextPayment) continue;

      if (nextPayment < todayStr) {
        // Calculate days overdue
        const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(nextPayment).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        const graceDays = loan.gracedays || 0;
        
        // If within grace period, skip penalty but we could still mark it as overdue if we wanted.
        // Usually, grace period protects from BOTH status change and penalty, or just penalty.
        // Let's assume it protects from penalty, but status is 'Atrasado'.
        
        let penaltyAmount = 0;
        let shouldApplyPenalty = false;
        
        if (diffDays > graceDays) {
           const lateFeePct = loan.latefeepercentage || 0;
           if (lateFeePct > 0) {
               // Calculate penalty on the installment amount
               const installmentAmount = loan.installmentamount || 0;
               penaltyAmount = installmentAmount * (lateFeePct / 100);
               shouldApplyPenalty = true;
           }
        }

        let severity = 'Leve'; // 1-7 days
        if (diffDays > 30) severity = 'Grave'; // > 30 days
        else if (diffDays > 7) severity = 'Moderado'; // 8-30 days

        overdueLoans.push({
          loan_id: loan.id,
          client_id: loan.clientid,
          client_name: loan.clientname || 'Cliente',
          lender_id: loan.lender_id,
          expected_date: nextPayment,
          days_overdue: diffDays,
          severity,
          penalty_applied: penaltyAmount
        });

        // 1. Mark as Atrasado
        const updates: any = { status: 'Atrasado' };
        
        if (shouldApplyPenalty) {
           // We need to add penalty to remaining balance and total_to_pay
           updates.remainingbalance = (loan.remainingbalance || 0) + penaltyAmount;
           updates.total_to_pay = (loan.total_to_pay || 0) + penaltyAmount;
        }

        await supabase
          .from('loans')
          .update(updates)
          .eq('id', loan.id);
          
        if (shouldApplyPenalty) {
           // Insert the penalty transaction
           await supabase.from('transactions').insert({
               loanid: loan.id,
               lender_id: loan.lender_id,
               client_id: loan.clientid,
               type: 'Cargo',
               amount: penaltyAmount,
               date: new Date().toISOString(),
               category: 'Mora',
               notes: `Penalidad automática por mora (${loan.latefeepercentage}% de cuota)`
           });
        }
          
        updatedCount++;
      }
    }
"""

content = content.replace(
    """    for (const loan of (loans || [])) {
      const nextPayment = loan.nextpaymentdate || loan.startdate;
      if (!nextPayment) continue;

      if (nextPayment < todayStr) {
        // Calculate days overdue
        const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(nextPayment).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        let severity = 'Leve'; // 1-7 days
        if (diffDays > 30) severity = 'Grave'; // > 30 days
        else if (diffDays > 7) severity = 'Moderado'; // 8-30 days

        overdueLoans.push({
          loan_id: loan.id,
          client_id: loan.clientid,
          client_name: loan.clientname || 'Cliente',
          lender_id: loan.lender_id,
          expected_date: nextPayment,
          days_overdue: diffDays,
          severity,
          amount: loan.installmentamount || 0,
          balance: loan.remainingbalance || 0
        });

        // Update status to Vencido
        await supabase
          .from('loans')
          .update({ status: 'Vencido' })
          .eq('id', loan.id);
          
        updatedCount++;
      }
    }""",
    new_logic
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Edge function patched successfully!")
