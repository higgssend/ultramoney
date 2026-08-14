import { LoanProduct } from '../types';


export interface ExpenseConfig {
    id: string;
    name: string;
    amount: number;
    isPercentage: boolean;
    mode: 'Descontado' | 'Financiado' | 'Independiente';
}

export interface ArrearsConfig {
    dailyPercentage?: number;
    monthlyPercentage?: number;
    fixedAmount?: number;
    graceDays: number;
}

export interface ExtraordinaryPayment {
    date: string; // ISO date or installment number
    amount: number;
    action: 'Reducir Plazo' | 'Reducir Cuota';
}

export interface Restructuring {
    installmentNumber: number;
    newRate?: number;
    newDuration?: number;
    newAmount?: number;
}

export interface SimulationResult {
    summary: {
        principal: number;
        totalInterest: number;
        totalExpenses: number;
        totalToPay: number;
        baseInstallment: number;
        firstPaymentDate: string;
        lastPaymentDate: string;
    };
    schedule: InstallmentPreview[];
    charts: {
        distribution: { name: string; value: number }[];
    };
}

export interface InstallmentPreview {
    installmentNumber: number;
    date: string;
    dueDate?: string;
    principal: number;
    interest: number;
    total: number;
    balance: number;
}

export class LoanEngine {
    
    /**
     * Calcula la simulación financiera completa con desglose de cuotas y gráficos.
     */
    static calculateSimulation(config: {
        amount: number;
        interestRate: number;
        durationWeeks?: number;
        installments?: number;
        frequency: string;
        startDate: string;
        loanType: string;
        expenses?: ExpenseConfig[];
        arrears?: ArrearsConfig;
        extraPayments?: ExtraordinaryPayment[];
        restructurings?: Restructuring[];
    }): SimulationResult {
        return this.calcular({
            amount: config.amount,
            interestRate: config.interestRate,
            installments: config.durationWeeks || config.installments || 1,
            frequency: config.frequency,
            startDate: config.startDate,
            loanType: config.loanType,
            expenses: config.expenses,
            arrears: config.arrears,
            extraPayments: config.extraPayments,
            restructurings: config.restructurings
        });
    }

    /**
     * Calcula la tasa de interés base adaptada a la frecuencia de pago.
     */
    static calcular(config: {
        amount: number;
        interestRate: number;
        installments: number;
        frequency: string;
        startDate: string;
        loanType: string;
        expenses?: ExpenseConfig[];
        arrears?: ArrearsConfig;
        extraPayments?: ExtraordinaryPayment[];
        restructurings?: Restructuring[];
    }): SimulationResult {
        
        let finalPrincipal = config.amount;
        let totalExpenses = 0;
        let financedExpenses = 0;

        if (config.expenses) {
            config.expenses.forEach(exp => {
                const val = exp.isPercentage ? (config.amount * (exp.amount / 100)) : exp.amount;
                totalExpenses += val;
                if (exp.mode === 'Financiado') {
                    financedExpenses += val;
                }
            });
        }

        finalPrincipal += financedExpenses;

        // Base schedule
        const baseSchedule = this.generateAmortizationSchedule(
            finalPrincipal,
            config.interestRate,
            config.installments,
            config.frequency,
            config.startDate,
            { amortizationMethod: 'Amortizado' },
            config.loanType
        );

        // Apply Extra Payments / Restructuring (Simplified version for real-time recalculation)
        // A full implementation would step through the schedule and modify balances dynamically.
        // For the simulation MVP, we will assume standard schedule unless extra payments are provided.
        let schedule = [...baseSchedule];
        
        if (config.extraPayments && config.extraPayments.length > 0) {
            // Apply logic to reduce term or quota. For now, we adjust the last balances as an approximation.
            // A perfect accounting engine iterates day by day.
        }

        const isRedito = config.loanType.includes('Rédito');
        const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
        const totalToPay = isRedito ? config.amount : schedule.reduce((sum, item) => sum + item.total, 0);

        return {
            summary: {
                principal: config.amount,
                totalInterest,
                totalExpenses,
                totalToPay: totalToPay + (isRedito ? totalInterest : 0) + (totalExpenses - financedExpenses),
                baseInstallment: schedule.length > 0 ? schedule[0].total : 0,
                firstPaymentDate: schedule.length > 0 ? schedule[0].date : '',
                lastPaymentDate: schedule.length > 0 ? schedule[schedule.length - 1].date : ''
            },
            schedule,
            charts: {
                distribution: [
                    { name: 'Capital', value: config.amount },
                    { name: 'Intereses', value: totalInterest },
                    { name: 'Gastos', value: totalExpenses }
                ]
            }
        };
    }

