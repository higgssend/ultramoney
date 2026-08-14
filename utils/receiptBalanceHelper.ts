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
  const isOpen = loan ? isOpenLoanType(loan.loanType) : false;
  const totalDebt = loan 
    ? (isOpen ? Number(loan.amount || 0) : Number(loan.totalToPay || loan.amount || 0))
    : (transaction.totalDebt !== undefined ? Number(transaction.totalDebt) : amountPaid);

  // 1. Desglose del pago
  let capitalPaid = 0;
  let interestPaid = 0;
  let lateFeePaid = 0;
  let discountPaid = Number(transaction.discountAmount || 0);

  if (transaction.capitalAmount !== undefined || transaction.interestAmount !== undefined) {
    capitalPaid = Number(transaction.capitalAmount || 0);
    interestPaid = Number(transaction.interestAmount || 0);
    lateFeePaid = Number(transaction.lateFeeAmount || 0);
  } else if (transaction.paymentType === 'Capital') {
    capitalPaid = amountPaid;
  } else if (transaction.paymentType === 'Interes') {
    interestPaid = amountPaid;
  } else if (transaction.description?.toLowerCase().includes('mora')) {
    lateFeePaid = amountPaid;
  } else {
    // Si es préstamo amortizado tradicional, se asume cuota completa o interés según tipo
    if (isOpen) {
      interestPaid = amountPaid;
    } else {
      capitalPaid = amountPaid;
    }
  }

  // 2. Si la transacción ya tiene guardados los balances calculados en base de datos
  if (transaction.previousBalance !== undefined && transaction.newBalance !== undefined) {
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

    let runningBalance = isOpen 
      ? Number(loan.amount || 0) 
      : Number(loan.totalToPay || loan.amount || 0);

    let foundPrev = runningBalance;
    let foundNew = runningBalance;

    for (const tx of sortedTxs) {
      const txAmount = Number(tx.amount) || 0;
      const txIsCap = tx.paymentType === 'Capital' || (tx.capitalAmount && tx.capitalAmount > 0);
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
      totalDebt,
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
    let prevBal = currentBal;
    let newBal = currentBal;

    if (isOpen) {
      if (transaction.paymentType === 'Capital') {
        prevBal = currentBal + amountPaid;
        newBal = currentBal;
      } else {
        prevBal = currentBal;
        newBal = currentBal;
      }
    } else {
      prevBal = currentBal + amountPaid;
      newBal = currentBal;
    }

    return {
      totalDebt,
      previousBalance: prevBal,
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
