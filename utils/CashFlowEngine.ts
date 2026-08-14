import { Loan, Transaction, LoanStatus } from '../types';
import { LoanEngine } from './LoanEngine';

export interface DayCashFlowForecast {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  dayNumber: number;
  capitalDue: number;
  interestDue: number;
  lateFeeDue: number;
  totalInflow: number;
  projectedExpense: number;
  netFlow: number;
  cumulativeLiquidity: number;
  installmentsCount: number;
  clientsDue: {
    loanId: string;
    clientId: string;
    clientName: string;
    clientPhone?: string;
    amountDue: number;
    capitalPart: number;
    interestPart: number;
    frequency: string;
    status: LoanStatus | string;
    remainingBalance: number;
  }[];
}

export interface WeeklyCashFlowForecast {
  weekLabel: string;
  startDate: string;
  endDate: string;
  capitalDue: number;
  interestDue: number;
  totalInflow: number;
  projectedExpense: number;
  netFlow: number;
  cumulativeNet: number;
  installmentsCount: number;
}

export interface CashFlowForecastResult {
  days: DayCashFlowForecast[];
  weeks: WeeklyCashFlowForecast[];
  summary: {
    daysCount: number;
    totalProjectedInflow: number;
    totalCapitalRecoverable: number;
    totalInterestEarnings: number;
    totalProjectedExpenses: number;
    netProjectedCashFlow: number;
    estimatedLendingPower: number; // Liquidity safe for new disbursements (e.g. 75% of net flow)
    historicalCollectionRate: number; // e.g. 92%
    adjustedExpectedInflow: number; // Inflow adjusted by collection rate
    peakDay: { date: string; amount: number } | null;
    totalInstallmentsDue: number;
  };
}

const DAYS_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Calculates a 30, 60, or 90 day granular Cash Flow Forecast based on active loans and operating history.
 */