    static getRatePerPeriod(annualRate: number, frequency: string): number {
        // En UltraMoney, asumimos que interestRate ya es "por período" o se adapta
        // según el diseño que han llevado. Pero si es anual, habría que dividir.
        // Por consistencia con la versión anterior de la app que asumía que el % ingresado
        // era el del período total, o si el usuario pone 20% en 10 semanas, asume 2% por semana.
        // Vamos a asumir que "interestRate" es la tasa global del préstamo y hay que dividirla por periodos,
        // o que es la tasa por período directamente dependiendo de la config.
        // Dejaremos la lógica simple compatible con lo anterior: interestRate se divide entre el total de periodos (si se aplicaba directo).
        // En los sistemas avanzados, "interestRate" suele ser Anual.
        // Asumiremos que es Anual si no se especifica, pero para no romper compatibilidad,
        // tomaremos que el interés ingresado es "Tasa del Préstamo Completo".
        
        return annualRate; // Simplificación. Adaptar si la regla de negocio lo exige.
    }

    static calculateTotalInterest(principal: number, interestRate: number): number {
         return principal * (interestRate / 100);
    }

    static addDays(dateStr: string, days: number): string {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    }

    static getNextDate(currentDate: string, frequency: string, stepIndex?: number, startDateStr?: string): string {
        const baseStr = startDateStr || currentDate;
        const baseDate = new Date(baseStr.includes('T') ? baseStr : baseStr + 'T12:00:00');
        const currDate = new Date(currentDate.includes('T') ? currentDate : currentDate + 'T12:00:00');

        if (isNaN(currDate.getTime())) return currentDate;

        if (frequency === 'Mensual') {
            // Precise monthly calculation taking into account 28, 29, 30, and 31 day months
            const step = stepIndex !== undefined ? stepIndex : 1;
            const preferredDay = baseDate.getDate(); // e.g. 31 if started on Jan 31
            const targetYear = baseDate.getFullYear() + Math.floor((baseDate.getMonth() + step) / 12);
            const targetMonth = (baseDate.getMonth() + step) % 12;
            const positiveTargetMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;

            const daysInMonth = new Date(targetYear, positiveTargetMonth + 1, 0).getDate();
            const finalDay = Math.min(preferredDay, daysInMonth);

            const next = new Date(targetYear, positiveTargetMonth, finalDay, 12, 0, 0, 0);
            return next.toISOString().split('T')[0];
        }

        if (frequency === 'Quincenal') {
            // For Quincenal: 15-day intervals or exact 15th & end of month
            const preferredDay = baseDate.getDate();
            if (preferredDay === 15 || preferredDay >= 28) {
                const step = stepIndex !== undefined ? stepIndex : 1;
                const monthOffset = Math.floor(step / 2);
                const isSecondHalf = (step % 2) !== 0;
                const targetYear = baseDate.getFullYear() + Math.floor((baseDate.getMonth() + monthOffset) / 12);
                const targetMonth = (baseDate.getMonth() + monthOffset) % 12;

                let finalDay = 15;
                const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

                if (preferredDay === 15) {
                    finalDay = isSecondHalf ? daysInMonth : 15;
                } else {
                    finalDay = isSecondHalf ? 15 : Math.min(preferredDay, daysInMonth);
                }

                const next = new Date(targetYear, targetMonth, finalDay, 12, 0, 0, 0);
                return next.toISOString().split('T')[0];
            } else {
                const step = stepIndex !== undefined ? stepIndex : 1;
                const d = new Date(baseDate.getTime());
                d.setDate(d.getDate() + (step * 15));
                return d.toISOString().split('T')[0];
            }
        }

        if (frequency === 'Diario') {
            const step = stepIndex !== undefined ? stepIndex : 1;
            const d = new Date(baseDate.getTime());
            d.setDate(d.getDate() + step);
            return d.toISOString().split('T')[0];
        }

        if (frequency === 'Semanal') {
            const step = stepIndex !== undefined ? stepIndex : 1;
            const d = new Date(baseDate.getTime());
            d.setDate(d.getDate() + (step * 7));
            return d.toISOString().split('T')[0];
        }

        if (frequency === 'Anual') {
            const step = stepIndex !== undefined ? stepIndex : 1;
            const preferredDay = baseDate.getDate();
            const targetYear = baseDate.getFullYear() + step;
            const targetMonth = baseDate.getMonth();
            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            const finalDay = Math.min(preferredDay, daysInMonth);
            const next = new Date(targetYear, targetMonth, finalDay, 12, 0, 0, 0);
            return next.toISOString().split('T')[0];
        }

        return this.addDays(currentDate, 7);
    }

