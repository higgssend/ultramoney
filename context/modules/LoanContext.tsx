import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Loan, LoanProduct, LoanRequest, LoanStatus, LoanType, PaymentMethod, Transaction, formatReceiptId } from '../../types';
import type { LoanDB, LoanProductDB, LoanRequestDB, TransactionDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useClients } from './ClientContext';
import { useSettings } from './SettingsContext';
import { logger } from '../../utils/logger';
import { combineDateAndTimeToISO } from '../../utils/dateUtils';
import { calculateLoanNextPaymentDate } from '../../utils/receiptBalanceHelper';

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
      paymentType?: Transaction['paymentType'];
    }
  ) => Promise<Transaction | null>;
  refinanceLoan: (oldLoanId: string, newLoanData: Omit<Loan, 'id' | 'status' | 'remainingBalance' | 'totalToPay'>) => void;
  forgiveDebt: (loanId: string, amount: number, note: string) => Promise<void>;
  registerPayment: (
    loanId: string, amount: number, note: string, paymentDate?: string, 
    invoiceDate?: string, paymentType?: Transaction['paymentType'],
    capitalAmount?: number, paymentMethod?: PaymentMethod, cashierId?: string,
    bankAccountId?: string, proofUrl?: string
  ) => Promise<Transaction[] | null>;
  syncAllLoansNextPaymentDates: () => Promise<void>;
  addLoanRequest: (request: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => void;
  deleteLoanRequest: (requestId: string) => void;
  addLoanProduct: (product: Omit<LoanProduct, 'id' | 'createdAt'>) => Promise<void>;
  updateLoanProduct: (id: string, updates: Partial<LoanProduct>) => Promise<void>;
  deleteLoanProduct: (id: string) => Promise<void>;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

const resolveExactTxDate = (dateStr?: string, createdAtStr?: string): string => {
  if (!dateStr && !createdAtStr) return new Date().toISOString();
  if (dateStr && !dateStr.includes('T00:00:00') && !dateStr.endsWith('T00:00:00.000Z') && dateStr.includes('T')) {
    return dateStr;
  }
  if (createdAtStr) return createdAtStr;
  return dateStr || new Date().toISOString();
};

const mapTransaction = (t: TransactionDB): Transaction => {
  const resolvedDate = resolveExactTxDate(t.date, t.created_at);
  return {
    id: t.id,
    type: (t.type || 'Ingreso') as 'Ingreso' | 'Gasto',
    category: (t.category || (t.referenceid ? 'Pago Préstamo' : 'Otro')) as Transaction['category'],
    amount: Number(t.amount) || 0,
    date: resolvedDate,
    createdAt: t.created_at || resolvedDate,
    created_at: t.created_at || resolvedDate,
    description: t.description,
    referenceId: t.referenceid || t.reference_id || undefined,
    paymentType: (t.paymenttype || t.payment_type || undefined) as Transaction['paymentType'],
    paymentMethod: (t.paymentmethod || t.payment_method || 'Efectivo') as Transaction['paymentMethod'],
    invoiceDate: t.invoicedate || t.invoice_date || undefined,
    bankAccountId: t.bank_account_id || undefined,
    proofUrl: t.proof_url || undefined,
    previousBalance: t.previous_balance !== undefined ? Number(t.previous_balance) : (t.previousbalance !== undefined ? Number(t.previousbalance) : undefined),
    newBalance: t.new_balance !== undefined ? Number(t.new_balance) : (t.newbalance !== undefined ? Number(t.newbalance) : undefined),
    totalDebt: t.total_debt !== undefined ? Number(t.total_debt) : (t.totaldebt !== undefined ? Number(t.totaldebt) : undefined),
    capitalAmount: t.capital_amount !== undefined ? Number(t.capital_amount) : (t.capitalamount !== undefined ? Number(t.capitalamount) : undefined),
    interestAmount: t.interest_amount !== undefined ? Number(t.interest_amount) : (t.interestamount !== undefined ? Number(t.interestamount) : undefined),
    lateFeeAmount: t.late_fee_amount !== undefined ? Number(t.late_fee_amount) : (t.latefeeamount !== undefined ? Number(t.latefeeamount) : undefined),
    discountAmount: t.discount_amount !== undefined ? Number(t.discount_amount) : (t.discountamount !== undefined ? Number(t.discountamount) : undefined),
  };
};

export const LoanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const { clients } = useClients();
  const { addAuditLog, addNotification } = useSettings();
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);

  // Auto-sync loan clientName in real-time when clients array is updated
  useEffect(() => {
    if (clients.length > 0 && loans.length > 0) {
      setLoans(prevLoans => {
        let changed = false;
        const updated = prevLoans.map(loan => {
          const matchingClient = clients.find(c => 
            c.id === loan.clientId || 
            (loan.clientId && c.cedula && c.cedula.replace(/[^0-9]/g, '') === loan.clientId.replace(/[^0-9]/g, ''))
          );
          if (matchingClient) {
            const freshName = `${matchingClient.name} ${matchingClient.lastName || ''}`.trim();
            if (freshName && freshName !== loan.clientName) {
              changed = true;
              return { ...loan, clientName: freshName };
            }
          }
          return loan;
        });
        return changed ? updated : prevLoans;
      });
    }
  }, [clients]);

  useEffect(() => {
    if (!currentUser) {
      setLoans([]); setLoanProducts([]); setLoanRequests([]);
      return;
    }

    const fetchLoans = async () => {
      try {
        const [loansRes, productsRes, requestsRes, clientsRes] = await Promise.all([
          insforge.database.from('loans').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('loan_products').select('*').order('created_at', { ascending: false }),
          insforge.database.from('loan_requests').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('clients').select('id, name, lastname, last_name').eq('lender_id', currentUser.id)
        ]);

        const clientMap = new Map<string, string>();
        if (clientsRes.data) {
          type ClientRow = { id: string; name: string; lastname: string | null; last_name: string | null };
          (clientsRes.data as ClientRow[]).forEach((c) => {
            const full = `${c.name} ${c.lastname ?? c.last_name ?? ''}`.trim();
            if (c.id && full) clientMap.set(c.id, full);
          });
        }

        if (loansRes.data) {
          setLoans((loansRes.data as LoanDB[]).map((l) => {
            const cId = l.clientid || l.client_id || '';
            const freshName = clientMap.get(cId) || l.clientname || l.client_name || 'Sin Nombre';

            // Self-heal stale client names stored in loans table
            const dbName = l.clientname || l.client_name;
            if (cId && freshName && freshName !== dbName && freshName !== 'Sin Nombre') {
              void (async () => {
                await insforge.database.from('loans').update({
                  clientname: freshName,
                  client_name: freshName
                }).eq('id', l.id);
              })();
            }

            return {
              id: l.id,
              clientId: cId,
              clientName: freshName,
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
            collateral: l.collateral as unknown as Loan['collateral'],
            guarantors: (Array.isArray(l.guarantors) 
              ? (l.guarantors as Loan['guarantors']) 
              : (l.collateral && typeof l.collateral === 'object' && Array.isArray((l.collateral as Record<string, unknown>).guarantors))
                ? ((l.collateral as Record<string, unknown>).guarantors as Loan['guarantors'])
                : undefined),
            itemPrice: l.item_price ? Number(l.item_price) : undefined,
            cashPrice: l.cash_price ? Number(l.cash_price) : undefined,
            financedPrice: l.financed_price ? Number(l.financed_price) : undefined,
            financingInterestAmount: l.financing_interest_amount ? Number(l.financing_interest_amount) : undefined,
            financingMarginPercent: l.financing_margin_percent ? Number(l.financing_margin_percent) : undefined,
            financingCalcMode: l.financing_calc_mode as Loan['financingCalcMode'],
            downPayment: l.down_payment ? Number(l.down_payment) : undefined,
            downPaymentMode: l.down_payment_mode as Loan['downPaymentMode'],
            financedAmount: l.financed_amount ? Number(l.financed_amount) : undefined,
            guarantorId: l.guarantor_id || l.collateralref,
            note: l.note,
            currency: (l.currency as 'DOP' | 'USD') || 'DOP',
            isInLegalCollection: Boolean(l.is_in_legal_collection),
            legalCaseId: l.legal_case_id,
            legalFeesAdded: Number(l.legal_fees_added) || 0,
          };
        }));
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
            requestDate: r.created_at || r.request_date || '',
            status: r.status as LoanRequest['status'],
            loanDestination: r.loan_destination || r.purpose,
            purpose: r.purpose || r.loan_destination,
            notes: r.notes || r.observations,
            observations: r.observations || r.notes,
            collateral: r.collateral as unknown as LoanRequest['collateral'],
            itemPrice: r.item_price ? Number(r.item_price) : undefined,
            cashPrice: r.cash_price ? Number(r.cash_price) : undefined,
            financedPrice: r.financed_price ? Number(r.financed_price) : undefined,
            financingInterestAmount: r.financing_interest_amount ? Number(r.financing_interest_amount) : undefined,
            financingMarginPercent: r.financing_margin_percent ? Number(r.financing_margin_percent) : undefined,
            financingCalcMode: r.financing_calc_mode as LoanRequest['financingCalcMode'],
            downPayment: r.down_payment ? Number(r.down_payment) : undefined,
            financedAmount: r.financed_amount ? Number(r.financed_amount) : undefined,
            downPaymentMode: r.down_payment_mode as LoanRequest['downPaymentMode'],
            merchantId: r.merchant_id,
            merchantName: r.merchant_name,
            productDescription: r.product_description,
            merchantInvoiceNumber: r.merchant_invoice_number,
            merchantPayoutStatus: (r.merchant_payout_status || 'Pendiente') as LoanRequest['merchantPayoutStatus'],
            merchantPayoutDate: r.merchant_payout_date,
            buyerCedula: r.buyer_cedula,
            buyerIdPhotoFront: r.buyer_id_photo_front,
            buyerIdPhotoBack: r.buyer_id_photo_back,
            productInvoicePhoto: r.product_invoice_photo,
          })));
        }

        // Auto self-heal next payment dates for any loans with advance payments
        void (async () => {
          try {
            const { data: allTxsData } = await insforge.database
              .from('transactions')
              .select('*')
              .eq('lender_id', currentUser.id)
              .eq('type', 'Ingreso');

            if (allTxsData && allTxsData.length > 0 && loansRes.data) {
              const allMapped = (allTxsData as TransactionDB[]).map(mapTransaction);
              for (const l of loansRes.data as LoanDB[]) {
                const txs = allMapped.filter(t => t.referenceId === l.id || t.reference_id === l.id);
                if (txs.length > 0) {
                  const loanObj: Partial<Loan> = {
                    id: l.id,
                    amount: Number(l.amount) || 0,
                    interestRate: Number(l.interestrate ?? l.interest_rate) || 0,
                    installments: l.installments,
                    frequency: ((l.frequency || l.payment_frequency || 'Mensual') as Loan['frequency']),
                    paymentFrequency: ((l.frequency || l.payment_frequency || 'Mensual') as Loan['frequency']),
                    startDate: l.startdate || l.start_date || '',
                    nextPaymentDate: l.next_payment_date || l.nextpaymentdate || '',
                    status: l.status as LoanStatus,
                    loanType: (l.loantype || l.loan_type || 'Amortización') as LoanType,
                    remainingBalance: Number(l.remainingbalance ?? l.remaining_balance) || 0,
                    totalToPay: Number(l.totaltopay ?? l.total_to_pay) || 0,
                    durationWeeks: l.duration_weeks || l.durationweeks,
                  };
                  const { nextPaymentDate: calculatedNext, fullyPaid } = calculateLoanNextPaymentDate(loanObj as Loan, txs);
                  const targetNext = (Number(l.remainingbalance ?? l.remaining_balance) <= 0 || fullyPaid) ? null : (calculatedNext || null);
                  const currentDbNext = l.next_payment_date || l.nextpaymentdate || null;
                  if (targetNext && targetNext !== currentDbNext) {
                    await insforge.database
                      .from('loans')
                      .update({ next_payment_date: targetNext })
                      .eq('id', l.id)
                      .eq('lender_id', currentUser.id);

                    setLoans(prev => prev.map(item => item.id === l.id ? { ...item, nextPaymentDate: targetNext } : item));
                  }
                }
              }
            }
          } catch (err) {
            logger.error('Error auto-syncing next payment dates:', err);
          }
        })();
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
      collateral: loanData.collateral 
        ? { ...loanData.collateral, guarantors: loanData.guarantors || [] }
        : loanData.guarantors && loanData.guarantors.length > 0 
          ? { type: 'Sin Garantía', description: 'Garante Solidario', refNumber: '', guarantors: loanData.guarantors }
          : null,
      item_price: loanData.itemPrice || null,
      cash_price: loanData.cashPrice || null,
      financed_price: loanData.financedPrice || null,
      financing_interest_amount: loanData.financingInterestAmount || null,
      financing_margin_percent: loanData.financingMarginPercent || null,
      financing_calc_mode: loanData.financingCalcMode || 'financed_price',
      down_payment: loanData.downPayment || 0,
      down_payment_mode: loanData.downPaymentMode || 'Efectivo',
      financed_amount: loanData.financedAmount || loanData.amount,
      collateralref: loanData.guarantorId || loanData.guarantors?.[0]?.cedula || null,
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

      // Automatically register initial contract in client_documents
      try {
        const contractUrl = `${window.location.origin}/documento/contrato/${data.id}`;
        await insforge.database.from('client_documents').insert([{
          lender_id: currentUser.id,
          client_id: loanData.clientId,
          title: `Contrato de Préstamo Inicial #${data.id.slice(0, 8)}`,
          name: `Contrato de Préstamo Inicial #${data.id.slice(0, 8)}`,
          type: 'Contrato',
          file_url: contractUrl,
          url: contractUrl,
          file_type: 'application/pdf',
          upload_date: loanData.startDate || new Date().toISOString().split('T')[0]
        }]);

        // Register collateral if present
        if (loanData.collateral && loanData.collateral.type && loanData.collateral.type !== 'Sin Garantía') {
          const colTitle = `Garantía (${loanData.collateral.type}): ${loanData.collateral.description || ''} ${loanData.collateral.refNumber ? `[${loanData.collateral.refNumber}]` : ''}`.trim();
          const colUrl = `${window.location.origin}/prestamos/${data.id}?tab=collateral`;
          const colDocType = loanData.collateral.type === 'Vehículo' ? 'Matricula' : loanData.collateral.type === 'Propiedad' ? 'Titulo' : 'Garantia';
          await insforge.database.from('client_documents').insert([{
            lender_id: currentUser.id,
            client_id: loanData.clientId,
            title: colTitle,
            name: colTitle,
            type: colDocType,
            file_url: colUrl,
            url: colUrl,
            file_type: 'application/pdf',
            upload_date: loanData.startDate || new Date().toISOString().split('T')[0]
          }]);
        }
      } catch (e) {
        logger.error("Error saving contract or collateral to client_documents:", e);
      }

      const newLoan: Loan = {
        id: data.id, clientId: data.clientid || data.client_id, clientName: data.clientname || data.client_name || clientName,
        amount: data.amount, interestRate: data.interestrate || data.interest_rate,
        installments: data.installments, durationWeeks: data.durationweeks || data.installments, currentInstallment: 0,
        paymentFrequency: data.frequency || data.payment_frequency, frequency: data.frequency || data.payment_frequency,
        startDate: data.startdate || data.start_date, nextPaymentDate: data.next_payment_date,
        status: data.status, remainingBalance: data.remainingbalance, totalToPay: data.totaltopay,
        loanType: data.loantype, collateral: data.collateral || loanData.collateral,
        guarantors: loanData.guarantors,
        guarantor: loanData.guarantor,
        itemPrice: data.item_price || loanData.itemPrice,
        downPayment: data.down_payment || loanData.downPayment,
        downPaymentMode: data.down_payment_mode || loanData.downPaymentMode,
        financedAmount: data.financed_amount || loanData.financedAmount,
        guarantorId: data.collateralref || loanData.guarantorId, note: data.note || loanData.note,
        currency: data.currency || loanData.currency || 'DOP'
      };
      setLoans(prev => [newLoan, ...prev]);
      addAuditLog('loan_created', `Creó un préstamo por RD$ ${loanData.amount}`);
      addNotification({
        title: 'Nuevo Préstamo Desembolsado',
        message: `Préstamo #${data.id.slice(0, 8)} de RD$ ${loanData.amount.toLocaleString()} desembolsado para ${clientName}.`,
        type: 'success',
        link: `/prestamos/${data.id}`
      });
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
          collateral: updatedLoan.collateral 
            ? { ...updatedLoan.collateral, guarantors: updatedLoan.guarantors || [] }
            : updatedLoan.guarantors && updatedLoan.guarantors.length > 0
              ? { type: 'Sin Garantía', description: 'Garante Solidario', refNumber: '', guarantors: updatedLoan.guarantors }
              : null,
          item_price: updatedLoan.itemPrice || null,
          down_payment: updatedLoan.downPayment || 0,
          down_payment_mode: updatedLoan.downPaymentMode || 'Efectivo',
          financed_amount: updatedLoan.financedAmount || updatedLoan.amount,
          collateralref: updatedLoan.guarantorId || updatedLoan.guarantors?.[0]?.cedula || null,
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
    } catch (e: unknown) {
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
    } catch (e: unknown) {
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
      paymentType?: Transaction['paymentType'];
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
        const isRedito = (type?: string) => type ? (type.includes('Rédito') || type.includes('Redito') || type.includes('Solo Interé') || type.includes('Pagaré Abierto')) : false;

        let newBalance = loan.remainingBalance;
        if (isRedito(loan.loanType)) {
          if (pType === 'Capital' || pType === 'Mixto') {
            newBalance = Math.max(0, loan.remainingBalance - paymentData.amount);
          }
        } else {
          newBalance = Math.max(0, loan.remainingBalance - paymentData.amount);
        }

        const newStatus = newBalance === 0 ? LoanStatus.PAID : loan.status;

        // Fetch all transactions including this historical one to calculate exact nextPaymentDate
        const { data: histTxsRes } = await insforge.database
          .from('transactions')
          .select('*')
          .eq('lender_id', currentUser.id)
          .eq('type', 'Ingreso')
          .or(`referenceid.eq.${loan.id},reference_id.eq.${loan.id}`);

        const allHistLoanTxs = (histTxsRes || []).map(mapTransaction);
        const { nextPaymentDate: calculatedNextDate, fullyPaid } = calculateLoanNextPaymentDate(loan, allHistLoanTxs);
        const finalHistNextDate = (newBalance <= 0 || fullyPaid) ? null : (calculatedNextDate || null);

        await insforge.database
          .from('loans')
          .update({
            remainingbalance: newBalance,
            status: newStatus,
            next_payment_date: finalHistNextDate
          })
          .eq('id', loan.id)
          .eq('lender_id', currentUser.id);

        setLoans(prev =>
          prev.map(l =>
            l.id === loan.id ? { ...l, remainingBalance: newBalance, status: newStatus, nextPaymentDate: finalHistNextDate || undefined } : l
          )
        );

        addToast(`Pago histórico de RD$ ${paymentData.amount.toLocaleString()} registrado con éxito. Recibo: ${formatReceiptId(txData.id)}`, 'success');
        addAuditLog('historical_payment_added', `Añadió pago histórico de RD$ ${paymentData.amount} al préstamo #${loan.id}`);

        return mapTransaction(txData as TransactionDB);
      }
    } catch (e: unknown) {
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
      client_id: newLoanData.clientId,
      client_name: clientName,
      amount: newLoanData.amount,
      interest_rate: newLoanData.interestRate,
      installments,
      duration_weeks: installments,
      current_installment: 0,
      frequency: paymentFrequency,
      payment_frequency: paymentFrequency,
      start_date: newLoanData.startDate,
      next_payment_date: newLoanData.nextPaymentDate,
      status: LoanStatus.ACTIVE,
      remaining_balance: ttp,
      total_to_pay: ttp,
      installment_amount: instAmtRef,
      loan_type: newLoanData.loanType,
      collateral_ref: newLoanData.guarantorId,
      collateral_description: newLoanData.note
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
    _invoiceDate?: string, paymentType?: Transaction['paymentType'],
    capitalAmount?: number, paymentMethod: PaymentMethod = 'Efectivo', cashierId?: string,
    bankAccountId?: string, proofUrl?: string
  ) => {
    if (!currentUser) return;
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    let newBalance = loan.remainingBalance;
    let newStatus = loan.status;

    const txDate = paymentDate ? (paymentDate.includes('T') ? paymentDate : combineDateAndTimeToISO(paymentDate)) : new Date().toISOString();

    const initialPrevBalance = Number(loan.remainingBalance) || 0;
    const initialTotalDebt = Number(loan.totalToPay || loan.amount) || 0;

    const baseTx = {
      lender_id: currentUser.id, 
      date: txDate,
      type: 'Ingreso' as const, 
      description: note, 
      referenceid: loanId,
      reference_id: loanId,
      payment_method: paymentMethod,
      bank_account_id: bankAccountId || null,
      proof_url: proofUrl || null,
      previous_balance: initialPrevBalance,
      total_debt: initialTotalDebt
    };

    let transactionsToInsert: Partial<TransactionDB>[] = [];

    const isRedito = (type?: string) => type ? (type.includes('Rédito') || type.includes('Redito') || type.includes('Solo Interé') || type.includes('Pagaré Abierto')) : false;

    if (isRedito(loan.loanType)) {
      const currentInterestDue = Math.round((loan.remainingBalance * (loan.interestRate / 100)) * 100) / 100;

      if (paymentType === 'Capital') {
        newBalance = Math.max(0, newBalance - amount);
        transactionsToInsert.push({ 
          ...baseTx, 
          amount, 
          paymenttype: 'Capital', 
          description: `${note} (Abono Directo a Capital)`,
          capital_amount: amount,
          interest_amount: 0,
          previous_balance: initialPrevBalance,
          new_balance: newBalance
        });
      } else if (paymentType === 'Mixto') {
        const capitalPart = (capitalAmount && capitalAmount > 0) ? capitalAmount : 0;
        const interestPart = Math.max(0, amount - capitalPart);
        newBalance = Math.max(0, newBalance - capitalPart);
        if (capitalPart > 0) {
          transactionsToInsert.push({ 
            ...baseTx, 
            amount: capitalPart, 
            paymenttype: 'Capital', 
            description: `${note} (Abono a Capital)`,
            capital_amount: capitalPart,
            interest_amount: 0,
            previous_balance: initialPrevBalance,
            new_balance: newBalance
          });
        }
        if (interestPart > 0) {
          transactionsToInsert.push({ 
            ...baseTx, 
            amount: interestPart, 
            paymenttype: 'Interes', 
            description: `${note} (Pago de Interés/Rédito)`,
            capital_amount: 0,
            interest_amount: interestPart,
            previous_balance: initialPrevBalance,
            new_balance: newBalance
          });
        }
      } else {
        // Solo Intereses (Rédito): Si el pago supera el interés del periodo, el excedente abona automáticamente al capital
        if (amount > currentInterestDue && currentInterestDue > 0) {
          const excessCapital = Math.round((amount - currentInterestDue) * 100) / 100;
          newBalance = Math.max(0, loan.remainingBalance - excessCapital);
          transactionsToInsert.push({ 
            ...baseTx, 
            amount: currentInterestDue, 
            paymenttype: 'Interes', 
            description: `${note} (Pago Rédito/Interés)`,
            capital_amount: 0,
            interest_amount: currentInterestDue,
            previous_balance: initialPrevBalance,
            new_balance: newBalance
          });
          transactionsToInsert.push({ 
            ...baseTx, 
            amount: excessCapital, 
            paymenttype: 'Capital', 
            description: `${note} (Abono a Capital por Excedente)`,
            capital_amount: excessCapital,
            interest_amount: 0,
            previous_balance: initialPrevBalance,
            new_balance: newBalance
          });
        } else {
          newBalance = loan.remainingBalance;
          transactionsToInsert.push({ 
            ...baseTx, 
            amount, 
            paymenttype: 'Interes', 
            description: `${note} (Pago de Interés/Rédito)`,
            capital_amount: 0,
            interest_amount: amount,
            previous_balance: initialPrevBalance,
            new_balance: newBalance
          });
        }
      }

      if (newBalance <= 0) { newBalance = 0; newStatus = LoanStatus.PAID; }
    } else {
      newBalance = Math.max(0, newBalance - amount);
      if (newBalance <= 0) { newBalance = 0; newStatus = LoanStatus.PAID; }
      transactionsToInsert.push({ 
        ...baseTx, 
        amount, 
        paymenttype: paymentType || 'Interes',
        previous_balance: initialPrevBalance,
        new_balance: newBalance,
        total_debt: initialTotalDebt,
        capital_amount: paymentType === 'Capital' ? amount : undefined,
        interest_amount: paymentType !== 'Capital' ? amount : undefined
      });
    }

    const { data: insertedTxs, error: trxError } = await insforge.database.from('transactions').insert(transactionsToInsert).select();
    if (trxError || !insertedTxs) {
      addToast("Error al guardar transacción", 'error');
      return null;
    }

    // Fetch all current transactions to accurately calculate the advanced next payment date
    const { data: allCurrentTxsData } = await insforge.database
      .from('transactions')
      .select('*')
      .eq('lender_id', currentUser.id)
      .eq('type', 'Ingreso')
      .or(`referenceid.eq.${loanId},reference_id.eq.${loanId}`);

    const allLoanTxs = (allCurrentTxsData || []).map(mapTransaction);
    const { nextPaymentDate: calculatedNextDate, fullyPaid } = calculateLoanNextPaymentDate(loan, allLoanTxs);
    const finalNextPaymentDate = (newBalance <= 0 || fullyPaid) ? null : (calculatedNextDate || null);

    const { error: loanError } = await insforge.database.from('loans').update({
      remainingbalance: newBalance,
      status: newStatus,
      next_payment_date: finalNextPaymentDate
    }).eq('id', loanId).eq('lender_id', currentUser.id);

    if (loanError) {
      addToast("Error al actualizar balance del préstamo", 'error');
      return (insertedTxs || []).map(mapTransaction);
    }

    setLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      remainingBalance: newBalance,
      status: newStatus,
      nextPaymentDate: finalNextPaymentDate || undefined
    } : l));

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

    return (insertedTxs || []).map(mapTransaction);
  };

  /**
   * Sincroniza y recalcula automáticamente la próxima fecha de pago de todos los préstamos activos
   * corrigiendo cualquier pago adelantado pasado o desfase en la base de datos.
   */
  const syncAllLoansNextPaymentDates = async () => {
    if (!currentUser) return;
    try {
      const { data: allTxsData } = await insforge.database
        .from('transactions')
        .select('*')
        .eq('lender_id', currentUser.id)
        .eq('type', 'Ingreso');

      const allMappedTxs = (allTxsData || []).map(mapTransaction);

      for (const loan of loans) {
        const loanTxs = allMappedTxs.filter(t => t.referenceId === loan.id || t.reference_id === loan.id);
        const { nextPaymentDate: calculatedNextDate, fullyPaid } = calculateLoanNextPaymentDate(loan, loanTxs);
        const targetNext = (loan.remainingBalance <= 0 || fullyPaid) ? null : (calculatedNextDate || null);

        if (targetNext !== (loan.nextPaymentDate || null)) {
          await insforge.database
            .from('loans')
            .update({ next_payment_date: targetNext })
            .eq('id', loan.id)
            .eq('lender_id', currentUser.id);

          setLoans(prev => prev.map(l => l.id === loan.id ? { ...l, nextPaymentDate: targetNext || undefined } : l));
        }
      }
    } catch (err) {
      logger.error('Error in syncAllLoansNextPaymentDates:', err);
    }
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
      cash_price: request.cashPrice || null,
      financed_price: request.financedPrice || null,
      financing_interest_amount: request.financingInterestAmount || null,
      financing_margin_percent: request.financingMarginPercent || null,
      financing_calc_mode: request.financingCalcMode || 'financed_price',
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
        frequency: reqFreq as LoanRequest['frequency'],
        loanType: reqType as LoanRequest['loanType'],
        closingCost: request.closingCost || 0,
        closingCostMode: (request.closingCostMode || 'Descontado') as LoanRequest['closingCostMode'],
        paymentDay: request.paymentDay,
        itemPrice: request.itemPrice,
        cashPrice: request.cashPrice,
        financedPrice: request.financedPrice,
        financingInterestAmount: request.financingInterestAmount,
        financingMarginPercent: request.financingMarginPercent,
        financingCalcMode: request.financingCalcMode,
        downPayment: request.downPayment,
        downPaymentMode: request.downPaymentMode,
        financedAmount: request.financedAmount,
        purpose: reqPurpose,
        loanDestination: reqPurpose,
        notes: reqNotes,
        observations: reqNotes,
        status: 'Pending',
        requestDate: data.created_at || data.request_date || new Date().toISOString(),
      };

      setLoanRequests(prev => [newReq, ...prev]);
      addAuditLog('loan_request_created', `Creó una solicitud de préstamo por RD$ ${reqAmount} para ${newReq.clientName}`);
      addNotification({
        title: 'Nueva Solicitud de Crédito',
        message: `Solicitud de RD$ ${reqAmount.toLocaleString()} registrada para ${newReq.clientName}.`,
        type: 'info',
        link: `/solicitudes`
      });
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
    const payload: Partial<LoanProductDB> = {};
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
      createLoan, updateLoan, deleteLoan, addHistoricalPayment, refinanceLoan, forgiveDebt, registerPayment, syncAllLoansNextPaymentDates, addLoanRequest, deleteLoanRequest,
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
