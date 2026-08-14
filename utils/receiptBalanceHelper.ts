import { Transaction, Loan } from '../types';

export interface CalculatedReceiptBalances {
  totalDebt: number;
  previousBalance: number;
  amountPaid: number;
  capitalPaid: number;
  interestPaid: number;
  lateFeePaid: number;
  discountPaid: number;
  newBalance: number;
  isOpenLoan: boolean;
}

export const isOpenLoanType = (loanType?: string): boolean => {
  if (!loanType) return false;
  const t = loanType.toLowerCase();
  return (
    t.includes('rédito') ||
    t.includes('redito') ||
    t.includes('solo interés') ||
    t.includes('solo interes') ||
    t.includes('pagaré / préstamo abierto') ||
    t.includes('pagare / prestamo abierto') ||
    t.includes('pagaré abierto') ||
    t.includes('pagare abierto') ||
    t.includes('abierto')
  );
};

/**
 * Calcula con precisión contable el balance anterior, nuevo balance,
 * desglose y monto total de la deuda para cualquier recibo, soportando
 * tanto pagos nuevos como transacciones históricas previas.
 */
export function calculateReceiptBalances(
  transaction: Transaction,
  loan?: Loan | null,
  allLoanTransactions?: Transaction[]
): CalculatedReceiptBalances {
  const amountPaid = Number(transaction.amount) || 0;
  const isOpen = loan ? isOpenLoanType(loan.loanType || loan.loantype) : false;
  
  const loanPrincipal = Number(loan?.amount || 0);
  const loanTotalToPay = Number(loan?.totaltopay ?? loan?.totalToPay ?? loanPrincipal);
  const totalDebt = loan 
    ? (isOpen ? loanPrincipal : (loanTotalToPay || loanPrincipal))
    : (transaction.totalDebt !== undefined && Number(transaction.totalDebt) > 0 ? Number(transaction.totalDebt) : amountPaid);

  // 1. Desglose del pago
  let capitalPaid = 0;
  let interestPaid = 0;
  let lateFeePaid = 0;
  let discountPaid = Number(transaction.discountAmount || 0);

  if (
    (transaction.capitalAmount !== undefined && Number(transaction.capitalAmount) > 0) || 
    (transaction.interestAmount !== undefined && Number(transaction.interestAmount) > 0)
  ) {
    capitalPaid = Number(transaction.capitalAmount || 0);
    interestPaid = Number(transaction.interestAmount || 0);
    lateFeePaid = Number(transaction.lateFeeAmount || 0);
  } else if (transaction.paymentType === 'Capital') {
    capitalPaid = amountPaid;
  } else if (transaction.paymentType === 'Interes') {
    interestPaid = amountPaid;
  } else if (transaction.description?.toLowerCase().includes('mora') || transaction.paymentType === 'Mora') {
    lateFeePaid = amountPaid;
  } else {
    // Si no está desglosado explícitamente:
    if (isOpen) {
      interestPaid = amountPaid;
    } else {
      if (loan && (loan.interestRate || loan.interestrate)) {
        const rate = Number(loan.interestRate || loan.interestrate || 0);
        const approxMonthlyInterest = Math.round(loanPrincipal * (rate / 100));
        interestPaid = Math.min(amountPaid, Math.max(0, approxMonthlyInterest));
        capitalPaid = Math.max(0, amountPaid - interestPaid);
      } else {
        capitalPaid = amountPaid;
      }
    }
  }

  // 2. Si la transacción ya tiene guardados los balances calculados en base de datos (> 0)
  const hasValidStoredBalances = 
    transaction.previousBalance !== undefined && 
    transaction.newBalance !== undefined && 
    (Number(transaction.previousBalance) > 0 || Number(transaction.newBalance) > 0);

  if (hasValidStoredBalances) {
    return {
      totalDebt: Number(transaction.totalDebt ?? totalDebt),
      previousBalance: Number(transaction.previousBalance),
      amountPaid,
      capitalPaid,
      interestPaid,
      lateFeePaid,
      discountPaid,
      newBalance: Number(transaction.newBalance),
      isOpenLoan: isOpen
    };
  }

  // 3. Reconstrucción histórica cronológica si hay lista de transacciones del préstamo
  if (loan && allLoanTransactions && allLoanTransactions.length > 0) {
    const sortedTxs = [...allLoanTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = isOpen ? loanPrincipal : (loanTotalToPay || loanPrincipal);
    let foundPrev = runningBalance;
    let foundNew = runningBalance;

    for (const tx of sortedTxs) {
      const txAmount = Number(tx.amount) || 0;
      const txIsCap = tx.paymentType === 'Capital' || (tx.capitalAmount && Number(tx.capitalAmount) > 0);
      const prev = runningBalance;

      if (isOpen) {
        if (txIsCap) {
          const cap = tx.capitalAmount ? Number(tx.capitalAmount) : txAmount;
          runningBalance = Math.max(0, runningBalance - cap);
        }
      } else {
        runningBalance = Math.max(0, runningBalance - txAmount);
      }

      if (tx.id === transaction.id) {
        foundPrev = prev;
        foundNew = runningBalance;
        break;
      }
    }

    return {
      totalDebt: totalDebt || foundPrev,
      previousBalance: foundPrev,
      amountPaid,
      capitalPaid,
      interestPaid,
      lateFeePaid,
      discountPaid,
      newBalance: foundNew,
      isOpenLoan: isOpen
    };
  }

  // 4. Fallback directo con el balance actual del préstamo
  if (loan) {
    const currentBal = Number(loan.remainingbalance ?? loan.remainingBalance ?? 0);
    const effectiveTotal = totalDebt || (currentBal + amountPaid);

    let prevBal = currentBal;
    let newBal = currentBal;

    if (isOpen) {
      if (transaction.paymentType === 'Capital' || capitalPaid > 0) {
        prevBal = currentBal + (capitalPaid || amountPaid);
        newBal = currentBal;
      } else {
        prevBal = currentBal > 0 ? currentBal : loanPrincipal;
        newBal = currentBal > 0 ? currentBal : loanPrincipal;
      }
    } else {
      prevBal = currentBal + amountPaid;
      newBal = currentBal;
    }

    return {
      totalDebt: effectiveTotal || prevBal,
      previousBalance: prevBal > 0 ? prevBal : effectiveTotal,
      amountPaid,
      capitalPaid,
      interestPaid,
      lateFeePaid,
      discountPaid,
      newBalance: newBal,
      isOpenLoan: isOpen
    };
  }

  // 5. Fallback sin préstamo asociado
  return {
    totalDebt: amountPaid,
    previousBalance: amountPaid,
    amountPaid,
    capitalPaid: amountPaid,
    interestPaid: 0,
    lateFeePaid: 0,
    discountPaid: 0,
    newBalance: 0,
    isOpenLoan: false
  };
}
