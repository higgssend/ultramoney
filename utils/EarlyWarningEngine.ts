import { Loan, Client, Transaction, LoanStatus, AgingBucketSummary, EarlyWarningClientMetric, PaymentVelocityTrend } from '../types';

export class EarlyWarningEngine {
  
  /**
   * Calculates Aging Buckets (Tramos de Mora)
   * 0 días (Al día)
   * 1 - 15 días (Mora Temprana)
   * 16 - 30 días (Mora Media)
   * 31 - 60 días (Mora Crítica)
   * 61 - 90 días (Mora Severa / Cobro Legal)
   * +90 días (Cobro Judicial / Castigada)
   */
  public static calculateAgingBuckets(loans: Loan[]): AgingBucketSummary[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeOrOverdueLoans = loans.filter(l => 
      l.status !== LoanStatus.PAID && 
      l.status !== LoanStatus.REJECTED && 
      Number(l.remainingBalance) > 0
    );

    const totalPortfolioBalance = activeOrOverdueLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);

    const buckets: Record<AgingBucketSummary['bucketId'], { count: number; balance: number; originalAmount: number }> = {
      current: { count: 0, balance: 0, originalAmount: 0 },
      early: { count: 0, balance: 0, originalAmount: 0 },
      medium: { count: 0, balance: 0, originalAmount: 0 },
      critical: { count: 0, balance: 0, originalAmount: 0 },
      severe: { count: 0, balance: 0, originalAmount: 0 },
      legal_castigada: { count: 0, balance: 0, originalAmount: 0 }
    };

    activeOrOverdueLoans.forEach(loan => {
      const balance = Number(loan.remainingBalance) || 0;
      const original = Number(loan.amount) || balance;

      let overdueDays = 0;
      if (loan.nextPaymentDate) {
        const dueDate = new Date(loan.nextPaymentDate);
        dueDate.setHours(0, 0, 0, 0);
        if (today > dueDate) {
          overdueDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        }
      }

      if (loan.status === LoanStatus.LEGAL || (loan.status as string) === 'Cobro Legal' || overdueDays > 90) {
        buckets.legal_castigada.count += 1;
        buckets.legal_castigada.balance += balance;
        buckets.legal_castigada.originalAmount += original;
      } else if (overdueDays === 0) {
        buckets.current.count += 1;
        buckets.current.balance += balance;
        buckets.current.originalAmount += original;
      } else if (overdueDays <= 15) {
        buckets.early.count += 1;
        buckets.early.balance += balance;
        buckets.early.originalAmount += original;
      } else if (overdueDays <= 30) {
        buckets.medium.count += 1;
        buckets.medium.balance += balance;
        buckets.medium.originalAmount += original;
      } else if (overdueDays <= 60) {
        buckets.critical.count += 1;
        buckets.critical.balance += balance;
        buckets.critical.originalAmount += original;
      } else {
        buckets.severe.count += 1;
        buckets.severe.balance += balance;
        buckets.severe.originalAmount += original;
      }
    });

