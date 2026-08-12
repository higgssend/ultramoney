import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Loan, LoanProduct, LoanRequest, LoanStatus, LoanType, PaymentMethod, Transaction, formatReceiptId } from '../../types';
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
  
  createLoan: (loanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => Promise<Loan | null>;
  updateLoan: (loan: Loan) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  addHistoricalPayment: (
    loanId: string,
    paymentData: {
      amount: number;
      date: string;
      reference?: string;
      notes?: string;
      paymentMethod?: PaymentMethod;
      paymentType?: 'Interes' | 'Capital' | 'Mixto';
    }
  ) => Promise<Transaction | null>;
  refinanceLoan: (oldLoanId: string, newLoanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => void;
  forgiveDebt: (loanId: string, amount: number, note: string) => Promise<void>;
  registerPayment: (
    loanId: string, amount: number, note: string, paymentDate?: string, 
    invoiceDate?: string, paymentType?: 'Interes' | 'Capital' | 'Mixto',
    capitalAmount?: number, paymentMethod?: PaymentMethod, cashierId?: string,
    bankAccountId?: string, proofUrl?: string
  ) => Promise<Transaction[] | null>;
  addLoanRequest: (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => void;
  deleteLoanRequest: (requestId: string) => void;
  addLoanProduct: (product: Omit<LoanProduct, 'id' | 'createdAt'>) => Promise<void>;
  updateLoanProduct: (id: string, updates: Partial<LoanProduct>) => Promise<void>;
  deleteLoanProduct: (id: string) => Promise<void>;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

const mapTransaction = (t: TransactionDB): Transaction => ({
  id: t.id,
  type: (t.type || 'Ingreso') as 'Ingreso' | 'Gasto',
  category: (t.category || (t.referenceid ? 'Pago Préstamo' : 'Otro')) as Transaction['category'],
  amount: Number(t.amount) || 0,
  date: t.date,
  description: t.description,
  referenceId: t.referenceid || t.reference_id || undefined,
  paymentType: (t.paymenttype || t.payment_type || undefined) as Transaction['paymentType'],
  paymentMethod: (t.paymentmethod || t.payment_method || 'Efectivo') as Transaction['paymentMethod'],
  invoiceDate: t.invoicedate || t.invoice_date || undefined,
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
            collateral: l.collateral as any,
            itemPrice: l.item_price ? Number(l.item_price) : undefined,
            downPayment: l.down_payment ? Number(l.down_payment) : undefined,
            downPaymentMode: l.down_payment_mode as any,
            financedAmount: l.financed_amount ? Number(l.financed_amount) : undefined,
            guarantorId: l.guarantor_id || l.collateralref,
            note: l.note,
            currency: (l.currency as 'DOP' | 'USD') || 'DOP',
          })));
        }
        if (productsRes.data) {
          setLoanProducts((productsRes.data as LoanProductDB[]).map((p) => ({
            id: p.id,
            name: p.name,
            minAmount: p.min_amount,
            maxAmount: p.max_amount,
            interestRate: p.interest_rate,
            interestType: p.interest_type as LoanProduct['interestType'],
            frequency: p.frequency as LoanProduct['frequency'],
            defaultInstallments: p.default_installments,
            requiresCollateral: p.requires_collateral,
            collateralType: p.collateral_type,
            lateFeePercentage: p.late_fee_percentage,
            disbursementFee: p.disbursement_fee,
            graceDays: p.grace_days,
            prepaymentAllowed: p.prepayment_allowed,
          })));
        }
        if (requestsRes.data) {
          setLoanRequests((requestsRes.data as LoanRequestDB[]).map((r) => ({
            id: r.id,
            clientName: r.client_name || 'Cliente',
            clientPhone: r.client_phone,
            clientEmail: r.client_email,
            requestedAmount: r.requested_amount || r.amount,
            amount: r.amount || r.requested_amount,
            interestRate: r.interest_rate,
            durationWeeks: r.duration_weeks,
            frequency: r.frequency as LoanRequest['frequency'],
            requestDate: r.created_at || r.request_date,
            status: r.status as LoanRequest['status'],
            loanDestination: r.loan_destination || r.purpose,
            purpose: r.purpose || r.loan_destination,
            notes: r.notes || r.observations,
            observations: r.observations || r.notes,
            collateral: r.collateral as any,
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
    
    const isRedito = Boolean(loanData.loanType && (
      loanData.loanType.includes('Rédito') || 
      loanData.loanType.includes('Redito') || 
      loanData.loanType.includes('Solo Interé') || 
      loanData.loanType.includes('Pagaré Abierto')
    ));

    let ttp = loanData.amount;
    let instAmt = 0;

    if (isRedito) {
      ttp = loanData.amount; // Capital balance
      instAmt = Math.round(loanData.amount * (loanData.interestRate / 100) * 100) / 100; // Periodic interest
    } else {
      ttp = Math.round((loanData.amount + (loanData.amount * (loanData.interestRate / 100))) * 100) / 100;
      instAmt = Math.round((ttp / (installments > 0 ? installments : 1)) * 100) / 100;
    }

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
      collateral: loanData.collateral || null,
      item_price: loanData.itemPrice || null,
      down_payment: loanData.downPayment || 0,
      down_payment_mode: loanData.downPaymentMode || 'Efectivo',
      financed_amount: loanData.financedAmount || loanData.amount,
      collateralref: loanData.guarantorId || null,
      note: loanData.note || null,
      currency: loanData.currency || 'DOP'
    }]).select().single();

    if (data && !error) {
      // Record transaction if Down Payment was paid
      if (loanData.downPayment && loanData.downPayment > 0) {
        try {
          await insforge.database.from('transactions').insert([{
            lender_id: currentUser.id,
            type: 'Ingreso',
            category: 'Inicial de Financiamiento',
            amount: loanData.downPayment,
            date: loanData.startDate || new Date().toISOString().split('T')[0],
            description: `Pago Inicial (${loanData.downPaymentMode || 'Efectivo'}) para Financiamiento #${data.id} - ${clientName}`,
            payment_method: loanData.downPaymentMode || 'Efectivo',
            reference_id: data.id
          }]);
        } catch (e) {
          logger.error("Error creating down payment transaction:", e);
        }
      }

      const newLoan: Loan = {
        id: data.id, clientId: data.clientid || data.client_id, clientName: data.clientname || data.client_name || clientName,
        amount: data.amount, interestRate: data.interestrate || data.interest_rate,
        installments: data.installments, durationWeeks: data.durationweeks || data.installments, currentInstallment: 0,
        paymentFrequency: data.frequency || data.payment_frequency, frequency: data.frequency || data.payment_frequency,
        startDate: data.startdate || data.start_date, nextPaymentDate: data.next_payment_date,
        status: data.status, remainingBalance: data.remainingbalance, totalToPay: data.totaltopay,
        loanType: data.loantype, collateral: data.collateral || loanData.collateral,
        itemPrice: data.item_price || loanData.itemPrice,
        downPayment: data.down_payment || loanData.downPayment,
        downPaymentMode: data.down_payment_mode || loanData.downPaymentMode,
        financedAmount: data.financed_amount || loanData.financedAmount,
        guarantorId: data.collateralref, note: data.note || loanData.note,
        currency: data.currency || loanData.currency || 'DOP'
      };
      setLoans(prev => [newLoan, ...prev]);
      addAuditLog('loan_created', `Creó un préstamo por RD$ ${loanData.amount}`);
      addToast("Préstamo creado exitosamente", "success");
      return newLoan;
    } else {
      logger.error("Error al crear préstamo:", error);
      addToast(`Error al crear préstamo: ${error?.message || 'Error desconocido'}`, "error");
      return null;
    }
  };

  const updateLoan = async (updatedLoan: Loan) => {
    if (!currentUser) return;
    try {
      const { error } = await insforge.database
        .from('loans')
        .update({
          amount: updatedLoan.amount,
          interestrate: updatedLoan.interestRate,
          installments: updatedLoan.installments || updatedLoan.durationWeeks,
          durationweeks: updatedLoan.durationWeeks || updatedLoan.installments,
          frequency: updatedLoan.paymentFrequency || updatedLoan.frequency,
          startdate: updatedLoan.startDate,
          next_payment_date: updatedLoan.nextPaymentDate || null,
          status: updatedLoan.status,
          remainingbalance: updatedLoan.remainingBalance,
          totaltopay: updatedLoan.totalToPay,
          loantype: updatedLoan.loanType,
          collateral: updatedLoan.collateral || null,
          item_price: updatedLoan.itemPrice || null,
          down_payment: updatedLoan.downPayment || 0,
          down_payment_mode: updatedLoan.downPaymentMode || 'Efectivo',
          financed_amount: updatedLoan.financedAmount || updatedLoan.amount,
          collateralref: updatedLoan.guarantorId || null,
          note: updatedLoan.note || null,
          currency: updatedLoan.currency || 'DOP'
        })
        .eq('id', updatedLoan.id)
        .eq('lender_id', currentUser.id);

      if (!error) {
        setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
        addToast('Préstamo actualizado exitosamente', 'success');
        addAuditLog('loan_updated', `Actualizó el préstamo #${updatedLoan.id}`);
      } else {
        logger.error('Error updating loan:', error);
        addToast(`Error al actualizar préstamo: ${error.message}`, 'error');
      }
    } catch (e: any) {
      logger.error('Error in updateLoan:', e);
    }
  };

  const deleteLoan = async (id: string) => {
    if (!currentUser) return;
    try {
      await insforge.database.from('transactions').delete().eq('reference_id', id).eq('lender_id', currentUser.id);
      const { error } = await insforge.database.from('loans').delete().eq('id', id).eq('lender_id', currentUser.id);

      if (!error) {
        setLoans(prev => prev.filter(l => l.id !== id));
        addToast('Préstamo eliminado correctamente', 'success');
        addAuditLog('loan_deleted', `Eliminó el préstamo #${id}`);
      } else {
        logger.error('Error deleting loan:', error);
        addToast(`Error al eliminar préstamo: ${error.message}`, 'error');
      }
    } catch (e: any) {
      logger.error('Error in deleteLoan:', e);
    }
  };

  const addHistoricalPayment = async (
    loanId: string,
    paymentData: {
      amount: number;
      date: string;
      reference?: string;
      notes?: string;
      paymentMethod?: PaymentMethod;
      paymentType?: 'Interes' | 'Capital' | 'Mixto';
    }
  ): Promise<Transaction | null> => {
    if (!currentUser) return null;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return null;

    try {
      const pType = paymentData.paymentType || 'Mixto';
      const pMethod = paymentData.paymentMethod || 'Efectivo';
      const payDate = paymentData.date || new Date().toISOString().split('T')[0];

      const { data: txData, error: txError } = await insforge.database
        .from('transactions')
        .insert([
          {
            lender_id: currentUser.id,
            type: 'Ingreso',
            category: 'Pago Préstamo',
            amount: paymentData.amount,
            date: payDate,
            description: `Pago Histórico / Manual - Préstamo #${loan.id} (${paymentData.notes || paymentData.reference || 'Sin nota'})`,
            payment_method: pMethod,
            paymenttype: pType,
            reference_id: loan.id,
            currency: loan.currency || 'DOP'
          },
        ])
        .select()
        .single();

      if (txData && !txError) {
        let newBalance = loan.remainingBalance;
        // Deduct from balance if payment is Capital or Mixto (or if loan balance needs deduction)
        if (pType === 'Capital' || pType === 'Mixto') {
          newBalance = Math.max(0, loan.remainingBalance - paymentData.amount);
        }

        const newStatus = newBalance === 0 ? LoanStatus.PAID : loan.status;

        await insforge.database
          .from('loans')
          .update({
            remainingbalance: newBalance,
            status: newStatus,
          })
          .eq('id', loan.id)
          .eq('lender_id', currentUser.id);

        setLoans(prev =>
          prev.map(l =>
            l.id === loan.id ? { ...l, remainingBalance: newBalance, status: newStatus } : l
          )
        );

        addToast(`Pago histórico de RD$ ${paymentData.amount.toLocaleString()} registrado con éxito. Recibo: ${formatReceiptId(txData.id)}`, 'success');
        addAuditLog('historical_payment_added', `Añadió pago histórico de RD$ ${paymentData.amount} al préstamo #${loan.id}`);

        return mapTransaction(txData as any);
      }
    } catch (e: any) {
      logger.error('Error adding historical payment:', e);
      addToast('Error al registrar pago histórico', 'error');
    }
    return null;
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
        id: data.id, clientId: data.clientid || data.client_id, clientName: data.clientname || data.client_name || clientName,
        amount: data.amount, interestRate: data.interestrate || data.interest_rate,
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
        type: 'Gasto', amount, description: `Condonación de deuda: ${note}`, referenceid: loanId
      }]);
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, remainingBalance: newBalance, status: newStatus } : l));
      addAuditLog('loan_forgiven', `Perdonó RD$ ${amount} al préstamo ${loanId}`);
      addToast("Deuda perdonada", "success");
    }
  };
  const registerPayment = async (
    loanId: string, amount: number, note: string, paymentDate?: string, 
    _invoiceDate?: string, paymentType?: 'Interes' | 'Capital' | 'Mixto',
    capitalAmount?: number, paymentMethod: PaymentMethod = 'Efectivo', cashierId?: string,
    bankAccountId?: string, proofUrl?: string
  ) => {
    if (!currentUser) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    let newBalance = loan.remainingBalance;
    let newStatus = loan.status;

    const nowISO = new Date().toISOString();
    const nowTimeStr = nowISO.split('T')[1];
    const txDate = paymentDate ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T${nowTimeStr}`) : nowISO;

    const baseTx = {
      lender_id: currentUser.id, 
      date: txDate,
      type: 'Ingreso', 
      description: note, 
      referenceid: loanId,
      payment_method: paymentMethod,
      bank_account_id: bankAccountId || null,
      proof_url: proofUrl || null
    };

    let transactionsToInsert: any[] = [];

    const isRedito = (type?: string) => type ? (type.includes('Rédito') || type.includes('Redito') || type.includes('Solo Interé') || type.includes('Pagaré Abierto')) : false;

    let newNextDate = loan.nextPaymentDate;

    if (isRedito(loan.loanType)) {
      const currentInterestDue = Math.round((loan.remainingBalance * (loan.interestRate / 100)) * 100) / 100;

      if (paymentType === 'Capital') {
        newBalance -= amount;
        transactionsToInsert.push({ ...baseTx, amount, paymenttype: 'Capital', description: `${note} (Abono Directo a Capital)` });
      } else if (paymentType === 'Mixto') {
        const capitalPart = (capitalAmount && capitalAmount > 0) ? capitalAmount : 0;
        const interestPart = Math.max(0, amount - capitalPart);
        newBalance -= capitalPart;
        if (capitalPart > 0) transactionsToInsert.push({ ...baseTx, amount: capitalPart, paymenttype: 'Capital', description: `${note} (Abono a Capital)` });
        if (interestPart > 0) transactionsToInsert.push({ ...baseTx, amount: interestPart, paymenttype: 'Interes', description: `${note} (Pago de Interés/Rédito)` });
      } else {
        // Solo Intereses (Rédito): Si el pago supera el interés del periodo, el excedente abona automáticamente al capital!
        if (amount > currentInterestDue && currentInterestDue > 0) {
          const excessCapital = Math.round((amount - currentInterestDue) * 100) / 100;
          newBalance = Math.max(0, loan.remainingBalance - excessCapital);
          transactionsToInsert.push({ 
            ...baseTx, 
            amount: currentInterestDue, 
            paymenttype: 'Interes', 
            description: `${note} (Pago Rédito/Interés)` 
          });
          transactionsToInsert.push({ 
            ...baseTx, 
            amount: excessCapital, 
            paymenttype: 'Capital', 
            description: `${note} (Abono a Capital por Excedente)` 
          });
        } else {
          newBalance = loan.remainingBalance;
          transactionsToInsert.push({ ...baseTx, amount, paymenttype: 'Interes', description: `${note} (Pago de Interés/Rédito)` });
        }
      }

      // Avanzar fecha de próximo pago al pagar intereses
      if (paymentType !== 'Capital' && loan.nextPaymentDate) {
        const currentNext = new Date(loan.nextPaymentDate.includes('T') ? loan.nextPaymentDate : loan.nextPaymentDate + 'T00:00:00');
        if (!isNaN(currentNext.getTime())) {
          if (loan.frequency === 'Mensual') {
            currentNext.setMonth(currentNext.getMonth() + 1);
          } else if (loan.frequency === 'Quincenal') {
            currentNext.setDate(currentNext.getDate() + 15);
          } else if (loan.frequency === 'Diario') {
            currentNext.setDate(currentNext.getDate() + 1);
          } else {
            currentNext.setDate(currentNext.getDate() + 7);
          }
          newNextDate = currentNext.toISOString().split('T')[0];
        }
      }

      if (newBalance <= 0) { newBalance = 0; newStatus = LoanStatus.PAID; }
    } else {
      newBalance -= amount;
      if (newBalance <= 0) { newBalance = 0; newStatus = LoanStatus.PAID; }
      transactionsToInsert.push({ ...baseTx, amount, paymenttype: paymentType || 'Interes' });
    }

    const { error: loanError } = await insforge.database.from('loans').update({
      remainingbalance: newBalance, status: newStatus, next_payment_date: newNextDate
    }).eq('id', loanId).eq('lender_id', currentUser.id);
    if (loanError) { addToast("Error al actualizar balance", 'error'); return; }

    const { data: insertedTxs, error: trxError } = await insforge.database.from('transactions').insert(transactionsToInsert).select();
    if (!trxError && insertedTxs) {
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, remainingBalance: newBalance, status: newStatus, nextPaymentDate: newNextDate } : l));
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
    const reqAmount = Number(request.requestedAmount ?? request.amount) || 0;
    const reqTerm = Number(request.requestedTerm ?? request.durationWeeks) || 1;
    const reqRate = Number(request.interestRate) || 10;
    const reqFreq = request.frequency || 'Semanal';
    const reqType = request.loanType || 'Amortizado (Cuota Fija)';
    const reqPurpose = request.purpose || request.loanDestination || '';
    const reqNotes = request.notes || request.observations || '';

    const { data, error } = await insforge.database.from('loan_requests').insert([{
      lender_id: currentUser.id,
      client_id: request.clientId || null,
      client_name: request.clientName || 'Cliente',
      client_phone: request.clientPhone || null,
      client_email: request.clientEmail || null,
      requested_amount: reqAmount,
      amount: reqAmount,
      requested_term: reqTerm,
      duration_weeks: reqTerm,
      installments: reqTerm,
      interest_rate: reqRate,
      frequency: reqFreq,
      loan_type: reqType,
      closing_cost: request.closingCost || 0,
      closing_cost_mode: request.closingCostMode || 'Descontado',
      payment_day: request.paymentDay || 1,
      purpose: reqPurpose || null,
      loan_destination: reqPurpose || null,
      notes: reqNotes || null,
      observations: reqNotes || null,
      collateral: request.collateral || null,
      item_price: request.itemPrice || null,
      down_payment: request.downPayment || 0,
      down_payment_mode: request.downPaymentMode || 'Efectivo',
      financed_amount: request.financedAmount || reqAmount,
      late_fee_percentage: request.lateFeePercentage || 10,
      grace_days: request.graceDays || 3,
      currency: request.currency || 'DOP',
      status: 'Pending'
    }]).select().single();

    if (data && !error) {
      const newReq: LoanRequest = {
        id: data.id,
        clientId: data.client_id || request.clientId,
        clientName: data.client_name || request.clientName || 'Sin Nombre',
        clientPhone: data.client_phone || request.clientPhone,
        clientEmail: data.client_email || request.clientEmail,
        requestedAmount: reqAmount,
        amount: reqAmount,
        requestedTerm: reqTerm,
        durationWeeks: reqTerm,
        interestRate: reqRate,
        frequency: reqFreq as any,
        loanType: reqType as any,
        closingCost: request.closingCost || 0,
        closingCostMode: (request.closingCostMode || 'Descontado') as any,
        paymentDay: request.paymentDay,
        purpose: reqPurpose,
        loanDestination: reqPurpose,
        notes: reqNotes,
        observations: reqNotes,
        status: 'Pending',
        requestDate: data.created_at || data.request_date || new Date().toISOString(),
      };

      setLoanRequests(prev => [newReq, ...prev]);
      addAuditLog('loan_request_created', `Creó una solicitud de préstamo por RD$ ${reqAmount} para ${newReq.clientName}`);
      addToast("Solicitud guardada con éxito", "success");
    } else if (error) {
      logger.error("Error al crear solicitud de préstamo:", error);
      addToast(`Error al crear solicitud: ${error.message}`, "error");
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
      createLoan, updateLoan, deleteLoan, addHistoricalPayment, refinanceLoan, forgiveDebt, registerPayment, addLoanRequest, deleteLoanRequest,
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
