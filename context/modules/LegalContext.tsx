import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  LegalLawyer, LegalCase, LegalEvent, LegalAgreement, 
  LegalCaseStage, LegalCaseStatus, Loan, LoanStatus, formatLoanId 
} from '../../types';
import type { 
  LegalLawyerDB, LegalCaseDB, LegalEventDB, LegalAgreementDB, LoanDB 
} from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { useLoans } from './LoanContext';
import { useAccounting } from './AccountingContext';
import { logger } from '../../utils/logger';

interface LegalContextType {
  lawyers: LegalLawyer[];
  legalCases: LegalCase[];
  legalEvents: LegalEvent[];
  legalAgreements: LegalAgreement[];
  isLoadingLegal: boolean;
  
  refreshLegalData: () => Promise<void>;
  openLegalCase: (data: { 
    loanId: string; 
    lawyerId?: string; 
    notes?: string; 
    courtJurisdiction?: string; 
    initialLegalCost?: number;
    initialStage?: LegalCaseStage;
  }) => Promise<LegalCase | void>;
  updateLegalCaseStage: (caseId: string, stage: LegalCaseStage, status?: LegalCaseStatus, notes?: string) => Promise<void>;
  addLegalEvent: (eventData: Omit<LegalEvent, 'id' | 'createdAt' | 'lenderId'>) => Promise<LegalEvent | void>;
  createLegalAgreement: (agreementData: Omit<LegalAgreement, 'id' | 'createdAt' | 'lenderId'>) => Promise<LegalAgreement | void>;
  addLawyer: (data: Omit<LegalLawyer, 'id' | 'createdAt' | 'lenderId'>) => Promise<LegalLawyer | void>;
  updateLawyer: (id: string, updates: Partial<LegalLawyer>) => Promise<void>;
  deleteLawyer: (id: string) => Promise<void>;
  closeLegalCase: (caseId: string, resolution: 'Recuperado' | 'Cerrado', notes?: string) => Promise<void>;
}

const LegalContext = createContext<LegalContextType | undefined>(undefined);

const mapLawyer = (l: LegalLawyerDB): LegalLawyer => ({
  id: l.id,
  lenderId: l.lender_id,
  name: l.name,
  firmName: l.firm_name || undefined,
  rncOrCedula: l.rnc_or_cedula || undefined,
  phone: l.phone || undefined,
  whatsapp: l.whatsapp || undefined,
  email: l.email || undefined,
  address: l.address || undefined,
  feePercentage: Number(l.fee_percentage) || 15,
  fixedFee: Number(l.fixed_fee) || 0,
  status: (l.status || 'Activo') as LegalLawyer['status'],
  createdAt: l.created_at || new Date().toISOString()
});

const mapLegalCase = (c: LegalCaseDB): LegalCase => ({
  id: c.id,
  lenderId: c.lender_id,
  loanId: c.loan_id,
  clientId: c.client_id,
  clientName: c.client_name,
  expedienteNumber: c.expediente_number,
  courtJurisdiction: c.court_jurisdiction || undefined,
  lawyerId: c.lawyer_id || undefined,
  lawyerName: c.lawyer_name || undefined,
  lawyerFirm: c.lawyer_firm || undefined,
  stage: (c.stage || 'Intimación Extrajudicial') as LegalCaseStage,
  status: (c.status || 'En Trámite') as LegalCaseStatus,
  initialDebt: Number(c.initial_debt) || 0,
  legalFees: Number(c.legal_fees) || 0,
  courtCosts: Number(c.court_costs) || 0,
  totalLegalDebt: Number(c.total_legal_debt) || 0,
  recoveredAmount: Number(c.recovered_amount) || 0,
  startDate: c.start_date || new Date().toISOString().split('T')[0],
  closedDate: c.closed_date || undefined,
  notes: c.notes || undefined,
  createdAt: c.created_at || new Date().toISOString()
});

const mapLegalEvent = (e: LegalEventDB): LegalEvent => ({
  id: e.id,
  lenderId: e.lender_id,
  caseId: e.case_id,
  eventType: (e.event_type || 'Acto de Alguacil') as LegalEvent['eventType'],
  title: e.title,
  description: e.description || undefined,
  eventDate: e.event_date || new Date().toISOString().split('T')[0],
  cost: Number(e.cost) || 0,
  addToDebt: Boolean(e.add_to_debt),
  notaryOrBailiffName: e.notary_or_bailiff_name || undefined,
  documentNumber: e.document_number || undefined,
  documentUrl: e.document_url || undefined,
  status: (e.status || 'Completado') as LegalEvent['status'],
  createdAt: e.created_at || new Date().toISOString()
});

