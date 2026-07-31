import { LoanProduct } from '../types';

export interface InstallmentPreview {
    installmentNumber: number;
    date: string;
    principal: number;
    interest: number;
    total: number;
    balance: number;
}

export class LoanEngine {
    
    /**
     * Calcula la tasa de interés base adaptada a la frecuencia de pago.
     */
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

    static getNextDate(currentDate: string, frequency: string): string {
        switch (frequency) {
            case 'Diario': return this.addDays(currentDate, 1);
            case 'Semanal': return this.addDays(currentDate, 7);
            case 'Quincenal': return this.addDays(currentDate, 15);
            case 'Mensual': return this.addDays(currentDate, 30);
            case 'Anual': return this.addDays(currentDate, 365);
            default: return this.addDays(currentDate, 7);
        }
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
        product: Partial<LoanProduct>
    ): InstallmentPreview[] {
        
        const method = product.amortizationMethod || 'Amortizado';
        let schedule: InstallmentPreview[] = [];
        let currentBalance = principal;
        let currentDate = this.getNextDate(startDate, frequency);

        if (method === 'Flat') {
            // Capital + Réditos fijos.
            // Ejemplo: Principal=10000, Tasa=20% total. Interés Total=2000.
            // Se paga igual cantidad de capital e interés en cada cuota.
            const totalInterest = this.calculateTotalInterest(principal, interestRate);
            const principalPerInstallment = principal / installments;
            const interestPerInstallment = totalInterest / installments;
            
            for (let i = 1; i <= installments; i++) {
                currentBalance -= principalPerInstallment;
                schedule.push({
                    installmentNumber: i,
                    date: currentDate,
                    principal: principalPerInstallment,
                    interest: interestPerInstallment,
                    total: principalPerInstallment + interestPerInstallment,
                    balance: Math.max(0, currentBalance)
                });
                currentDate = this.getNextDate(currentDate, frequency);
            }
        } 
        else if (method === 'Amortizado' || method === 'DecliningBalance') {
            // French Amortization (Cuota Fija, interés sobre saldo)
            // C = P * (r(1+r)^n) / ((1+r)^n - 1)
            // Asumimos interestRate es Anual. Si frecuencia es Mensual, r = (interestRate/100)/12
            let r = (interestRate / 100); 
            // Si la tasa es mensual y la frecuencia es mensual, r = interestRate/100
            // Aquí hay que definir la lógica de la tasa. Si el usuario ingresa 5% y elige Mensual, r=0.05
            
            // Para simplificar, asumiremos que interestRate es la tasa por período en DeclineBalance
            // Si es 'Amortizado' tradicional sin tasa real, a veces prestamistas lo manejan igual que Flat.
            if (method === 'Amortizado') {
                const totalInterest = this.calculateTotalInterest(principal, interestRate);
                const totalDebt = principal + totalInterest;
                const installmentAmount = totalDebt / installments;
                
                // En Amortizado simple dominicano, a veces es igual a Flat
                const pPerI = principal / installments;
                const iPerI = totalInterest / installments;
                for (let i = 1; i <= installments; i++) {
                    currentBalance -= pPerI;
                    schedule.push({
                        installmentNumber: i,
                        date: currentDate,
                        principal: pPerI,
                        interest: iPerI,
                        total: pPerI + iPerI,
                        balance: Math.max(0, currentBalance)
                    });
                    currentDate = this.getNextDate(currentDate, frequency);
                }
            } else {
                // DecliningBalance (Cuota Fija real)
                const periodicRate = interestRate / 100;
                const installmentAmount = (principal * periodicRate * Math.pow(1 + periodicRate, installments)) / (Math.pow(1 + periodicRate, installments) - 1);
                
                for (let i = 1; i <= installments; i++) {
                    const interest = currentBalance * periodicRate;
                    const pPayment = installmentAmount - interest;
                    currentBalance -= pPayment;
                    
                    schedule.push({
                        installmentNumber: i,
                        date: currentDate,
                        principal: pPayment,
                        interest: interest,
                        total: installmentAmount,
                        balance: Math.max(0, currentBalance)
                    });
                    currentDate = this.getNextDate(currentDate, frequency);
                }
            }
        }
        else if (method === 'Bullet') {
            // Solo paga interés cada periodo, al final paga interés + capital completo
            const periodicRate = interestRate / 100;
            const interest = principal * periodicRate;
            for (let i = 1; i <= installments; i++) {
                const isLast = (i === installments);
                const pPayment = isLast ? principal : 0;
                currentBalance -= pPayment;
                schedule.push({
                    installmentNumber: i,
                    date: currentDate,
                    principal: pPayment,
                    interest: interest,
                    total: pPayment + interest,
                    balance: Math.max(0, currentBalance)
                });
                currentDate = this.getNextDate(currentDate, frequency);
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

        return schedule;
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
            const amountToPay = Math.min(remaining, due);
            remaining -= amountToPay;
            return amountToPay;
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
}
