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
  isInstallmentLoan: boolean;
  totalInstallments: number;
  installmentNumber: number;
  remainingInstallments: number;
  installmentText: string;
  remainingInstallmentsText: string;
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
 * desglose de capital/interés, número de cuota y cuotas restantes
 * para cualquier recibo, soportando préstamos a cuotas y pagarés abiertos.
 */
export function calculateReceiptBalances(
  transaction: Transaction,
  loan?: Loan | null,
  allLoanTransactions?: Transaction[]
): CalculatedReceiptBalances {
  const amountPaid = Number(transaction.amount) || 0;
  const loanRaw = loan as unknown as Record<string, unknown> | undefined;
  const rawLoanType = (loan?.loanType || (loanRaw ? String(loanRaw.loantype || loanRaw.loan_type || '') : '')) as string;
  const isOpen = loan ? isOpenLoanType(rawLoanType) : false;
  const isInstallmentLoan = !isOpen;
  
  const loanPrincipal = Number(loan?.amount || 0);
  const loanTotalToPay = Number(loan?.totalToPay ?? (loanRaw ? Number(loanRaw.totaltopay ?? loanRaw.total_to_pay) : undefined) ?? loanPrincipal);
  const totalDebt = loan 
    ? (isOpen ? loanPrincipal : (loanTotalToPay || loanPrincipal))
    : (transaction.totalDebt !== undefined && Number(transaction.totalDebt) > 0 ? Number(transaction.totalDebt) : amountPaid);

  const totalInstallments = loan 
    ? Number(loan.durationWeeks ?? (loanRaw ? Number(loanRaw.duration_weeks) : undefined) ?? loan.installments ?? 0)
    : 0;

  // 1. Desglose del pago (Capital, Interés, Mora, Descuento)
  let capitalPaid = 0;
  let interestPaid = 0;
  let lateFeePaid = Number(transaction.lateFeeAmount || 0);
  let discountPaid = Number(transaction.discountAmount || 0);

  if (
    (transaction.capitalAmount !== undefined && Number(transaction.capitalAmount) > 0) || 
    (transaction.interestAmount !== undefined && Number(transaction.interestAmount) > 0)
  ) {
    capitalPaid = Number(transaction.capitalAmount || 0);
    interestPaid = Number(transaction.interestAmount || 0);
    lateFeePaid = Number(transaction.lateFeeAmount || 0);
  } else if (transaction.paymentType === 'Capital') {
    capitalPaid = Math.max(0, amountPaid - lateFeePaid);
    interestPaid = 0;
  } else if (transaction.paymentType === 'Interes') {
    interestPaid = Math.max(0, amountPaid - lateFeePaid);
    capitalPaid = 0;
  } else if (transaction.description?.toLowerCase().includes('mora') || transaction.paymentType === 'Mora') {
    lateFeePaid = amountPaid;
    capitalPaid = 0;
    interestPaid = 0;
  } else {
    // Si no está desglosado explícitamente en la base de datos:
    if (isOpen) {
      interestPaid = Math.max(0, amountPaid - lateFeePaid);
      capitalPaid = 0;
    } else {
      const totalLoanInterest = Math.max(0, loanTotalToPay - loanPrincipal);
      const rawRate = Number(loan?.interestRate ?? (loanRaw ? Number(loanRaw.interestrate ?? loanRaw.interest_rate) : 0));
      if (totalInstallments > 0 && totalLoanInterest > 0) {
        const interestPerCuota = totalLoanInterest / totalInstallments;
        interestPaid = Math.min(amountPaid, Math.round(interestPerCuota * 100) / 100);
        capitalPaid = Math.max(0, Math.round((amountPaid - interestPaid - lateFeePaid) * 100) / 100);
      } else if (loan && rawRate > 0) {
        const approxInterest = totalInstallments > 0 
          ? ((loanPrincipal * (rawRate / 100)) / totalInstallments)
          : Math.round(loanPrincipal * (rawRate / 100));
        interestPaid = Math.min(amountPaid, Math.max(0, approxInterest));
        capitalPaid = Math.max(0, amountPaid - interestPaid - lateFeePaid);
      } else {
        capitalPaid = Math.max(0, amountPaid - lateFeePaid);
        interestPaid = 0;
      }
    }
  }

  // 2. Cálculo de Balances (Anterior y Nuevo)
  let previousBalance = 0;
  let newBalance = 0;

  const hasValidStoredBalances = 
    transaction.previousBalance !== undefined && 
    transaction.newBalance !== undefined && 
    (Number(transaction.previousBalance) > 0 || Number(transaction.newBalance) > 0);

  if (hasValidStoredBalances) {
    previousBalance = Number(transaction.previousBalance);
    newBalance = Number(transaction.newBalance);
  } else if (loan && allLoanTransactions && allLoanTransactions.length > 0) {
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

    previousBalance = foundPrev;
    newBalance = foundNew;
  } else if (loan) {
    const currentBal = Number(loan.remainingbalance ?? loan.remainingBalance ?? 0);
    if (isOpen) {
      if (transaction.paymentType === 'Capital' || capitalPaid > 0) {
        previousBalance = currentBal + (capitalPaid || amountPaid);
        newBalance = currentBal;
      } else {
        previousBalance = currentBal > 0 ? currentBal : loanPrincipal;
        newBalance = currentBal > 0 ? currentBal : loanPrincipal;
      }
    } else {
      previousBalance = currentBal + amountPaid;
      newBalance = currentBal;
    }
  } else {
    previousBalance = amountPaid;
    newBalance = 0;
  }

  // 3. Cálculo de Número de Cuota y Cuotas Restantes
  let installmentNumber = 1;
  let remainingInstallments = 0;

  if (isOpen) {
    installmentNumber = 0;
    remainingInstallments = 0;
  } else {
    // Intenta resolver número de cuota
    if (transaction.installmentNumber !== undefined && Number(transaction.installmentNumber) > 0) {
      installmentNumber = Number(transaction.installmentNumber);
    } else if (transaction.description) {
      const match = transaction.description.match(/(?:cuota|pago cuota|abono cuota)\s*#?\s*(\d+)/i);
      if (match && match[1]) {
        installmentNumber = Number(match[1]);
      } else if (allLoanTransactions && allLoanTransactions.length > 0) {
        const sortedTxs = [...allLoanTransactions].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const idx = sortedTxs.findIndex(t => t.id === transaction.id);
        installmentNumber = idx >= 0 ? (idx + 1) : 1;
      } else if (totalInstallments > 0) {
        const singleInstallment = (totalDebt / totalInstallments) || 1;
        const paidSoFar = Math.max(0, totalDebt - newBalance);
        installmentNumber = Math.max(1, Math.min(totalInstallments, Math.round(paidSoFar / singleInstallment) || 1));
      }
    } else if (allLoanTransactions && allLoanTransactions.length > 0) {
      const sortedTxs = [...allLoanTransactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const idx = sortedTxs.findIndex(t => t.id === transaction.id);
      installmentNumber = idx >= 0 ? (idx + 1) : 1;
    } else if (totalInstallments > 0) {
      const singleInstallment = (totalDebt / totalInstallments) || 1;
      const paidSoFar = Math.max(0, totalDebt - newBalance);
      installmentNumber = Math.max(1, Math.min(totalInstallments, Math.round(paidSoFar / singleInstallment) || 1));
    }

    // Cuotas Restantes
    if (newBalance <= 0.01) {
      remainingInstallments = 0;
    } else if (totalInstallments > 0) {
      const directRemaining = Math.max(0, totalInstallments - installmentNumber);
      const singleInstallment = (totalDebt / totalInstallments) || 1;
      const balanceBasedRemaining = Math.max(0, Math.ceil(newBalance / singleInstallment));
      remainingInstallments = Math.min(totalInstallments, Math.max(directRemaining, balanceBasedRemaining));
    } else {
      remainingInstallments = 0;
    }
  }

  // Textos formateados
  let installmentText = '';
  let remainingInstallmentsText = '';

  if (isOpen) {
    installmentText = 'Pago de Interés Periódico (Pagaré Abierto)';
    remainingInstallmentsText = 'Pagaré Abierto (Indefinido)';
  } else {
    installmentText = totalInstallments > 0
      ? `Cuota ${installmentNumber} de ${totalInstallments}`
      : `Cuota #${installmentNumber}`;

    if (newBalance <= 0.01) {
      remainingInstallmentsText = '0 (¡Préstamo Saldado Totalmente!)';
    } else if (remainingInstallments === 1) {
      remainingInstallmentsText = '1 cuota restante';
    } else if (remainingInstallments > 1) {
      remainingInstallmentsText = `${remainingInstallments} cuotas restantes`;
    } else {
      remainingInstallmentsText = '0 cuotas restantes';
    }
  }

  return {
    totalDebt: Number(totalDebt || previousBalance || amountPaid),
    previousBalance: Number(previousBalance),
    amountPaid,
    capitalPaid,
    interestPaid,
    lateFeePaid,
    discountPaid,
    newBalance: Number(newBalance),
    isOpenLoan: isOpen,
    isInstallmentLoan,
    totalInstallments,
    installmentNumber,
    remainingInstallments,
    installmentText,
    remainingInstallmentsText
  };
}