const mapLegalAgreement = (a: LegalAgreementDB): LegalAgreement => ({
  id: a.id,
  lenderId: a.lender_id,
  caseId: a.case_id,
  loanId: a.loan_id,
  clientId: a.client_id,
  agreementDate: a.agreement_date || new Date().toISOString().split('T')[0],
  agreedTotal: Number(a.agreed_total) || 0,
  downPayment: Number(a.down_payment) || 0,
  installmentsCount: Number(a.installments_count) || 1,
  installmentAmount: Number(a.installment_amount) || 0,
  frequency: (a.frequency || 'Quincenal') as LegalAgreement['frequency'],
  homologatedByCourt: Boolean(a.homologated_by_court),
  courtReference: a.court_reference || undefined,
  status: (a.status || 'Cumpliendo') as LegalAgreement['status'],
  notes: a.notes || undefined,
  createdAt: a.created_at || new Date().toISOString()
});

export const LegalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const { addAuditLog, addNotification } = useSettings();
  const { loans, updateLoan } = useLoans();
  const { addTransaction } = useAccounting();

  const [lawyers, setLawyers] = useState<LegalLawyer[]>([]);
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [legalEvents, setLegalEvents] = useState<LegalEvent[]>([]);
  const [legalAgreements, setLegalAgreements] = useState<LegalAgreement[]>([]);
  const [isLoadingLegal, setIsLoadingLegal] = useState<boolean>(false);

  const refreshLegalData = async () => {
    if (!currentUser) {
      setLawyers([]); setLegalCases([]); setLegalEvents([]); setLegalAgreements([]);
      return;
    }
    setIsLoadingLegal(true);
    try {
      const [lawyersRes, casesRes, eventsRes, agreementsRes] = await Promise.all([
        insforge.database.from('legal_lawyers').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
        insforge.database.from('legal_cases').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
        insforge.database.from('legal_events').select('*').eq('lender_id', currentUser.id).order('event_date', { ascending: false }),
        insforge.database.from('legal_agreements').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false })
      ]);

      if (lawyersRes.data) setLawyers((lawyersRes.data as LegalLawyerDB[]).map(mapLawyer));
      if (casesRes.data) setLegalCases((casesRes.data as LegalCaseDB[]).map(mapLegalCase));
      if (eventsRes.data) setLegalEvents((eventsRes.data as LegalEventDB[]).map(mapLegalEvent));
      if (agreementsRes.data) setLegalAgreements((agreementsRes.data as LegalAgreementDB[]).map(mapLegalAgreement));
    } catch (err) {
      logger.error('Error fetching legal collection data:', err);
    } finally {
      setIsLoadingLegal(false);
    }
  };

  useEffect(() => {
    refreshLegalData();
  }, [currentUser]);

  // Open Legal Case / Move Loan to Compulsive Collection
  const openLegalCase = async (data: { 
    loanId: string; 
    lawyerId?: string; 
    notes?: string; 
    courtJurisdiction?: string; 
    initialLegalCost?: number;
    initialStage?: LegalCaseStage;
  }): Promise<LegalCase | void> => {
    if (!currentUser) return;
    
    const targetLoan = loans.find(l => l.id === data.loanId);
    if (!targetLoan) {
      addToast('No se encontró el préstamo a trasladar a cobro legal.', 'error');
      return;
    }

    const assignedLawyer = lawyers.find(lw => lw.id === data.lawyerId);
    const caseId = `case-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();
    const expedienteNumber = `EXP-${year}-${formatLoanId(targetLoan.id)}`;

    const initialDebtVal = Number(targetLoan.remainingBalance) || 0;
    const initialCost = Number(data.initialLegalCost) || 0;
    const totalLegalDebtVal = initialDebtVal + initialCost;

    const casePayload: LegalCaseDB = {
      id: caseId,
      lender_id: currentUser.id,
      loan_id: targetLoan.id,
      client_id: targetLoan.clientId,
      client_name: targetLoan.clientName,
      expediente_number: expedienteNumber,
      court_jurisdiction: data.courtJurisdiction || 'Tribunal de Primera Instancia / Juzgado de Paz',
      lawyer_id: assignedLawyer?.id || null,
      lawyer_name: assignedLawyer?.name || null,
      lawyer_firm: assignedLawyer?.firmName || null,
      stage: data.initialStage || 'Intimación Extrajudicial',
      status: 'En Trámite',
      initial_debt: initialDebtVal,
      legal_fees: initialCost,
      court_costs: 0,
      total_legal_debt: totalLegalDebtVal,
      recovered_amount: 0,
      start_date: today,
      notes: data.notes || `Traslado a cobro compulsivo. Saldo base: RD$ ${initialDebtVal.toLocaleString()}`
    };

    const { data: insertedCase, error: caseErr } = await insforge.database
      .from('legal_cases')
      .insert([casePayload])
      .select()
      .single();

    if (caseErr) {
      logger.error('Error opening legal case:', caseErr);
      addToast(`Error al abrir expediente legal: ${caseErr.message}`, 'error');
      return;
    }

    // Update Loan record in DB and local state
    const newRemainingBalance = initialDebtVal + initialCost;
    const newTotalToPay = (Number(targetLoan.totalToPay) || 0) + initialCost;

    await insforge.database
      .from('loans')
      .update({
        status: 'Cobro Legal',
        is_in_legal_collection: true,
        legal_case_id: caseId,
        legal_fees_added: initialCost,
        remainingbalance: newRemainingBalance,
        remaining_balance: newRemainingBalance,
        totaltopay: newTotalToPay,
        total_to_pay: newTotalToPay
      })
      .eq('id', targetLoan.id);

    await updateLoan({
      ...targetLoan,
      status: LoanStatus.LEGAL,
      isInLegalCollection: true,
      legalCaseId: caseId,
      legalFeesAdded: initialCost,
      remainingBalance: newRemainingBalance,
      totalToPay: newTotalToPay
    });

    // If initial cost registered, create initial procedural event
    if (initialCost > 0) {
      const eventId = `ev-${Date.now()}`;
      const eventPayload: LegalEventDB = {
        id: eventId,
        lender_id: currentUser.id,
        case_id: caseId,
        event_type: 'Intimación Notarial',
        title: 'Acto de Intimación de Pago y Puesta en Mora',
        description: 'Notificación notarial previa al inicio formal de demanda judicial.',
        event_date: today,
        cost: initialCost,
        add_to_debt: true,
        notary_or_bailiff_name: assignedLawyer?.name || 'Notario Público',
        status: 'Completado'
      };

      await insforge.database.from('legal_events').insert([eventPayload]);
      
      const createdEv = mapLegalEvent(eventPayload);
      setLegalEvents(prev => [createdEv, ...prev]);

      // Register accounting expense for the legal fee
      await addTransaction({
        type: 'Gasto',
        category: 'Legal y Notarial',
        amount: initialCost,
        date: today,
        description: `Gastos de Intimación Legal y Notarial • Expediente ${expedienteNumber} (${targetLoan.clientName})`,
        paymentType: 'Comisión',
        paymentMethod: 'Efectivo'
      });
    }

    const createdCase = mapLegalCase(insertedCase as LegalCaseDB);
    setLegalCases(prev => [createdCase, ...prev]);

    addAuditLog('legal_case_opened', `Abrió expediente legal ${expedienteNumber} para cliente ${targetLoan.clientName} (Préstamo #${formatLoanId(targetLoan.id)})`);
    addNotification({
      title: 'Expediente Legal Iniciado',
      message: `El préstamo de ${targetLoan.clientName} fue trasladado a Cobranza Legal con radicación ${expedienteNumber}.`,
      type: 'warning',
      link: `/legal`
    });

    addToast(`Préstamo trasladado a Cobro Legal (Expediente ${expedienteNumber})`, 'success');
    return createdCase;
  };

  // Update Legal Case Stage / Status
  const updateLegalCaseStage = async (caseId: string, stage: LegalCaseStage, status?: LegalCaseStatus, notes?: string) => {
    if (!currentUser) return;
    const dbUpdates: Partial<LegalCaseDB> = { stage };
    if (status) dbUpdates.status = status;
    if (notes) dbUpdates.notes = notes;

    const { error } = await insforge.database
      .from('legal_cases')
      .update(dbUpdates)
      .eq('id', caseId)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setLegalCases(prev => prev.map(c => c.id === caseId ? { ...c, stage, ...(status ? { status } : {}), ...(notes ? { notes } : {}) } : c));
      addToast('Etapa procesal actualizada con éxito', 'success');
    } else {
      addToast(`Error al actualizar caso: ${error.message}`, 'error');
    }
  };

  // Add Legal Event / Cost to Case & Procedural Log
  const addLegalEvent = async (eventData: Omit<LegalEvent, 'id' | 'createdAt' | 'lenderId'>): Promise<LegalEvent | void> => {
    if (!currentUser) return;
    const eventId = `ev-${Date.now()}`;
    const targetCase = legalCases.find(c => c.id === eventData.caseId);

    const payload: LegalEventDB = {
      id: eventId,
      lender_id: currentUser.id,
      case_id: eventData.caseId,
      event_type: eventData.eventType,
      title: eventData.title,
      description: eventData.description || null,
      event_date: eventData.eventDate,
      cost: eventData.cost || 0,
      add_to_debt: eventData.addToDebt,
      notary_or_bailiff_name: eventData.notaryOrBailiffName || null,
      document_number: eventData.documentNumber || null,
      document_url: eventData.documentUrl || null,
      status: eventData.status || 'Completado'
    };

    const { data: inserted, error } = await insforge.database
      .from('legal_events')
      .insert([payload])
      .select()
      .single();

    if (error) {
      logger.error('Error inserting legal event:', error);
      addToast(`Error al registrar actuación: ${error.message}`, 'error');
      return;
    }

    const createdEvent = mapLegalEvent(inserted as LegalEventDB);
    setLegalEvents(prev => [createdEvent, ...prev]);

    // If cost added to debt and > 0, update case and loan
    if (eventData.addToDebt && eventData.cost > 0 && targetCase) {
      const addedFee = Number(eventData.cost);
      const newFees = targetCase.legalFees + addedFee;
      const newTotalLegalDebt = targetCase.totalLegalDebt + addedFee;

      void insforge.database
        .from('legal_cases')
        .update({
          legal_fees: newFees,
          total_legal_debt: newTotalLegalDebt
        })
        .eq('id', targetCase.id);

      setLegalCases(prev => prev.map(c => c.id === targetCase.id ? { ...c, legalFees: newFees, totalLegalDebt: newTotalLegalDebt } : c));

      // Also increment loan balance
      const associatedLoan = loans.find(l => l.id === targetCase.loanId);
      if (associatedLoan) {
        const newBal = associatedLoan.remainingBalance + addedFee;
        const newTotal = (associatedLoan.totalToPay || associatedLoan.amount) + addedFee;
        const newFeesAdded = (associatedLoan.legalFeesAdded || 0) + addedFee;

        void insforge.database
          .from('loans')
          .update({
            remainingbalance: newBal,
            remaining_balance: newBal,
            totaltopay: newTotal,
            total_to_pay: newTotal,
            legal_fees_added: newFeesAdded
          })
          .eq('id', associatedLoan.id);

        void updateLoan({
          ...associatedLoan,
          remainingBalance: newBal,
          totalToPay: newTotal,
          legalFeesAdded: newFeesAdded
        });
      }

      // Record in accounting
      void addTransaction({
        type: 'Gasto',
        category: 'Legal y Notarial',
        amount: addedFee,
        date: eventData.eventDate,
        description: `Gasto Legal: ${eventData.title} (${eventData.eventType}) • Caso ${targetCase.expedienteNumber}`,
        paymentType: 'Comisión',
        paymentMethod: 'Efectivo'
      });
    }

    addToast('Actuación y gasto legal registrados en el expediente', 'success');
    return createdEvent;
  };

  // Create Homologated Legal Agreement
  const createLegalAgreement = async (agreementData: Omit<LegalAgreement, 'id' | 'createdAt' | 'lenderId'>): Promise<LegalAgreement | void> => {
    if (!currentUser) return;
    const agreementId = `agr-${Date.now()}`;

    const payload: LegalAgreementDB = {
      id: agreementId,
      lender_id: currentUser.id,
      case_id: agreementData.caseId,
      loan_id: agreementData.loanId,
      client_id: agreementData.clientId,
      agreement_date: agreementData.agreementDate,
      agreed_total: agreementData.agreedTotal,
      down_payment: agreementData.downPayment || 0,
      installments_count: agreementData.installmentsCount,
      installment_amount: agreementData.installmentAmount,
      frequency: agreementData.frequency,
      homologated_by_court: agreementData.homologatedByCourt,
      court_reference: agreementData.courtReference || null,
      status: agreementData.status || 'Cumpliendo',
      notes: agreementData.notes || null
    };

    const { data: inserted, error } = await insforge.database
      .from('legal_agreements')
      .insert([payload])
      .select()
      .single();

    if (error) {
      logger.error('Error creating legal agreement:', error);
      addToast(`Error al formalizar acuerdo: ${error.message}`, 'error');
      return;
    }

    const createdAgreement = mapLegalAgreement(inserted as LegalAgreementDB);
    setLegalAgreements(prev => [createdAgreement, ...prev]);

    // Update case stage to 'Acuerdo de Pago'
    await updateLegalCaseStage(agreementData.caseId, 'Acuerdo de Pago', 'Acuerdo Vigente', `Acuerdo de pago formalizado por RD$ ${agreementData.agreedTotal.toLocaleString()} en ${agreementData.installmentsCount} cuotas ${agreementData.frequency}es.`);

    addNotification({
      title: 'Acuerdo Legal Homologado',
      message: `Se registró acuerdo de pago transaccional por RD$ ${agreementData.agreedTotal.toLocaleString()} en el caso legal.`,
      type: 'success',
      link: `/legal`
    });

    addToast('Acuerdo de pago registrado y homologado con éxito', 'success');
    return createdAgreement;
  };

  // Close Legal Case
  const closeLegalCase = async (caseId: string, resolution: 'Recuperado' | 'Cerrado', notes?: string) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const targetCase = legalCases.find(c => c.id === caseId);

    const { error } = await insforge.database
      .from('legal_cases')
      .update({
        status: resolution,
        stage: resolution === 'Recuperado' ? 'Cerrado / Recuperado' : 'Incobrable Definitivo',
        closed_date: today,
        notes: notes ? `${targetCase?.notes || ''} • Cierre: ${notes}` : targetCase?.notes
      })
      .eq('id', caseId)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setLegalCases(prev => prev.map(c => c.id === caseId ? {
        ...c,
        status: resolution,
        stage: resolution === 'Recuperado' ? 'Cerrado / Recuperado' : 'Incobrable Definitivo',
        closedDate: today
      } : c));

      if (targetCase) {
        const associatedLoan = loans.find(l => l.id === targetCase.loanId);
        if (associatedLoan && resolution === 'Recuperado') {
          void updateLoan({
            ...associatedLoan,
            status: LoanStatus.PAID,
            remainingBalance: 0,
            isInLegalCollection: false
          });
        }
      }

      addToast(`Expediente legal cerrado (${resolution})`, 'info');
    }
  };

  // Lawyers CRUD
  const addLawyer = async (data: Omit<LegalLawyer, 'id' | 'createdAt' | 'lenderId'>): Promise<LegalLawyer | void> => {
    if (!currentUser) return;
    const id = `lawyer-${Date.now()}`;
    const payload: LegalLawyerDB = {
      id,
      lender_id: currentUser.id,
      name: data.name,
      firm_name: data.firmName || null,
      rnc_or_cedula: data.rncOrCedula || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      address: data.address || null,
      fee_percentage: data.feePercentage || 15,
      fixed_fee: data.fixedFee || 0,
      status: data.status || 'Activo'
    };

    const { data: inserted, error } = await insforge.database
      .from('legal_lawyers')
      .insert([payload])
      .select()
      .single();

    if (error) {
      logger.error('Error adding lawyer:', error);
      addToast(`Error al registrar abogado: ${error.message}`, 'error');
      return;
    }

    const createdLawyer = mapLawyer(inserted as LegalLawyerDB);
    setLawyers(prev => [createdLawyer, ...prev]);
    addToast('Abogado / Firma legal registrado con éxito', 'success');
    return createdLawyer;
  };

  const updateLawyer = async (id: string, updates: Partial<LegalLawyer>) => {
    if (!currentUser) return;
    const dbUpdates: Partial<LegalLawyerDB> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.firmName !== undefined) dbUpdates.firm_name = updates.firmName || null;
    if (updates.rncOrCedula !== undefined) dbUpdates.rnc_or_cedula = updates.rncOrCedula || null;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
    if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp || null;
    if (updates.email !== undefined) dbUpdates.email = updates.email || null;
    if (updates.address !== undefined) dbUpdates.address = updates.address || null;
    if (updates.feePercentage !== undefined) dbUpdates.fee_percentage = updates.feePercentage;
    if (updates.fixedFee !== undefined) dbUpdates.fixed_fee = updates.fixedFee;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { error } = await insforge.database
      .from('legal_lawyers')
      .update(dbUpdates)
      .eq('id', id)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setLawyers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      addToast('Información de abogado actualizada', 'success');
    }
  };

  const deleteLawyer = async (id: string) => {
    if (!currentUser) return;
    const { error } = await insforge.database
      .from('legal_lawyers')
      .delete()
      .eq('id', id)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setLawyers(prev => prev.filter(l => l.id !== id));
      addToast('Abogado eliminado', 'info');
    }
  };

  return (
    <LegalContext.Provider value={{
      lawyers, legalCases, legalEvents, legalAgreements, isLoadingLegal,
      refreshLegalData, openLegalCase, updateLegalCaseStage, addLegalEvent,
      createLegalAgreement, addLawyer, updateLawyer, deleteLawyer, closeLegalCase
    }}>
      {children}
    </LegalContext.Provider>
  );
};

export const useLegal = () => {
  const context = useContext(LegalContext);
  if (!context) throw new Error('useLegal must be used within a LegalProvider');
  return context;
};
