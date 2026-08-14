import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MerchantPartner, LoanRequest, Loan, formatLoanId } from '../../types';
import type { MerchantPartnerDB, LoanRequestDB, LoanDB, ClientDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { useLoans } from './LoanContext';
import { useClients } from './ClientContext';
import { useAccounting } from './AccountingContext';
import { logger } from '../../utils/logger';

interface MerchantContextType {
  merchants: MerchantPartner[];
  isLoadingMerchants: boolean;
  addMerchant: (data: Omit<MerchantPartner, 'id' | 'createdAt' | 'totalFinanced' | 'totalApplications' | 'lenderId'>) => Promise<MerchantPartner | void>;
  updateMerchant: (id: string, updates: Partial<MerchantPartner>) => Promise<void>;
  deleteMerchant: (id: string) => Promise<void>;
  refreshMerchants: () => Promise<void>;
  submitPosLoanRequest: (requestData: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  approvePosLoanRequest: (request: LoanRequest, options?: { bankAccountId?: string }) => Promise<Loan | void>;
  rejectPosLoanRequest: (requestId: string, reason?: string) => Promise<void>;
  liquidateMerchantPayout: (requestId: string, payoutData: { reference: string; date: string; amount: number; bankAccountId?: string }) => Promise<void>;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

const mapMerchant = (m: MerchantPartnerDB): MerchantPartner => ({
  id: m.id,
  lenderId: m.lender_id,
  name: m.name,
  rncOrCedula: m.rnc_or_cedula || undefined,
  category: (m.category || 'Otro') as MerchantPartner['category'],
  contactName: m.contact_name || undefined,
  phone: m.phone || undefined,
  whatsapp: m.whatsapp || undefined,
  email: m.email || undefined,
  address: m.address || undefined,
  city: m.city || undefined,
  commissionPercent: Number(m.commission_percent) || 0,
  bankName: m.bank_name || undefined,
  bankAccountNumber: m.bank_account_number || undefined,
  bankAccountType: (m.bank_account_type || 'Corriente') as MerchantPartner['bankAccountType'],
  bankHolderName: m.bank_holder_name || undefined,
  portalSlug: m.portal_slug,
  pinCode: m.pin_code || '1234',
  status: (m.status || 'Activo') as MerchantPartner['status'],
  logoUrl: m.logo_url || undefined,
  totalFinanced: Number(m.total_financed) || 0,
  totalApplications: Number(m.total_applications) || 0,
  createdAt: m.created_at || new Date().toISOString()
});

export const MerchantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const { addAuditLog, addNotification } = useSettings();
  const { createLoan, deleteLoanRequest } = useLoans();
  const { clients, addClient } = useClients();
  const { addTransaction, processBankDisbursement } = useAccounting();

  const [merchants, setMerchants] = useState<MerchantPartner[]>([]);
  const [isLoadingMerchants, setIsLoadingMerchants] = useState<boolean>(false);

  const refreshMerchants = async () => {
    if (!currentUser) { setMerchants([]); return; }
    setIsLoadingMerchants(true);
    try {
      const { data, error } = await insforge.database
        .from('merchant_partners')
        .select('*')
        .eq('lender_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setMerchants((data as MerchantPartnerDB[]).map(mapMerchant));
      }
    } catch (err) {
      logger.error('Error fetching merchant partners:', err);
    } finally {
      setIsLoadingMerchants(false);
    }
  };

  useEffect(() => {
    refreshMerchants();
  }, [currentUser]);

  const addMerchant = async (data: Omit<MerchantPartner, 'id' | 'createdAt' | 'totalFinanced' | 'totalApplications' | 'lenderId'>): Promise<MerchantPartner | void> => {
    if (!currentUser) return;
    const merchantId = `merch-${Date.now()}`;
    const slug = (data.portalSlug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-').replace(/^-|-$/g, '');

    const insertPayload: MerchantPartnerDB = {
      id: merchantId,
      lender_id: currentUser.id,
      name: data.name,
      rnc_or_cedula: data.rncOrCedula || null,
      category: data.category,
      contact_name: data.contactName || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      commission_percent: data.commissionPercent || 0,
      bank_name: data.bankName || null,
      bank_account_number: data.bankAccountNumber || null,
      bank_account_type: data.bankAccountType || 'Corriente',
      bank_holder_name: data.bankHolderName || null,
      portal_slug: slug,
      pin_code: data.pinCode || '1234',
      status: data.status || 'Activo',
      logo_url: data.logoUrl || null,
      total_financed: 0,
      total_applications: 0
    };

    const { data: inserted, error } = await insforge.database
      .from('merchant_partners')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      logger.error('Error creating merchant:', error);
      addToast(`Error al registrar comercio: ${error.message}`, 'error');
      return;
    }

    const created = mapMerchant(inserted as MerchantPartnerDB);
    setMerchants(prev => [created, ...prev]);
    addAuditLog('merchant_created', `Registró comercio aliado: ${data.name} (Slug: ${slug})`);
    addToast('Comercio aliado registrado con éxito', 'success');
    return created;
  };

  const updateMerchant = async (id: string, updates: Partial<MerchantPartner>) => {
    if (!currentUser) return;
    const dbUpdates: Partial<MerchantPartnerDB> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.rncOrCedula !== undefined) dbUpdates.rnc_or_cedula = updates.rncOrCedula || null;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName || null;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
    if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp || null;
    if (updates.email !== undefined) dbUpdates.email = updates.email || null;
    if (updates.address !== undefined) dbUpdates.address = updates.address || null;
    if (updates.city !== undefined) dbUpdates.city = updates.city || null;
    if (updates.commissionPercent !== undefined) dbUpdates.commission_percent = updates.commissionPercent;
    if (updates.bankName !== undefined) dbUpdates.bank_name = updates.bankName || null;
    if (updates.bankAccountNumber !== undefined) dbUpdates.bank_account_number = updates.bankAccountNumber || null;
    if (updates.bankAccountType !== undefined) dbUpdates.bank_account_type = updates.bankAccountType;
    if (updates.bankHolderName !== undefined) dbUpdates.bank_holder_name = updates.bankHolderName || null;
    if (updates.portalSlug !== undefined) dbUpdates.portal_slug = updates.portalSlug;
    if (updates.pinCode !== undefined) dbUpdates.pin_code = updates.pinCode;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl || null;

    const { error } = await insforge.database
      .from('merchant_partners')
      .update(dbUpdates)
      .eq('id', id)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setMerchants(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      addToast('Comercio actualizado correctamente', 'success');
    } else {
      addToast(`Error al actualizar comercio: ${error.message}`, 'error');
    }
  };

  const deleteMerchant = async (id: string) => {
    if (!currentUser) return;
    const { error } = await insforge.database
      .from('merchant_partners')
      .delete()
      .eq('id', id)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setMerchants(prev => prev.filter(m => m.id !== id));
      addToast('Comercio eliminado', 'success');
    } else {
      addToast(`Error al eliminar comercio: ${error.message}`, 'error');
    }
  };

  // Submit in-store BNPL loan request from POS portal
  const submitPosLoanRequest = async (requestData: Omit<LoanRequest, 'id' | 'status' | 'requestDate'>): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const id = `req-pos-${Date.now()}`;
      const payload: Partial<LoanRequestDB> = {
        id,
        client_name: requestData.clientName,
        client_phone: requestData.clientPhone || null,
        client_email: requestData.clientEmail || null,
        amount: requestData.amount || requestData.financedAmount || 0,
        requested_amount: requestData.requestedAmount || requestData.financedAmount || requestData.amount || 0,
        interest_rate: requestData.interestRate || 0,
        duration_weeks: requestData.durationWeeks || 4,
        frequency: requestData.frequency || 'Quincenal',
        loan_type: requestData.loanType || 'Amortización',
        loan_category: 'Comercial',
        item_price: requestData.itemPrice || null,
        down_payment: requestData.downPayment || 0,
        financed_amount: requestData.financedAmount || requestData.amount || 0,
        down_payment_mode: requestData.downPaymentMode || 'Efectivo',
        merchant_id: requestData.merchantId || null,
        merchant_name: requestData.merchantName || null,
        product_description: requestData.productDescription || null,
        merchant_invoice_number: requestData.merchantInvoiceNumber || null,
        merchant_payout_status: 'Pendiente',
        buyer_cedula: requestData.buyerCedula || null,
        buyer_id_photo_front: requestData.buyerIdPhotoFront || null,
        buyer_id_photo_back: requestData.buyerIdPhotoBack || null,
        product_invoice_photo: requestData.productInvoicePhoto || null,
        notes: requestData.notes || `Solicitud POS en tienda ${requestData.merchantName || ''}`,
        status: 'En evaluación'
      };

      // Query merchant to get lender_id
      if (requestData.merchantId) {
        const { data: mData } = await insforge.database
          .from('merchant_partners')
          .select('lender_id, total_applications')
          .eq('id', requestData.merchantId)
          .single();

        if (mData && mData.lender_id) {
          payload.lender_id = mData.lender_id;
          // Increment merchant application counter
          void insforge.database
            .from('merchant_partners')
            .update({ total_applications: (mData.total_applications || 0) + 1 })
            .eq('id', requestData.merchantId);
        }
      }

      const { error } = await insforge.database
        .from('loan_requests')
        .insert([payload]);

      if (error) {
        logger.error('Error inserting POS loan request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id };
    } catch (err) {
      logger.error('Unexpected error in submitPosLoanRequest:', err);
      return { success: false, error: 'Error inesperado al enviar solicitud.' };
    }
  };

  // Express 1-Click Approval of in-store POS request
  const approvePosLoanRequest = async (request: LoanRequest, options?: { bankAccountId?: string }): Promise<Loan | void> => {
    if (!currentUser) return;

    try {
      // 1. Auto-match or create client
      let targetClientId = request.clientId;
      if (!targetClientId) {
        const existingClient = clients.find(c => 
          (request.buyerCedula && c.cedula && c.cedula.replace(/\D/g, '') === request.buyerCedula.replace(/\D/g, '')) ||
          (request.clientPhone && c.phone && c.phone.replace(/\D/g, '') === request.clientPhone.replace(/\D/g, ''))
        );

        if (existingClient) {
          targetClientId = existingClient.id;
        } else {
          // Create new client record automatically
          const createdClient = await addClient({
            name: request.clientName,
            cedula: request.buyerCedula || 'S/N',
            phone: request.clientPhone || 'S/N',
            email: request.clientEmail,
            status: 'Activo',
            income: 25000,
            creditScore: 720,
            joinedDate: new Date().toISOString().split('T')[0]
          });

          if (createdClient) {
            targetClientId = createdClient.id;
          }
        }
      }

      const financedPrincipal = Number(request.financedAmount || request.requestedAmount || request.amount || 0);
      const interestRateVal = Number(request.interestRate || 10);
      const installmentsCount = Number(request.durationWeeks || request.requestedTerm || 6);

      // 2. Create the Loan in active state
      const createdLoan = await createLoan({
        clientId: targetClientId || 'cliente-general',
        clientName: request.clientName,
        amount: financedPrincipal,
        interestRate: interestRateVal,
        installments: installmentsCount,
        frequency: (request.frequency || 'Quincenal') as Loan['frequency'],
        startDate: new Date().toISOString().split('T')[0],
        loanType: (request.loanType || 'Amortización') as Loan['loanType'],
        loanCategory: 'Comercial',
        itemPrice: request.itemPrice,
        downPayment: request.downPayment,
        downPaymentMode: request.downPaymentMode,
        financedAmount: financedPrincipal,
        nextPaymentDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        note: `Crédito en Punto de Venta: ${request.merchantName || 'Comercio'} • Artículo: ${request.productDescription || 'Mercancía'}`
      });

      // 3. Update Loan Request status to Approved & mark Payout
      await insforge.database
        .from('loan_requests')
        .update({
          status: 'Aprobado',
          merchant_payout_status: 'Liquidado',
          merchant_payout_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', request.id);

      // 4. Update merchant metrics in database
      if (request.merchantId) {
        const targetMerchant = merchants.find(m => m.id === request.merchantId);
        if (targetMerchant) {
          const newTotal = targetMerchant.totalFinanced + financedPrincipal;
          void insforge.database
            .from('merchant_partners')
            .update({ total_financed: newTotal })
            .eq('id', request.merchantId);

          setMerchants(prev => prev.map(m => m.id === request.merchantId ? { ...m, totalFinanced: newTotal } : m));
        }
      }

      // 5. Register disbursement transaction to merchant
      await addTransaction({
        type: 'Gasto',
        category: 'Desembolso',
        amount: financedPrincipal,
        date: new Date().toISOString().split('T')[0],
        description: `Desembolso Directo a Comercio Aliado: ${request.merchantName || 'Comercio'} por compra de ${request.productDescription || 'Mercancía'} (${request.clientName})`,
        paymentType: 'Capital',
        paymentMethod: 'Transferencia',
        bankAccountId: options?.bankAccountId
      });

      if (options?.bankAccountId) {
        processBankDisbursement(options.bankAccountId, financedPrincipal);
      }

      addNotification({
        title: 'Solicitud POS Aprobada',
        message: `Se aprobó crédito de RD$ ${financedPrincipal.toLocaleString()} para ${request.clientName} en ${request.merchantName || 'Comercio'}.`,
        type: 'success',
        link: `/prestamos`
      });

      addAuditLog('merchant_pos_approved', `Aprobación Express POS: RD$ ${financedPrincipal.toLocaleString()} a favor de ${request.merchantName} para ${request.clientName}`);
      addToast(`Crédito aprobado y liquidado con éxito a ${request.merchantName || 'Comercio'}`, 'success');

      return createdLoan || undefined;
    } catch (err) {
      logger.error('Error approving POS loan request:', err);
      addToast('Error al procesar la aprobación exprés', 'error');
    }
  };

  const rejectPosLoanRequest = async (requestId: string, reason?: string) => {
    if (!currentUser) return;
    try {
      await insforge.database
        .from('loan_requests')
        .update({
          status: 'Rechazado',
          notes: reason ? `Rechazado: ${reason}` : 'Rechazado por evaluación de riesgo.'
        })
        .eq('id', requestId)
        .eq('lender_id', currentUser.id);

      addToast('Solicitud rechazada', 'info');
    } catch (err) {
      logger.error('Error rejecting POS loan request:', err);
    }
  };

  const liquidateMerchantPayout = async (requestId: string, payoutData: { reference: string; date: string; amount: number; bankAccountId?: string }) => {
    if (!currentUser) return;
    try {
      await insforge.database
        .from('loan_requests')
        .update({
          merchant_payout_status: 'Liquidado',
          merchant_payout_date: payoutData.date
        })
        .eq('id', requestId)
        .eq('lender_id', currentUser.id);

      await addTransaction({
        type: 'Gasto',
        category: 'Desembolso',
        amount: payoutData.amount,
        date: payoutData.date,
        description: `Liquidación de Crédito POS Ref #${payoutData.reference}`,
        paymentType: 'Capital',
        paymentMethod: 'Transferencia',
        bankAccountId: payoutData.bankAccountId
      });

      if (payoutData.bankAccountId) {
        processBankDisbursement(payoutData.bankAccountId, payoutData.amount);
      }

      addToast('Liquidación registrada con éxito', 'success');
    } catch (err) {
      logger.error('Error liquidating merchant payout:', err);
    }
  };

  return (
    <MerchantContext.Provider value={{
      merchants, isLoadingMerchants, addMerchant, updateMerchant, deleteMerchant, refreshMerchants,
      submitPosLoanRequest, approvePosLoanRequest, rejectPosLoanRequest, liquidateMerchantPayout
    }}>
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchants = () => {
  const context = useContext(MerchantContext);
  if (!context) throw new Error('useMerchants must be used within a MerchantProvider');
  return context;
};