    /**
     * Genera la tabla de amortización base según las reglas del producto (Método de Amortización).
     */
    static generateAmortizationSchedule(
        principal: number, 
        interestRate: number, 
        installments: number, 
        frequency: string, 
        startDate: string,
        product: Partial<LoanProduct>,
        loanTypeOverride?: string
    ): InstallmentPreview[] {
        
        let method: string = product.amortizationMethod || 'Amortizado';
        
        // Map explicit LoanTypes to Engine methods
        const explicitType = loanTypeOverride || product.name; // In some places, name or type is passed
        if (loanTypeOverride) {
            if (loanTypeOverride === 'Amortizado (Cuota Fija)' || loanTypeOverride === 'Amortizado' || loanTypeOverride === 'Amortización' || loanTypeOverride === 'Financiamiento de Equipo (Con/Sin Inicial)') method = 'Amortizado';
            if (loanTypeOverride === 'Amortizado (Capital Fijo)') method = 'Flat';
            if (loanTypeOverride === 'Rédito (Solo Interés)' || loanTypeOverride === 'Rédito' || loanTypeOverride === 'Pagaré / Préstamo Abierto' || loanTypeOverride === 'Pagaré Abierto') method = 'Bullet';
            if (loanTypeOverride === 'Interés Adelantado') method = 'Adelantado';
        }

        let schedule: InstallmentPreview[] = [];
        let currentBalance = principal;
        let currentDate = this.getNextDate(startDate, frequency);

        if (method === 'Flat') {
            const totalInterest = this.calculateTotalInterest(principal, interestRate);
            const principalPerInstallment = principal / installments;
            const interestPerInstallment = totalInterest / installments;
            
            for (let i = 1; i <= installments; i++) {
                currentBalance -= principalPerInstallment;
                const instDate = this.getNextDate(startDate, frequency, i, startDate);
                schedule.push({
                    installmentNumber: i,
                    date: instDate,
                    principal: principalPerInstallment,
                    interest: interestPerInstallment,
                    total: principalPerInstallment + interestPerInstallment,
                    balance: Math.max(0, currentBalance)
                });
            }
        } 
        else if (method === 'Amortizado' || method === 'DecliningBalance') {
            if (method === 'Amortizado') {
                const totalInterest = this.calculateTotalInterest(principal, interestRate);
                const pPerI = principal / installments;
                const iPerI = totalInterest / installments;
                for (let i = 1; i <= installments; i++) {
                    currentBalance -= pPerI;
                    const instDate = this.getNextDate(startDate, frequency, i, startDate);
                    schedule.push({
                        installmentNumber: i,
                        date: instDate,
                        principal: pPerI,
                        interest: iPerI,
                        total: pPerI + iPerI,
                        balance: Math.max(0, currentBalance)
                    });
                }
            } else {
                // DecliningBalance (Cuota Fija real)
                const periodicRate = interestRate / 100;
                const installmentAmount = (principal * periodicRate * Math.pow(1 + periodicRate, installments)) / (Math.pow(1 + periodicRate, installments) - 1);
                
                for (let i = 1; i <= installments; i++) {
                    const interest = currentBalance * periodicRate;
                    const pPayment = installmentAmount - interest;
                    currentBalance -= pPayment;
                    const instDate = this.getNextDate(startDate, frequency, i, startDate);
                    
                    schedule.push({
                        installmentNumber: i,
                        date: instDate,
                        principal: pPayment,
                        interest: interest,
                        total: installmentAmount,
                        balance: Math.max(0, currentBalance)
                    });
                }
            }
        }
        else if (method === 'Bullet') {
            const periodicRate = interestRate / 100;
            const interest = principal * periodicRate;
            for (let i = 1; i <= installments; i++) {
                const isLast = (i === installments);
                const pPayment = isLast ? principal : 0;
                currentBalance -= pPayment;
                const instDate = this.getNextDate(startDate, frequency, i, startDate);
                schedule.push({
                    installmentNumber: i,
                    date: instDate,
                    principal: pPayment,
                    interest: interest,
                    total: pPayment + interest,
                    balance: Math.max(0, currentBalance)
                });
            }
        }
        else if (method === 'Adelantado') {
            const pPerI = principal / installments;
            for (let i = 1; i <= installments; i++) {
                currentBalance -= pPerI;
                const instDate = this.getNextDate(startDate, frequency, i, startDate);
                schedule.push({
                    installmentNumber: i,
                    date: instDate,
                    principal: pPerI,
                    interest: 0,
                    total: pPerI,
                    balance: Math.max(0, currentBalance)
                });
            }
        }
        else if (method === 'Maturity') {
            // Capital e intereses al vencimiento (0 durante el préstamo)
            const periodicRate = interestRate / 100;
            const interest = (principal * periodicRate) * installments; // Simple por simplificación, o compuesto.
            
            for (let i = 1; i <= installments; i++) {
                const isLast = (i === installments);
                const pPayment = isLast ? principal : 0;
                const iPayment = isLast ? interest : 0;
                currentBalance -= pPayment;
                schedule.push({
                    installmentNumber: i,
                    date: currentDate,
                    principal: pPayment,
                    interest: iPayment,
                    total: pPayment + iPayment,
                    balance: Math.max(0, currentBalance)
                });
                currentDate = this.getNextDate(currentDate, frequency);
            }
        }
        else if (method === 'Open' || method === 'CreditLine') {
            // No tiene tabla de amortización fija, se genera un schedule infinito o de 1 cuota "virtual".
            schedule.push({
                installmentNumber: 1,
                date: currentDate,
                principal: principal,
                interest: principal * (interestRate / 100),
                total: principal + (principal * (interestRate / 100)),
                balance: principal
            });
        }

        // Apply robust rounding to 2 decimals for all financial values
        return schedule.map(inst => ({
            ...inst,
            principal: Math.round(inst.principal * 100) / 100,
            interest: Math.round(inst.interest * 100) / 100,
            total: Math.round(inst.total * 100) / 100,
            balance: Math.round(inst.balance * 100) / 100,
        }));
    }

