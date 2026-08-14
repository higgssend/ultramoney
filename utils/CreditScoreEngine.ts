import { Client, Loan, LoanStatus } from '../types';

export type CreditRiskCategory = 'Platino' | 'Bueno' | 'Regular' | 'Alto Riesgo';

export interface CreditScoreResult {
  score: number;             // 300 to 850 (FICO / Datacrédito scale)
  points100: number;         // 0 to 100 normalized points
  category: CreditRiskCategory;
  grade: 'A' | 'B' | 'C' | 'D';
  label: string;             // e.g. "Cliente Platino", "Cliente Confiable", "Cliente Regular", "Alto Riesgo"
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  dotColor: string;
  recommendation: string;
  riskBanner: {
    type: 'platino' | 'bueno' | 'regular' | 'danger';
    title: string;
    description: string;
    suggestGuarantor: boolean;
    suggestCollateral: boolean;
    allowImmediateDisbursement: boolean;
  };
  metrics: {
    totalLoans: number;
    activeLoans: number;
    paidLoans: number;
    overdueLoans: number;
    totalBorrowed: number;
    activeDebt: number;
    monthlyIncome: number;
    debtToIncomeRatio: number; // percentage (e.g. 35)
    punctualityPercentage: number; // 0 to 100
  };
}

export class CreditScoreEngine {
  /**
   * Unified calculation of credit score and risk evaluation for any client
   */
  public static calculateScore(client: Client | null | undefined, allLoans: Loan[]): CreditScoreResult {
    if (!client) {
      return this.getDefaultResult();
    }

    const clientLoans = allLoans.filter(l => l.clientId === client.id);
    const activeLoans = clientLoans.filter(l => 
      l.status === LoanStatus.ACTIVE || 
      l.status === LoanStatus.OVERDUE || 
      (l.status as string) === 'Vigente'
    );
    const paidLoans = clientLoans.filter(l => 
      l.status === LoanStatus.PAID || 
      (l.status as string) === 'Saldado'
    );
    const overdueLoans = clientLoans.filter(l => 
      l.status === LoanStatus.OVERDUE || 
      (l.status as string) === 'Vencido'
    );

    const totalBorrowed = clientLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const activeDebt = activeLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
    const monthlyIncome = Number(client.income) || 0;

    // Debt to Income Ratio
    const debtToIncomeRatio = monthlyIncome > 0 ? Math.round((activeDebt / monthlyIncome) * 100) : 0;

    // Calculate baseline score
    let baseScore = 650;
    if (typeof client.creditScore === 'number' && client.creditScore > 0) {
      if (client.creditScore > 100) {
        baseScore = Math.min(850, Math.max(300, client.creditScore));
      } else {
        // Convert 0-100 to 300-850 scale
        baseScore = Math.round(300 + (client.creditScore / 100) * 550);
      }
    }

    // Behavioral bonuses & penalties based on real repayment history
    let dynamicScore = baseScore;

    // Bonus for completed loans (+35 per loan up to +140)
    if (paidLoans.length > 0) {
      dynamicScore += Math.min(paidLoans.length * 35, 140);
    }

    // Clean active loans bonus (+30)
    if (activeLoans.length > 0 && overdueLoans.length === 0) {
      dynamicScore += 30;
    }

    // Overdue loans heavy penalty (-80 per overdue loan)
    if (overdueLoans.length > 0) {
      dynamicScore -= overdueLoans.length * 80;
    }

    // Over-leveraged penalty
    if (monthlyIncome > 0 && activeDebt > monthlyIncome * 4) {
      dynamicScore -= 50;
    } else if (monthlyIncome >= 50000) {
      dynamicScore += 25;
    }

    // Clamp score within standard range [300, 850]
    const finalScore = Math.max(300, Math.min(850, dynamicScore));
    const points100 = Math.round(((finalScore - 300) / (850 - 300)) * 100);

    // Punctuality percentage
    const totalFinishedOrOverdue = paidLoans.length + overdueLoans.length;
    const punctualityPercentage = totalFinishedOrOverdue > 0 
      ? Math.round((paidLoans.length / totalFinishedOrOverdue) * 100) 
      : (overdueLoans.length === 0 ? 100 : 50);

    // Determine category, grade, colors, and semáforo recommendation
    let category: CreditRiskCategory;
    let grade: 'A' | 'B' | 'C' | 'D';
    let label: string;
    let badgeColor: string;
    let badgeBg: string;
    let badgeBorder: string;
    let dotColor: string;
    let recommendation: string;
    let riskBanner: CreditScoreResult['riskBanner'];

    if (points100 >= 90 || finalScore >= 750) {
      // 🟢 PLATINO (90-100 pts / 750-850)
      category = 'Platino';
      grade = 'A';
      label = 'Cliente Platino';
      badgeColor = 'text-emerald-700 dark:text-emerald-300';
      badgeBg = 'bg-emerald-50 dark:bg-emerald-950/50';
      badgeBorder = 'border-emerald-200 dark:border-emerald-800';
      dotColor = 'bg-emerald-500';
      recommendation = 'Cliente AAA con historial intachable. Califica para desembolso inmediato y tasas preferenciales.';
      riskBanner = {
        type: 'platino',
        title: '🟢 Cliente Platino (Calificación Excelente)',
        description: 'Califica para desembolso inmediato y condiciones preferenciales.',
        suggestGuarantor: false,
        suggestCollateral: false,
        allowImmediateDisbursement: true
      };
    } else if (points100 >= 75 || finalScore >= 670) {
      // 🔵 BUENO / CONFIABLE (75-89 pts / 670-749)
      category = 'Bueno';
      grade = 'B';
      label = 'Cliente Confiable';
      badgeColor = 'text-indigo-700 dark:text-indigo-300';
      badgeBg = 'bg-indigo-50 dark:bg-indigo-950/50';
      badgeBorder = 'border-indigo-200 dark:border-indigo-800';
      dotColor = 'bg-indigo-600';
      recommendation = 'Perfil solvente y de bajo riesgo. Aprobación estándar recomendada según ingresos.';
      riskBanner = {
        type: 'bueno',
        title: '🔵 Cliente Confiable (Buen Historial)',
        description: 'Capacidad de pago demostrada. Aprobación estándar recomendada.',
        suggestGuarantor: false,
        suggestCollateral: false,
        allowImmediateDisbursement: true
      };
    } else if (points100 >= 60 || finalScore >= 580) {
      // 🟡 REGULAR / PRECAUCIÓN (60-74 pts / 580-669)
      category = 'Regular';
      grade = 'C';
      label = 'Cliente Regular';
      badgeColor = 'text-amber-700 dark:text-amber-300';
      badgeBg = 'bg-amber-50 dark:bg-amber-950/50';
      badgeBorder = 'border-amber-200 dark:border-amber-800';
      dotColor = 'bg-amber-500';
      recommendation = 'Perfil moderado. Se sugiere requerir garantía prendaria o garante solidario.';
      riskBanner = {
        type: 'regular',
        title: '🟡 Cliente Regular (Aprobación Condicionada)',
        description: 'Se sugiere exigir garantía prendaria o garante solidario para mitigar riesgo de crédito.',
        suggestGuarantor: true,
        suggestCollateral: true,
        allowImmediateDisbursement: false
      };
    } else {
      // 🔴 ALTO RIESGO (< 60 pts / < 580)
      category = 'Alto Riesgo';
      grade = 'D';
      label = 'Alto Riesgo';
      badgeColor = 'text-rose-700 dark:text-rose-300';
      badgeBg = 'bg-rose-50 dark:bg-rose-950/50';
      badgeBorder = 'border-rose-200 dark:border-rose-800';
      dotColor = 'bg-rose-500';
      recommendation = '⚠️ Alerta: Historial con atrasos o sobreendeudamiento. Exigir aval solidario o garantía y aprobación gerencial.';
      riskBanner = {
        type: 'danger',
        title: '🔴 Alto Riesgo (Alerta de Morosidad)',
        description: 'El cliente presenta atrasos o deudas elevadas. Se recomienda exigir garantía o garante solidario.',
        suggestGuarantor: true,
        suggestCollateral: true,
        allowImmediateDisbursement: false
      };
    }

    return {
      score: finalScore,
      points100,
      category,
      grade,
      label,
      badgeColor,
      badgeBg,
      badgeBorder,
      dotColor,
      recommendation,
      riskBanner,
      metrics: {
        totalLoans: clientLoans.length,
        activeLoans: activeLoans.length,
        paidLoans: paidLoans.length,
        overdueLoans: overdueLoans.length,
        totalBorrowed,
        activeDebt,
        monthlyIncome,
        debtToIncomeRatio,
        punctualityPercentage
      }
    };
  }

  private static getDefaultResult(): CreditScoreResult {
    return {
      score: 650,
      points100: 64,
      category: 'Regular',
      grade: 'C',
      label: 'Sin Información',
      badgeColor: 'text-slate-600',
      badgeBg: 'bg-slate-50',
      badgeBorder: 'border-slate-200',
      dotColor: 'bg-slate-400',
      recommendation: 'Sin historial crediticio registrado.',
      riskBanner: {
        type: 'regular',
        title: 'Sin Historial Registrado',
        description: 'Cliente nuevo sin historial de préstamos.',
        suggestGuarantor: false,
        suggestCollateral: false,
        allowImmediateDisbursement: true
      },
      metrics: {
        totalLoans: 0,
        activeLoans: 0,
        paidLoans: 0,
        overdueLoans: 0,
        totalBorrowed: 0,
        activeDebt: 0,
        monthlyIncome: 0,
        debtToIncomeRatio: 0,
        punctualityPercentage: 100
      }
    };
  }
}