    const definitions: { id: AgingBucketSummary['bucketId']; name: string; range: string; rate: number; color: string }[] = [
      { id: 'current', name: 'Al Día / Normal', range: '0 días', rate: 0.01, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
      { id: 'early', name: 'Mora Temprana', range: '1 a 15 días', rate: 0.05, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
      { id: 'medium', name: 'Mora Media', range: '16 a 30 días', rate: 0.20, color: 'text-amber-600 bg-amber-50 border-amber-200' },
      { id: 'critical', name: 'Mora Crítica', range: '31 a 60 días', rate: 0.50, color: 'text-orange-600 bg-orange-50 border-orange-200' },
      { id: 'severe', name: 'Mora Severa', range: '61 a 90 días', rate: 0.80, color: 'text-rose-600 bg-rose-50 border-rose-200' },
      { id: 'legal_castigada', name: 'Cobro Judicial / Castigada', range: '+90 días / Legal', rate: 1.00, color: 'text-red-700 bg-red-50 border-red-300' }
    ];

    return definitions.map(def => {
      const data = buckets[def.id];
      const percentage = totalPortfolioBalance > 0 ? (data.balance / totalPortfolioBalance) * 100 : 0;
      const suggestedProvision = data.balance * def.rate;

      return {
        bucketId: def.id,
        bucketName: def.name,
        dayRange: def.range,
        loansCount: data.count,
        totalBalance: data.balance,
        totalOriginalAmount: data.originalAmount,
        percentageOfPortfolio: Math.round(percentage * 10) / 10,
        provisionRate: def.rate * 100,
        suggestedProvision: Math.round(suggestedProvision),
        color: def.color
      };
    });
  }

  /**
   * Evaluates early warning risk and payment velocity trend for each active borrower
   */
  public static evaluatePaymentVelocity(
    clients: Client[],
    loans: Loan[],
    transactions: Transaction[]
  ): EarlyWarningClientMetric[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clientMap = new Map<string, Client>();
    clients.forEach(c => clientMap.set(c.id, c));

    const metrics: EarlyWarningClientMetric[] = [];

    const activeLoans = loans.filter(l => 
      l.status !== LoanStatus.PAID && 
      l.status !== LoanStatus.REJECTED && 
      Number(l.remainingBalance) > 0
    );

    activeLoans.forEach(loan => {
      const client = clientMap.get(loan.clientId) || {
        id: loan.clientId,
        name: loan.clientName,
        phone: loan.clientPhone || '',
        cedula: loan.clientCedula || '',
        address: loan.clientAddress || '',
        creditScore: 65,
        status: 'Activo',
        joinedDate: loan.startDate
      };

      // Calculate overdue days
      let overdueDays = 0;
      if (loan.nextPaymentDate) {
        const dueDate = new Date(loan.nextPaymentDate);
        dueDate.setHours(0, 0, 0, 0);
        if (today > dueDate) {
          overdueDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        }
      }

      // Find loan payments in transactions
      const loanTx = transactions.filter(t => 
        t.type === 'Ingreso' && 
        (t.referenceId === loan.id || t.description?.includes(loan.id) || t.description?.includes(loan.clientName))
      );

      const totalPaymentsMade = loanTx.length;
      let chronicDelayCount = 0;
      let totalDelayDaysSum = 0;
      let recentPartialPaymentsCount = 0;

      // Analyze payment regularity and amounts
      const expectedInstallment = Number(loan.totalToPay && loan.durationWeeks ? (loan.totalToPay / loan.durationWeeks) : (loan.amount / 4));
      
      loanTx.forEach(tx => {
        if (tx.amount < expectedInstallment * 0.85) {
          recentPartialPaymentsCount++;
        }
      });

      // Synthetic chronic delay estimation based on credit score and past overdue periods
      if (client.creditScore < 60 || overdueDays > 0) {
        chronicDelayCount += Math.min(totalPaymentsMade, 3);
        totalDelayDaysSum += overdueDays + 4;
      }

      const averageDelayDays = totalPaymentsMade > 0 ? Math.round((totalDelayDaysSum / Math.max(1, totalPaymentsMade)) * 10) / 10 : overdueDays;
      const chronicDelayRatio = totalPaymentsMade > 0 ? Math.round((chronicDelayCount / totalPaymentsMade) * 100) : (overdueDays > 0 ? 80 : 0);

      // Determine Trend
      let trend: PaymentVelocityTrend = 'Puntual / Sólido';
      let recommendedAction = 'Mantener condiciones estándar. Cliente puntual.';

      if (overdueDays > 30 || loan.status === LoanStatus.LEGAL) {
        trend = 'Riesgo Inminente de Default';
        recommendedAction = 'Iniciar requerimiento formal de cobro, intimación notarial o citación de garante.';
      } else if (overdueDays > 15 || recentPartialPaymentsCount >= 2) {
        trend = 'Deterioro Progresivo';
        recommendedAction = 'Contactar al cliente para evaluar refinanciamiento preventivo o reajuste de cuota.';
      } else if (overdueDays > 0 || chronicDelayRatio >= 40) {
        trend = 'Retraso Recurrente';
        recommendedAction = 'Enviar recordatorio anticipado por WhatsApp 24 horas antes del próximo vencimiento.';
      }

      // Payment capacity score (0 to 100)
      let capacityScore = 100;
      capacityScore -= overdueDays * 1.5;
      capacityScore -= recentPartialPaymentsCount * 12;
      capacityScore -= (100 - (client.creditScore || 70)) * 0.4;
      capacityScore = Math.max(10, Math.min(100, Math.round(capacityScore)));

      metrics.push({
        client,
        loan,
        overdueDays,
        trend,
        averageDelayDays,
        paymentCapacityScore: capacityScore,
        recentPartialPaymentsCount,
        chronicDelayRatio,
        recommendedAction
      });
    });

    // Sort by risk priority (highest risk first)
    return metrics.sort((a, b) => b.overdueDays - a.overdueDays || a.paymentCapacityScore - b.paymentCapacityScore);
  }
}