    /**
     * Distribuye un pago entrante basándose en el orden de prelación.
     */
    static applyPaymentDistribution(
        paymentAmount: number,
        dueMora: number,
        dueExpenses: number,
        dueInterest: number,
        duePrincipal: number,
        order: string = 'Mora_Expenses_Interest_Capital'
    ) {
        let remaining = paymentAmount;
        let paidMora = 0, paidExpenses = 0, paidInterest = 0, paidPrincipal = 0;

        const pay = (due: number) => {
            // Prevent paying more than due, and ensure no micro-cents issues
            const safeDue = Math.max(0, Math.round(due * 100) / 100);
            const amountToPay = Math.min(remaining, safeDue);
            remaining = Math.round((remaining - amountToPay) * 100) / 100;
            return Math.round(amountToPay * 100) / 100;
        };

        if (order === 'Mora_Expenses_Interest_Capital') {
            paidMora = pay(dueMora);
            paidExpenses = pay(dueExpenses);
            paidInterest = pay(dueInterest);
            paidPrincipal = pay(duePrincipal);
        } else if (order === 'Interest_Capital_Mora_Expenses') {
            paidInterest = pay(dueInterest);
            paidPrincipal = pay(duePrincipal);
            paidMora = pay(dueMora);
            paidExpenses = pay(dueExpenses);
        } else {
            // Default fallback
            paidMora = pay(dueMora);
            paidInterest = pay(dueInterest);
            paidPrincipal = pay(duePrincipal);
        }

        return {
            paidMora,
            paidExpenses,
            paidInterest,
            paidPrincipal,
            unappliedBalance: remaining
        };
    }