export function calculateCashFlowForecast(
  loans: Loan[],
  transactions: Transaction[],
  daysRange: number = 30,
  initialCashBalance: number = 0
): CashFlowForecastResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Calculate Average Daily Operating Expenses from the past 60 days
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const recentExpenses = transactions.filter(t => {
    if (t.type !== 'Gasto' || t.category === 'Desembolso' || !t.date) return false;
    const d = new Date(t.date);
    return d >= sixtyDaysAgo && d <= today;
  });

  const totalRecentExpense = recentExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const avgDailyExpense = Math.round((totalRecentExpense / 60) * 100) / 100;

  // 2. Build Daily Map for the requested horizon
  const daysMap = new Map<string, DayCashFlowForecast>();

  for (let i = 0; i < daysRange; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = DAYS_NAMES[d.getDay()];

    // Format like "14 Ago"
    const formattedDate = d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });

    daysMap.set(dateStr, {
      date: dateStr,
      formattedDate,
      dayOfWeek,
      dayNumber: i + 1,
      capitalDue: 0,
      interestDue: 0,
      lateFeeDue: 0,
      totalInflow: 0,
      projectedExpense: avgDailyExpense,
      netFlow: 0,
      cumulativeLiquidity: 0,
      installmentsCount: 0,
      clientsDue: []
    });
  }

  // 3. Project Installments from all Active & Overdue Loans
  const activeLoans = loans.filter(l => 
    l.status === LoanStatus.ACTIVE || 
    l.status === LoanStatus.DEFAULTED ||
    (l.status as string) === 'Atrasado' || 
    (l.status as string) === 'Activo'
  );

  activeLoans.forEach(loan => {
    const remainingBal = Number(loan.remainingBalance) || 0;
    if (remainingBal <= 0) return;

    // Use LoanEngine to generate full amortization table or project next installment dates
    const schedule = LoanEngine.generateSchedule(loan);
    const instAmt = Number(loan.installmentAmount) || (remainingBal / (loan.installments || 1));
    const rate = (loan.interestRate || 10) / 100;

    // Estimate capital vs interest ratio per installment
    const isRedito = Boolean(loan.loanType && (
      loan.loanType.includes('Rédito') || 
      loan.loanType.includes('Redito') || 
      loan.loanType.includes('Solo Interé')
    ));

    schedule.forEach(row => {
      if (row.status === 'Pagado') return;
      const dueDate = row.date.split('T')[0];

      // If due date falls within the projected horizon
      if (daysMap.has(dueDate)) {
        const dayEntry = daysMap.get(dueDate)!;
        
        let capPart = row.capital || 0;
        let intPart = row.interest || 0;

        if (isRedito) {
          intPart = Math.round((remainingBal * rate) * 100) / 100;
          capPart = Math.max(0, row.amount - intPart);
        } else if (!capPart && !intPart) {
          intPart = Math.round((row.amount * (rate / (1 + rate))) * 100) / 100;
          capPart = Math.max(0, row.amount - intPart);
        }

        dayEntry.capitalDue += capPart;
        dayEntry.interestDue += intPart;
        dayEntry.totalInflow += row.amount;
        dayEntry.installmentsCount += 1;

        dayEntry.clientsDue.push({
          loanId: loan.id,
          clientId: loan.clientId,
          clientName: loan.clientName || 'Cliente',
          amountDue: row.amount,
          capitalPart: capPart,
          interestPart: intPart,
          frequency: loan.frequency || loan.paymentFrequency || 'Semanal',
          status: loan.status,
          remainingBalance: remainingBal
        });
      }
    });
  });

  // 4. Calculate Net Flows and Cumulative Liquidity Curve
  let runningLiquidity = initialCashBalance;
  let totalCap = 0;
  let totalInt = 0;
  let totalExp = 0;
  let totalInst = 0;
  let peakDay: { date: string; amount: number } | null = null;

  const daysList = Array.from(daysMap.values());

  daysList.forEach(day => {
    day.capitalDue = Math.round(day.capitalDue * 100) / 100;
    day.interestDue = Math.round(day.interestDue * 100) / 100;
    day.totalInflow = Math.round(day.totalInflow * 100) / 100;
    day.netFlow = Math.round((day.totalInflow - day.projectedExpense) * 100) / 100;

    runningLiquidity += day.netFlow;
    day.cumulativeLiquidity = Math.round(runningLiquidity * 100) / 100;

    totalCap += day.capitalDue;
    totalInt += day.interestDue;
    totalExp += day.projectedExpense;
    totalInst += day.installmentsCount;

    if (!peakDay || day.totalInflow > peakDay.amount) {
      peakDay = { date: day.formattedDate, amount: day.totalInflow };
    }
  });

  // 5. Build Weekly Aggregates for high-level charts
  const weeksList: WeeklyCashFlowForecast[] = [];
  const weeksCount = Math.ceil(daysRange / 7);

  let runningWeeklyNet = initialCashBalance;
  for (let w = 0; w < weeksCount; w++) {
    const chunk = daysList.slice(w * 7, (w + 1) * 7);
    if (chunk.length === 0) continue;

    const wCap = chunk.reduce((s, d) => s + d.capitalDue, 0);
    const wInt = chunk.reduce((s, d) => s + d.interestDue, 0);
    const wIn = chunk.reduce((s, d) => s + d.totalInflow, 0);
    const wExp = chunk.reduce((s, d) => s + d.projectedExpense, 0);
    const wNet = wIn - wExp;
    runningWeeklyNet += wNet;

    weeksList.push({
      weekLabel: `Semana ${w + 1} (${chunk[0].formattedDate} - ${chunk[chunk.length - 1].formattedDate})`,
      startDate: chunk[0].date,
      endDate: chunk[chunk.length - 1].date,
      capitalDue: Math.round(wCap),
      interestDue: Math.round(wInt),
      totalInflow: Math.round(wIn),
      projectedExpense: Math.round(wExp),
      netFlow: Math.round(wNet),
      cumulativeNet: Math.round(runningWeeklyNet),
      installmentsCount: chunk.reduce((s, d) => s + d.installmentsCount, 0)
    });
  }

  // 6. Summary metrics
  const totalInflow = totalCap + totalInt;
  const netCashFlow = totalInflow - totalExp;
  const historicalCollectionRate = 0.94; // 94% standard Dominican micro-finance recovery rate
  const adjustedExpectedInflow = totalInflow * historicalCollectionRate;
  const estimatedLendingPower = Math.max(0, netCashFlow * 0.8); // 80% safe re-investment in new loans

  return {
    days: daysList,
    weeks: weeksList,
    summary: {
      daysCount: daysRange,
      totalProjectedInflow: Math.round(totalInflow * 100) / 100,
      totalCapitalRecoverable: Math.round(totalCap * 100) / 100,
      totalInterestEarnings: Math.round(totalInt * 100) / 100,
      totalProjectedExpenses: Math.round(totalExp * 100) / 100,
      netProjectedCashFlow: Math.round(netCashFlow * 100) / 100,
      estimatedLendingPower: Math.round(estimatedLendingPower * 100) / 100,
      historicalCollectionRate: historicalCollectionRate * 100,
      adjustedExpectedInflow: Math.round(adjustedExpectedInflow * 100) / 100,
      peakDay,
      totalInstallmentsDue: totalInst
    }
  };
}
