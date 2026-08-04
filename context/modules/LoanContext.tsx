import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Loan, LoanProduct, LoanRequest, LoanStatus, PaymentMethod } from '../../types';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useClients } from './ClientContext';
import { useSettings } from './SettingsContext';

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
  ) => Promise<any>;
  addLoanRequest: (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => void;
  deleteLoanRequest: (requestId: string) => void;
  addLoanProduct: (product: Omit<LoanProduct, 'id' | 'createdAt'>) => Promise<void>;
  updateLoanProduct: (id: string, updates: Partial<LoanProduct>) => Promise<void>;
  deleteLoanProduct: (id: string) => Promise<void>;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

const mapTransaction = (t: any) => ({
  ...t, referenceId: t.referenceid || t.reference_id || t.referenceId,
  paymentType: t.paymenttype || t.payment_type || t.paymentType,
  paymentMethod: t.paymentmethod || t.payment_method || t.paymentMethod || 'Efectivo',
  invoiceDate: t.invoicedate || t.invoice_date || t.invoiceDate
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
          insforge.database.from('loans').select('*').order('created_at', { ascending: false }),
          insforge.database.from('loan_products').select('*').order('created_at', { ascending: false }),
          insforge.database.from('loan_requests').select('*').order('created_at', { ascending: false })
        ]);

        if (loansRes.data) {
          setLoans(loansRes.data.map((l: any) => ({
            id: l.id, clientId: l.clientid || l.client_id, amount: l.amount, interestRate: l.interestrate || l.interest_rate,
            installments: l.installments, currentInstallment: l.current_installment || 0,
            paymentFrequency: l.frequency || l.payment_frequency, startDate: l.startdate || l.start_date, nextPaymentDate: l.next_payment_date || l.nextpaymentdate,
            status: l.status, remainingBalance: l.remainingbalance, totalToPay: l.totaltopay,
            loanType: l.loantype, guarantorId: l.guarantor_id || l.collateralref, note: l.note
          })));
        }
        if (productsRes.data) {
          setLoanProducts(productsRes.data.map((p: any) => ({
            id: p.id, name: p.name, interestRate: p.interest_rate || p.interestrate,
            paymentFrequency: p.payment_frequency || p.frequency, defaultInstallments: p.default_installments || p.installments,
            isActive: p.is_active !== undefined ? p.is_active : true, requirements: p.requirements || []
          })));
        }
        if (requestsRes.data) {
          setLoanRequests(requestsRes.data.map((r: any) => ({
             id: r.id, clientName: r.client_name, clientPhone: r.client_phone, clientEmail: r.client_email,
             requestedAmount: r.requested_amount, requestedTerm: r.requested_term,
             purpose: r.purpose, status: r.status, requestDate: r.created_at, notes: r.notes
          })));
        }
      } catch (error) {
        console.error("Error fetching loans:", error);
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

    const { data, error } = await insforge.database.from('loans').insert({
      lender_id: currentUser.id, clientid: loanData.clientId, amount: loanData.amount,
      interestrate: loanData.interestRate, installments: installments, durationweeks: installments,
      installmentamount: instAmt,
      frequency: paymentFrequency,
      startdate: loanData.startDate, next_payment_date: loanData.nextPaymentDate,
      status: LoanStatus.ACTIVE, remainingbalance: ttp, totaltopay: ttp, loantype: loanData.loanType,
      collateralref: loanData.guarantorId, collateraldescription: loanData.note
    }).select().single();

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
      addToast("Préstamo creado", "success");
    }
  };

  const refinanceLoan = async (oldLoanId: string, newLoanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => {
    if (!currentUser) return;
    const oldLoan = loans.find(l => l.id === oldLoanId);
    if (!oldLoan) return;

    await insforge.database.from('loans').update({ status: LoanStatus.REFINANCED }).eq('id', oldLoanId);
    
    const installments = newLoanData.installments || newLoanData.durationWeeks || 1;
    const paymentFrequency = newLoanData.paymentFrequency || newLoanData.frequency || 'Semanal';

    let ttp = newLoanData.amount;
    if (newLoanData.loanType === 'Amortización' || (newLoanData.loanType as string).startsWith('Amortizado')) {
       ttp = newLoanData.amount + (newLoanData.amount * (newLoanData.interestRate / 100) * installments);
    }
    const instAmtRef = ttp / installments;
    
    const { data, error } = await insforge.database.from('loans').insert({
      lender_id: currentUser.id, clientid: newLoanData.clientId, amount: newLoanData.amount,
      interestrate: newLoanData.interestRate, installments: installments, durationweeks: installments,
      installmentamount: instAmtRef,
      frequency: paymentFrequency,
      startdate: newLoanData.startDate, next_payment_date: newLoanData.nextPaymentDate,
      status: LoanStatus.ACTIVE, remainingbalance: ttp, totaltopay: ttp, loantype: newLoanData.loanType,
      collateralref: newLoanData.guarantorId, collateraldescription: `Refinanciamiento del préstamo ${oldLoanId}`
    }).select().single();

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
      addToast("Préstamo refinanciado", "success");
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
    }).eq('id', loanId);
    
    if (!error) {
      await insforge.database.from('transactions').insert({
        lender_id: currentUser.id, date: new Date().toISOString().split('T')[0],
        type: 'Perdón de Deuda', amount, description: note, referenceid: loanId
      });
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

    const { error: loanError } = await insforge.database.from('loans').update({ remainingbalance: newBalance, status: newStatus }).eq('id', loanId);
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
        }).catch(err => console.error("Error enviando WhatsApp:", err));
      }
    } else {
      addToast("Error al guardar transacción", 'error');
    }
    return (insertedTxs || []).map(mapTransaction);
  };

  const addLoanRequest = async (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('loan_requests').insert({
      lender_id: currentUser.id, client_name: request.clientName, client_phone: request.clientPhone,
      client_email: request.clientEmail, requested_amount: request.requestedAmount || request.amount, requested_term: request.requestedTerm || request.durationWeeks,
      purpose: request.purpose || request.loanDestination, notes: request.notes || request.observations, status: 'Pending'
    });
    if (!error) {
       addToast("Solicitud enviada", "success");
    }
  };

  const deleteLoanRequest = async (id: string) => {
    const { error } = await insforge.database.from('loan_requests').delete().eq('id', id);
    if (!error) {
      setLoanRequests(prev => prev.filter(r => r.id !== id));
      addToast("Solicitud eliminada", "success");
    }
  };

  const addLoanProduct = async (product: Omit<LoanProduct, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const { data, error } = await insforge.database.from('loan_products').insert({
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
    }).select().single();
    if (data && !error) {
        setLoanProducts(prev => [{...product, id: data.id, createdAt: data.created_at} as LoanProduct, ...prev]);
        addToast("Producto creado exitosamente", "success");
    } else {
        addToast("Error al crear producto", "error");
    }
  };

  const updateLoanProduct = async (id: string, updates: Partial<LoanProduct>) => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.minAmount !== undefined) payload.min_amount = updates.minAmount;
    if (updates.maxAmount !== undefined) payload.max_amount = updates.maxAmount;
    if (updates.interestRate !== undefined) payload.interest_rate = updates.interestRate;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    const { error } = await insforge.database.from('loan_products').update(payload).eq('id', id);
    if (!error) {
        setLoanProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        addToast("Producto actualizado", "success");
    }
  };

  const deleteLoanProduct = async (id: string) => {
    const { error } = await insforge.database.from('loan_products').delete().eq('id', id);
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