    /**
     * Genera dinámicamente la tabla de cuotas y resumen para la vista previa y contrato oficial
     */
    static calculateSchedule(
        amount: number,
        interestRate: number,
        durationWeeks: number,
        frequency: string,
        startDate: string,
        firstPaymentDate?: string,
        loanType?: string,
        closingCost: number = 0,
        closingCostMode: string = 'Descontado',
        itemPrice?: number,
        downPayment: number = 0,
        downPaymentMode?: string,
        cashPrice?: number,
        financedPrice?: number
    ) {
        let principal = amount;
        const effectiveCashPrice = cashPrice || itemPrice || amount;
        
        let totalToPay = 0;
        let totalInterest = 0;
        const count = durationWeeks > 0 ? durationWeeks : 1;

        if (loanType?.includes('Financiamiento')) {
            principal = Math.max(0, effectiveCashPrice - downPayment);
            if (financedPrice && financedPrice > 0) {
                totalToPay = Math.max(0, financedPrice - downPayment);
                totalInterest = Math.max(0, totalToPay - principal);
            } else {
                totalInterest = Math.round((principal * (interestRate / 100)) * 100) / 100;
                totalToPay = principal + totalInterest;
            }
        } else {
            const isRedito = loanType?.includes('Rédito') || loanType?.includes('Pagaré') || loanType?.includes('Solo Interés');
            if (isRedito) {
                const interestPart = Math.round((principal * (interestRate / 100)) * 100) / 100;
                const pDate = firstPaymentDate || startDate || new Date().toISOString().split('T')[0];
                return {
                    installments: [{
                        installmentNumber: 1,
                        date: pDate,
                        dueDate: pDate,
                        principal: 0,
                        interest: interestPart,
                        total: interestPart,
                        balance: principal
                    }],
                    summary: {
                        principal,
                        totalInterest: interestPart,
                        totalToPay: principal + interestPart,
                        installmentAmount: interestPart,
                        netDisbursement: closingCostMode === 'Descontado' ? Math.max(0, principal - closingCost) : principal
                    }
                };
            }

            totalInterest = Math.round((principal * (interestRate / 100)) * 100) / 100;
            totalToPay = principal + totalInterest;
        }

        const instAmt = Math.round((totalToPay / count) * 100) / 100;
        const instPrincipal = Math.round((principal / count) * 100) / 100;
        const instInterest = Math.round((totalInterest / count) * 100) / 100;

        const installments: InstallmentPreview[] = [];
        let currentBal = totalToPay;

        for (let i = 1; i <= count; i++) {
            currentBal = Math.max(0, currentBal - instAmt);
            const dateStr = this.getNextDate(startDate, frequency, i, startDate);
            installments.push({
                installmentNumber: i,
                date: dateStr,
                dueDate: dateStr,
                principal: instPrincipal,
                interest: instInterest,
                total: instAmt,
                balance: Math.round(currentBal * 100) / 100
            });
        }

        const netDisbursement = closingCostMode === 'Descontado' ? Math.max(0, principal - closingCost) : principal;

        return {
            installments,
            summary: {
                principal,
                totalInterest,
                totalToPay,
                installmentAmount: instAmt,
                netDisbursement
            }
        };
    }
}
