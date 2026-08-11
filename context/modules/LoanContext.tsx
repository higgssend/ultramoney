import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Loan, LoanProduct, LoanRequest, LoanStatus, LoanType, PaymentMethod } from '../../types';
import type { LoanDB, LoanProductDB, LoanRequestDB, TransactionDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useClients } from './ClientContext';
import { useSettings } from './SettingsContext';
import { logger } from '../../utils/logger';

interface LoanContextType {
  loans: Loan[];
  loanProducts: LoanProduct[];
  loanRequests: LoanRequest[];
  
  createLoan: (loanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => void;
  refinanceLoan: (oldLoanId: string, newLoanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => void;
  forgiveDebt: (loanId: string, amount: number, note: string) => Promise<void>;
  registerPayment: (
    loanId: string, amount: number, note: string, paymentDate?: string, 
    invoiceDate?: string, paymentType?: 'Interes' | 'Capital' | 'Mixto',
    capitalAmount?: number, paymentMethod?: PaymentMethod, cashierId?: string
  ) => Promise<Transaction | null>;
  addLoanRequest: (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => void;
  deleteLoanRequest: (requestId: string) => void;
  addLoanProduct: (product: Omit<LoanProduct, 'id' | 'createdAt'>) => Promise<void>;
  updateLoanProduct: (id: string, updates: Partial<LoanProduct>) => Promise<void>;
  deleteLoanProduct: (id: string) => Promise<void>;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

const mapTransaction = (t: TransactionDB) => ({
  ...t,
  referenceId: t.referenceid || t.reference_id || undefined,
  paymentType: (t.paymenttype || t.payment_type || undefined) as 'Interes' | 'Capital' | 'Mixto' | undefined,
  paymentMethod: (t.paymentmethod || t.payment_method || 'Efectivo') as import('../../types').PaymentMethod,
  invoiceDate: t.invoicedate || t.invoice_date || undefined,
  category: (t.category || (t.referenceid ? 'Pago Préstamo' : 'Otro')) as import('../../types').Transaction['category'],
});

export const LoanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const { clients } = useClients();
  const { addAuditLog } = useSettings();
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setLoans([]); setLoanProducts([]); setLoanRequests([]);
      return;
    }

    const fetchLoans = async () => {
      try {
        const [loansRes, productsRes, requestsRes] = await Promise.all([
          insforge.database.from('loans').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('loan_products').select('*').order('created_at', { ascending: false }),
          insforge.database.from('loan_requests').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false })
        ]);

        if (loansRes.data) {
          setLoans((loansRes.data as LoanDB[]).map((l) => ({
            id: l.id,
            clientId: l.clientid || l.client_id || '',
            clientName: l.clientname || l.client_name || 'Sin Nombre',
            amount: Number(l.amount) || 0,
            interestRate: Number(l.interestrate ?? l.interest_rate) || 0,
            installments: l.installments,
            currentInstallment: l.current_installment || 0,
            frequency: ((l.frequency || l.payment_frequency || 'Mensual') as Loan['frequency']),
            paymentFrequency: ((l.frequency || l.payment_frequency || 'Mensual') as Loan['frequency']),
            startDate: l.startdate || l.start_date || '',
            nextPaymentDate: l.next_payment_date || l.nextpaymentdate || '',
            status: l.status as LoanStatus,
            loanType: (l.loantype || l.loan_type || 'Amortización') as LoanType,
            loanCategory: (l.loancategory || l.loan_category) as Loan['loanCategory'],
            remainingBalance: Number(l.remainingbalance ?? l.remaining_balance) || 0,
            totalToPay: Number(l.totaltopay ?? l.total_to_pay) || 0,
            installmentAmount: l.installmentamount ?? l.installment_amount,
            durationWeeks: l.duration_weeks || l.durationweeks,
            lateFeePercentage: l.late_fee_percentage,
            graceDays: l.grace_days,
            guarantorId: l.guarantor_id || l.collateralref,
            note: l.note,
            currency: (l.currency as 'DOP' | 'USD') || 'DOP',
          })));
        }
        if (productsRes.data) {
          setLoanProducts((productsRes.data as LoanProductDB[]).map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            interestRate: Number(p.interest_rate ?? p.interestrate) || 0,
            minAmount: Number(p.min_amount) || 0,
            maxAmount: Number(p.max_amount) || 0,
            frequency: ((p.frequency || p.payment_frequency || 'Mensual') as LoanProduct['frequency']),
            termMonths: p.term_months || 1,
            defaultInstallments: p.default_installments ?? p.installments ?? 1,
            requiresCollateral: p.requires_collateral ?? false,
            collateralType: p.collateral_type,
            disbursementFee: Number(p.disbursement_fee) || 0,
            lateFeePercentage: Number(p.late_fee_percentage) || 0,
            graceDays: Number(p.grace_days) || 0,
            prepaymentAllowed: p.prepayment_allowed ?? true,
            autoCalculateInterest: p.auto_calculate_interest ?? true,
            isActive: p.is_active !== false,
            amortizationMethod: (p.amortization_method || 'Amortizado') as LoanProduct['amortizationMethod'],
            paymentOrder: (p.payment_order || 'Interest_Capital_Mora_Expenses') as LoanProduct['paymentOrder'],
            recalculateInterestOnEarlyPayoff: false,
            capitalizationFrequency: 'Ninguno' as LoanProduct['capitalizationFrequency'],
            interestType: (p.interest_type || 'Fijo') as LoanProduct['interestType'],
            createdAt: p.created_at || '',
            updatedAt: p.updated_at || '',
          })));
        }
        if (requestsRes.data) {
          setLoanRequests((requestsRes.data as LoanRequestDB[]).map((r) => ({
            id: r.id,
            clientName: r.client_name || 'Sin Nombre',
            clientPhone: r.client_phone,
            clientEmail: r.client_email,
            clientId: r.client_id,
            requestedAmount: r.requested_amount ?? r.amount,
            requestedTerm: r.requested_term,
            interestRate: r.interest_rate,
            durationWeeks: r.duration_weeks,
            frequency: r.frequency as LoanRequest['frequency'],
            loanType: r.loan_type as LoanRequest['loanType'],
            purpose: r.purpose,
            notes: r.notes,
            status: r.status as LoanRequest['status'],
            requestDate: r.created_at || r.request_date || new Date().toISOString(),
          })));
        }
      } catch (error) {
        logger.error("Error fetching loans:", error);
      }
    };
    fetchLoans();
  }, [currentUser]);

  const createLoan = async (loanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => {
    if (!currentUser) return;
    
    const installments = loanData.installments || loanData.durationWeeks || 1;
    const paymentFrequency = loanData.paymentFrequency || loanData.frequency || 'Semanal';
    
    let ttp = loanData.amount;
    if (loanData.loanType === 'Amortización' || (loanData.loanType as string).startsWith('Amortizado')) {
       ttp = loanData.amount + (loanData.amount * (loanData.interestRate / 100) * installments);
    }
    const instAmt = ttp / installments;

    const clientObj = clients.find(c => c.id === loanData.clientId);
    const clientName = clientObj ? `${clientObj.name} ${clientObj.lastName || ''}`.trim() : (loanData.clientName || 'Cliente');

    const { data, error } = await insforge.database.from('loans').insert([{
      lender_id: currentUser.id,
      clientid: loanData.clientId,
      clientname: clientName,
      amount: loanData.amount,
      interestrate: loanData.interestRate,
      installments: installments,
      durationweeks: installments,
      installmentamount: instAmt,
      frequency: paymentFrequency,
      startdate: loanData.startDate,
      next_payment_date: loanData.nextPaymentDate || null,
      status: LoanStatus.ACTIVE,
      remainingbalance: ttp,
      totaltopay: ttp,
      loantype: loanData.loanType,
      collateralref: loanData.guarantorId || null,
      collateraldescription: loanData.note || null
    }]).select().single();

    if (data && !error) {
      const newLoan: Loan = {
        id: data.id, clientId: data.clientid || data.client_id, amount: data.amount, interestRate: data.interestrate || data.interest_rate,
        installments: data.installments, durationWeeks: data.durationweeks || data.installments, currentInstallment: 0,
        paymentFrequency: data.frequency || data.payment_frequency, frequency: data.frequency || data.payment_frequency,
        startDate: data.startdate || data.start_date, nextPaymentDate: data.next_payment_date,
        status: data.status, remainingBalance: data.remainingbalance, totalToPay: data.totaltopay,
        loanType: data.loantype, guarantorId: data.collateralref, note: data.collateraldescription || loanData.note
      };
      setLoans(prev => [newLoan, ...prev]);
      addAuditLog('loan_created', `Creó un préstamo por RD$ ${loanData.amount}`);
      addToast("Préstamo creado exitosamente", "success");
    } else {
      logger.error("Error al crear préstamo:", error);
      addToast(`Error al crear préstamo: ${error?.message || 'Error desconocido'}`, "error");
    }
  };

  const refinanceLoan = async (oldLoanId: string, newLoanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => {
    if (!currentUser) return;
    const oldLoan = loans.find(l => l.id === oldLoanId);
    if (!oldLoan) return;

    await insforge.database.from('loans').update({ status: LoanStatus.REFINANCED }).eq('id', oldLoanId).eq('lender_id', currentUser.id);
    
    const installments = newLoanData.installments || newLoanData.durationWeeks || 1;
    const paymentFrequency = newLoanData.paymentFrequency || newLoanData.frequency || 'Semanal';

    let ttp = newLoanData.amount;
    if (newLoanData.loanType === 'Amortización' || (newLoanData.loanType as string).startsWith('Amortizado')) {
       ttp = newLoanData.amount + (newLoanData.amount * (newLoanData.interestRate / 100) * installments);
    }
    const instAmtRef = ttp / installments;
    
    const clientObj = clients.find(c => c.id === newLoanData.clientId);
    const clientName = clientObj ? `${clientObj.name} ${clientObj.lastName || ''}`.trim() : (newLoanData.clientName || 'Cliente');

    const { data, error } = await insforge.database.from('loans').insert([{
      lender_id: currentUser.id,
      clientid: newLoanData.clientId,
      clientname: clientName,
      amount: newLoanData.amount,
      interestrate: newLoanData.interestRate,
      installments: installments,
      durationweeks: installments,
      installmentamount: instAmtRef,
      frequency: paymentFrequency,
      startdate: newLoanData.startDate,
      next_payment_date: newLoanData.nextPaymentDate || null,
      status: LoanStatus.ACTIVE,
      remainingbalance: ttp,
      totaltopay: ttp,
      loantype: newLoanData.loanType,
      collateralref: newLoanData.guarantorId || null,
      collateraldescription: `Refinanciamiento del préstamo ${oldLoanId}`
    }]).select().single();

    if (data && !error) {
      setLoans(prev => prev.map(l => l.id === oldLoanId ? { ...l, status: LoanStatus.REFINANCED } : l));
      const newLoan: Loan = {
        id: data.id, clientId: data.clientid || data.client_id, amount: data.amount, interestRate: data.interestrate || data.interest_rate,
        installments: data.installments, durationWeeks: data.durationweeks || data.installments, currentInstallment: 0,
        paymentFrequency: data.frequency || data.payment_frequency, frequency: data.frequency || data.payment_frequency,
        startDate: data.startdate || data.start_date, nextPaymentDate: data.next_payment_date,
        status: data.status, remainingBalance: data.remainingbalance, totalToPay: data.totaltopay,
        loanType: data.loantype, guarantorId: data.collateralref, note: data.collateraldescription || newLoanData.note
      };
      setLoans(prev => [newLoan, ...prev]);
      addAuditLog('loan_refinanced', `Refinanció el préstamo ${oldLoanId}`);
      addToast("Préstamo refinanciado exitosamente", "success");
    } else {
      logger.error("Error al refinanciar préstamo:", error);
      addToast(`Error al refinanciar préstamo: ${error?.message || 'Error desconocido'}`, "error");
    }
  };

  const forgiveDebt = async (loanId: string, amount: number, note: string) => {
    if (!currentUser) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    
    let newBalance = loan.remainingBalance - amount;
    if (newBalance < 0) newBalance = 0;
    const newStatus = newBalance === 0 ? LoanStatus.PAID : loan.status;
    
    const { error } = await insforge.database.from('loans').update({
       remainingbalance: newBalance, status: newStatus
    }).eq('id', loanId).eq('lender_id', currentUser.id);
    
    if (!error) {
      await insforge.database.from('transactions').insert([{
        lender_id: currentUser.id, date: new Date().toISOString().split('T')[0],
        type: 'Perdón de Deuda', amount, description: note, referenceid: loanId
      }]);
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, remainingBalance: newBalance, status: newStatus } : l));
      addAuditLog('loan_forgiven', `Perdonó RD$ ${amount} al préstamo ${loanId}`);
      addToast("Deuda perdonada", "success");
    }
  };

  const registerPayment = async (
    loanId: string, amount: number, note: string, paymentDate?: string, 
    _invoiceDate?: string, paymentType?: 'Interes' | 'Capital' | 'Mixto',
    capitalAmount?: number, paymentMethod: PaymentMethod = 'Efectivo', cashierId?: string
  ) => {
    if (!currentUser) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    let newBalance = loan.remainingBalance;
    let newStatus = loan.status;

    const baseTx = {
      lender_id: currentUser.id, date: paymentDate || new Date().toISOString().split('T')[0],
      type: 'Ingreso', description: note, referenceid: loanId
    };

    let transactionsToInsert: any[] = [];

    if (loan.loanType === 'Rédito') {
      const currentInterestDue = loan.remainingBalance * (loan.interestRate / 100);
      if (paymentType === 'Capital') {
        newBalance -= amount;
        transactionsToInsert.push({ ...baseTx, amount, paymenttype: 'Capital', description: `${note} (Abono Directo a Capital)` });
      } else if (paymentType === 'Mixto' && capitalAmount && capitalAmount > 0) {
        const interestPart = Math.max(0, amount - capitalAmount);
        newBalance -= capitalAmount;
        if (capitalAmount > 0) transactionsToInsert.push({ ...baseTx, amount: capitalAmount, paymenttype: 'Capital', description: `${note} (Abono a Capital)` });
        if (interestPart > 0) transactionsToInsert.push({ ...baseTx, amount: interestPart, paymenttype: 'Interes', description: `${note} (Interés)` });
      } else {
        if (amount > currentInterestDue) {
          const excessCapital = amount - currentInterestDue;
          newBalance -= excessCapital;
          transactionsToInsert.push({ ...baseTx, amount: currentInterestDue, paymenttype: 'Interes', description: `${note} (Pago Rédito/Interés)` });
          transactionsToInsert.push({ ...baseTx, amount: excessCapital, paymenttype: 'Capital', description: `${note} (Abono a Capital por Excedente)` });
        } else {
          transactionsToInsert.push({ ...baseTx, amount, paymenttype: 'Interes', description: `${note} (Pago Rédito/Interés)` });
        }
      }
      if (newBalance <= 0) { newBalance = 0; newStatus = LoanStatus.PAID; }
    } else {
      newBalance -= amount;
      if (newBalance <= 0) { newBalance = 0; newStatus = LoanStatus.PAID; }
      transactionsToInsert.push({ ...baseTx, amount, paymenttype: paymentType || 'Interes' });
    }

    const { error: loanError } = await insforge.database.from('loans').update({ remainingbalance: newBalance, status: newStatus }).eq('id', loanId).eq('lender_id', currentUser.id);
    if (loanError) { addToast("Error al actualizar balance", 'error'); return; }

    const { data: insertedTxs, error: trxError } = await insforge.database.from('transactions').insert(transactionsToInsert).select();
    if (!trxError && insertedTxs) {
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, remainingBalance: newBalance, status: newStatus } : l));
      addAuditLog('payment_registered', `Registró pago de RD$ ${amount} para el préstamo ${loanId}`);
      addToast(newBalance === 0 ? "¡Préstamo Saldado Por Completo!" : "Pago registrado correctamente", 'success');
      
      const client = clients.find(c => c.id === loan.clientId);
      if (client && client.phone) {
        insforge.functions.invoke('whatsapp-notifier', {
          body: {
            phone: client.phone,
            clientName: client.name,
            message: `Hola ${client.name.split(' ')[0]},\n\nHemos recibido un pago de ${amount} por concepto de: ${note}. Su nuevo balance es: ${newBalance}. ¡Gracias por preferirnos!`
          }
        }).catch(err => logger.error("Error enviando WhatsApp:", err));
      }
    } else {
      addToast("Error al guardar transacción", 'error');
    }
    return (insertedTxs || []).map(mapTransaction);
  };

  const addLoanRequest = async (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('loan_requests').insert([{
      lender_id: currentUser.id, client_name: request.clientName, client_phone: request.clientPhone,
      client_email: request.clientEmail, requested_amount: request.requestedAmount || request.amount, requested_term: request.requestedTerm || request.durationWeeks,
      purpose: request.purpose || request.loanDestination, notes: request.notes || request.observations, status: 'Pending'
    }]);
    if (!error) {
       addToast("Solicitud enviada", "success");
    }
  };

  const deleteLoanRequest = async (id: string) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('loan_requests').delete().eq('id', id).eq('lender_id', currentUser.id);
    if (!error) {
      setLoanRequests(prev => prev.filter(r => r.id !== id));
      addToast("Solicitud eliminada", "success");
    }
  };

  const addLoanProduct = async (product: Omit<LoanProduct, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const { data, error } = await insforge.database.from('loan_products').insert([{
        name: product.name, description: product.description, min_amount: product.minAmount,
        max_amount: product.maxAmount, interest_rate: product.interestRate, interest_type: product.interestType,
        frequency: product.frequency, default_installments: product.defaultInstallments,
        requires_collateral: product.requiresCollateral, collateral_type: product.collateralType,
        disbursement_fee: product.disbursementFee, late_fee: product.lateFeePercentage,
        grace_period_days: product.graceDays, allow_early_payoff: product.prepaymentAllowed,
        auto_calculate_interest: product.autoCalculateInterest, is_active: product.isActive,
        amortization_method: product.amortizationMethod, payment_order: product.paymentOrder,
        recalculate_interest_on_early_payoff: product.recalculateInterestOnEarlyPayoff,
        capitalization_frequency: product.capitalizationFrequency, lender_id: currentUser.id
    }]).select().single();
    if (data && !error) {
        setLoanProducts(prev => [{...product, id: data.id, createdAt: data.created_at} as LoanProduct, ...prev]);
        addToast("Producto creado exitosamente", "success");
    } else {
        addToast("Error al crear producto", "error");
    }
  };

  const updateLoanProduct = async (id: string, updates: Partial<LoanProduct>) => {
    if (!currentUser) return;
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.minAmount !== undefined) payload.min_amount = updates.minAmount;
    if (updates.maxAmount !== undefined) payload.max_amount = updates.maxAmount;
    if (updates.interestRate !== undefined) payload.interest_rate = updates.interestRate;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    const { error } = await insforge.database.from('loan_products').update(payload).eq('id', id).eq('lender_id', currentUser.id);
    if (!error) {
        setLoanProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        addToast("Producto actualizado", "success");
    }
  };

  const deleteLoanProduct = async (id: string) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('loan_products').delete().eq('id', id).eq('lender_id', currentUser.id);
    if (!error) {
        setLoanProducts(prev => prev.filter(p => p.id !== id));
        addToast("Producto eliminado", "success");
    }
  };

  return (
    <LoanContext.Provider value={{
      loans, loanProducts, loanRequests,
      createLoan, refinanceLoan, forgiveDebt, registerPayment, addLoanRequest, deleteLoanRequest,
      addLoanProduct, updateLoanProduct, deleteLoanProduct
    }}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoans = () => {
  const context = useContext(LoanContext);
  if (!context) throw new Error('useLoans must be used within a LoanProvider');
  return context;
};
