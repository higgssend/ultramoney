import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  VaultCollateral, VaultCustodyLog, VaultCustodyStatus, 
  VaultMovementType, VaultItemType, PaymentMethod, formatLoanId 
} from '../../types';
import type { VaultCollateralDB, VaultCustodyLogDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { useLoans } from './LoanContext';
import { useAccounting } from './AccountingContext';
import { logger } from '../../utils/logger';

interface VaultContextType {
  vaultCollaterals: VaultCollateral[];
  custodyLogs: VaultCustodyLog[];
  isLoadingVault: boolean;

  refreshVaultData: () => Promise<void>;
  registerVaultCollateral: (data: Omit<VaultCollateral, 'id' | 'createdAt' | 'lenderId'>) => Promise<VaultCollateral | void>;
  recordCustodyMovement: (data: {
    collateralId: string;
    movementType: VaultMovementType;
    authorizedBy: string;
    receivedBy: string;
    sealNumber?: string;
    keysDelivered?: boolean;
    documentsDelivered?: boolean;
    reason?: string;
    notes?: string;
    newCustodyStatus?: VaultCustodyStatus;
  }) => Promise<VaultCustodyLog | void>;
  adjudicateCollateral: (collateralId: string, data: { adjudicationNotes?: string; auctionMinPrice: number }) => Promise<void>;
  liquidateAuctionCollateral: (collateralId: string, data: {
    liquidationPrice: number;
    buyerName: string;
    buyerPhone?: string;
    paymentMethod: PaymentMethod;
    closeLoan?: boolean;
  }) => Promise<void>;
  updateVaultCollateral: (id: string, updates: Partial<VaultCollateral>) => Promise<void>;
  deleteVaultCollateral: (id: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const mapCollateral = (c: VaultCollateralDB): VaultCollateral => ({
  id: c.id,
  lenderId: c.lender_id,
  loanId: c.loan_id || undefined,
  clientId: c.client_id || undefined,
  clientName: c.client_name,
  itemType: (c.item_type || 'Garantía General') as VaultItemType,
  title: c.title,
  description: c.description || undefined,
  serialOrRef: c.serial_or_ref || undefined,
  appraisedValue: Number(c.appraised_value) || 0,
  loanDebtBalance: Number(c.loan_debt_balance) || 0,
  vaultLocation: c.vault_location || 'Bóveda Principal',
  drawerOrShelf: c.drawer_or_shelf || undefined,
  sealNumber: c.seal_number || undefined,
  custodyStatus: (c.custody_status || 'En Bóveda / Custodia') as VaultCustodyStatus,
  custodianName: c.custodian_name || undefined,
  entryDate: c.entry_date || new Date().toISOString().split('T')[0],
  exitDate: c.exit_date || undefined,
  hasOriginalDocuments: Boolean(c.has_original_documents),
  documentsList: c.documents_list || undefined,
  hasKeys: Boolean(c.has_keys),
  keysCount: Number(c.keys_count) || 0,
  adjudicationDate: c.adjudication_date || undefined,
  adjudicationNotes: c.adjudication_notes || undefined,
  auctionMinPrice: Number(c.auction_min_price) || 0,
  liquidationPrice: Number(c.liquidation_price) || 0,
  buyerName: c.buyer_name || undefined,
  buyerPhone: c.buyer_phone || undefined,
  liquidationDate: c.liquidation_date || undefined,
  createdAt: c.created_at || new Date().toISOString()
});

const mapCustodyLog = (l: VaultCustodyLogDB): VaultCustodyLog => ({
  id: l.id,
  lenderId: l.lender_id,
  collateralId: l.collateral_id,
  movementType: (l.movement_type || 'Ingreso a Bóveda') as VaultMovementType,
  movementDate: l.movement_date || new Date().toISOString().split('T')[0],
  authorizedBy: l.authorized_by,
  receivedBy: l.received_by,
  sealNumber: l.seal_number || undefined,
  keysDelivered: Boolean(l.keys_delivered),
  documentsDelivered: Boolean(l.documents_delivered),
  reason: l.reason || undefined,
  notes: l.notes || undefined,
  createdAt: l.created_at || new Date().toISOString()
});

export const VaultProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const { addAuditLog, addNotification } = useSettings();
  const { loans, updateLoan } = useLoans();
  const { addTransaction } = useAccounting();

  const [vaultCollaterals, setVaultCollaterals] = useState<VaultCollateral[]>([]);
  const [custodyLogs, setCustodyLogs] = useState<VaultCustodyLog[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState<boolean>(false);

  const refreshVaultData = async () => {
    if (!currentUser) {
      setVaultCollaterals([]); setCustodyLogs([]);
      return;
    }
    setIsLoadingVault(true);
    try {
      const [collateralsRes, logsRes] = await Promise.all([
        insforge.database.from('vault_collaterals').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
        insforge.database.from('vault_custody_logs').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false })
      ]);

      if (collateralsRes.data) setVaultCollaterals((collateralsRes.data as VaultCollateralDB[]).map(mapCollateral));
      if (logsRes.data) setCustodyLogs((logsRes.data as VaultCustodyLogDB[]).map(mapCustodyLog));
    } catch (err) {
      logger.error('Error fetching vault collateral data:', err);
    } finally {
      setIsLoadingVault(false);
    }
  };

  useEffect(() => {
    refreshVaultData();
  }, [currentUser]);

  // Register New Collateral into Vault
  const registerVaultCollateral = async (data: Omit<VaultCollateral, 'id' | 'createdAt' | 'lenderId'>): Promise<VaultCollateral | void> => {
    if (!currentUser) return;
    const id = `vault-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const payload: VaultCollateralDB = {
      id,
      lender_id: currentUser.id,
      loan_id: data.loanId || null,
      client_id: data.clientId || null,
      client_name: data.clientName,
      item_type: data.itemType,
      title: data.title,
      description: data.description || null,
      serial_or_ref: data.serialOrRef || null,
      appraised_value: Number(data.appraisedValue) || 0,
      loan_debt_balance: Number(data.loanDebtBalance) || 0,
      vault_location: data.vaultLocation || 'Bóveda Principal',
      drawer_or_shelf: data.drawerOrShelf || null,
      seal_number: data.sealNumber || null,
      custody_status: data.custodyStatus || 'En Bóveda / Custodia',
      custodian_name: data.custodianName || null,
      entry_date: data.entryDate || today,
      exit_date: null,
      has_original_documents: data.hasOriginalDocuments,
      documents_list: data.documentsList || null,
      has_keys: data.hasKeys,
      keys_count: data.keysCount || 0,
      adjudication_date: null,
      adjudication_notes: null,
      auction_min_price: Number(data.auctionMinPrice) || 0,
      liquidation_price: 0,
      buyer_name: null,
      buyer_phone: null,
      liquidation_date: null
    };

    const { data: inserted, error } = await insforge.database
      .from('vault_collaterals')
      .insert([payload])
      .select()
      .single();

    if (error) {
      logger.error('Error inserting vault collateral:', error);
      addToast(`Error al registrar garantía en bóveda: ${error.message}`, 'error');
      return;
    }

    const createdCollateral = mapCollateral(inserted as VaultCollateralDB);
    setVaultCollaterals(prev => [createdCollateral, ...prev]);

    // Create entry custody log
    const logId = `log-${Date.now()}`;
    const logPayload: VaultCustodyLogDB = {
      id: logId,
      lender_id: currentUser.id,
      collateral_id: id,
      movement_type: 'Ingreso a Bóveda',
      movement_date: data.entryDate || today,
      authorized_by: currentUser.name || 'Oficial de Bóveda',
      received_by: data.custodianName || currentUser.name || 'Custodio Principal',
      seal_number: data.sealNumber || null,
      keys_delivered: data.hasKeys,
      documents_delivered: data.hasOriginalDocuments,
      reason: 'Depósito inicial de garantía prendaria / custodia',
      notes: `Ubicación: ${data.vaultLocation}${data.drawerOrShelf ? ` (${data.drawerOrShelf})` : ''}`
    };

    void insforge.database.from('vault_custody_logs').insert([logPayload]);
    setCustodyLogs(prev => [mapCustodyLog(logPayload), ...prev]);

    addAuditLog('vault_item_registered', `Ingresó garantía ${data.title} a bóveda (${data.vaultLocation}) para cliente ${data.clientName}`);
    addNotification({
      title: 'Garantía Ingresada a Bóveda',
      message: `${data.title} (${data.clientName}) fue resguardado en ${data.vaultLocation} con precinto ${data.sealNumber || 'N/A'}.`,
      type: 'info',
      link: '/boveda'
    });

    addToast(`Garantía registrada en bóveda (${data.vaultLocation})`, 'success');
    return createdCollateral;
  };

  // Record Custody Movement (Salida temporal, Reingreso, Devolución)
  const recordCustodyMovement = async (data: {
    collateralId: string;
    movementType: VaultMovementType;
    authorizedBy: string;
    receivedBy: string;
    sealNumber?: string;
    keysDelivered?: boolean;
    documentsDelivered?: boolean;
    reason?: string;
    notes?: string;
    newCustodyStatus?: VaultCustodyStatus;
  }): Promise<VaultCustodyLog | void> => {
    if (!currentUser) return;
    const logId = `log-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const payload: VaultCustodyLogDB = {
      id: logId,
      lender_id: currentUser.id,
      collateral_id: data.collateralId,
      movement_type: data.movementType,
      movement_date: today,
      authorized_by: data.authorizedBy,
      received_by: data.receivedBy,
      seal_number: data.sealNumber || null,
      keys_delivered: Boolean(data.keysDelivered),
      documents_delivered: Boolean(data.documentsDelivered),
      reason: data.reason || null,
      notes: data.notes || null
    };

    const { data: inserted, error } = await insforge.database
      .from('vault_custody_logs')
      .insert([payload])
      .select()
      .single();

    if (error) {
      logger.error('Error logging custody movement:', error);
      addToast(`Error al registrar movimiento: ${error.message}`, 'error');
      return;
    }

    const createdLog = mapCustodyLog(inserted as VaultCustodyLogDB);
    setCustodyLogs(prev => [createdLog, ...prev]);

    // Determine and update collateral custody status
    let statusToSet: VaultCustodyStatus = data.newCustodyStatus || 'En Bóveda / Custodia';
    if (!data.newCustodyStatus) {
      if (data.movementType === 'Salida Temporal') statusToSet = 'Retirado Temporalmente';
      else if (data.movementType === 'Reingreso a Bóveda') statusToSet = 'En Bóveda / Custodia';
      else if (data.movementType === 'Devolución Definitiva') statusToSet = 'Devuelto al Cliente';
      else if (data.movementType === 'Adjudicación') statusToSet = 'Adjudicado';
      else if (data.movementType === 'Remate / Liquidación') statusToSet = 'Rematado / Liquidado';
    }

    const updates: Partial<VaultCollateralDB> = {
      custody_status: statusToSet,
      seal_number: data.sealNumber !== undefined ? data.sealNumber : undefined,
      exit_date: (statusToSet === 'Devuelto al Cliente' || statusToSet === 'Rematado / Liquidado') ? today : null
    };

    void insforge.database
      .from('vault_collaterals')
      .update(updates)
      .eq('id', data.collateralId);

    setVaultCollaterals(prev => prev.map(c => c.id === data.collateralId ? {
      ...c,
      custodyStatus: statusToSet,
      sealNumber: data.sealNumber || c.sealNumber,
      exitDate: updates.exit_date || undefined
    } : c));

    addToast(`Movimiento registrado: ${data.movementType}`, 'success');
    return createdLog;
  };

  // Adjudicate Collateral (Take ownership of defaulted loan asset)
  const adjudicateCollateral = async (collateralId: string, data: { adjudicationNotes?: string; auctionMinPrice: number }) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const target = vaultCollaterals.find(c => c.id === collateralId);

    const { error } = await insforge.database
      .from('vault_collaterals')
      .update({
        custody_status: 'Adjudicado',
        adjudication_date: today,
        adjudication_notes: data.adjudicationNotes || 'Garantía adjudicada por mora y ejecución de contrato prendario.',
        auction_min_price: Number(data.auctionMinPrice) || 0
      })
      .eq('id', collateralId)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setVaultCollaterals(prev => prev.map(c => c.id === collateralId ? {
        ...c,
        custodyStatus: 'Adjudicado',
        adjudicationDate: today,
        adjudicationNotes: data.adjudicationNotes,
        auctionMinPrice: data.auctionMinPrice
      } : c));

      // Log movement
      await recordCustodyMovement({
        collateralId,
        movementType: 'Adjudicación',
        authorizedBy: currentUser.name || 'Gerencia Legal / Bóveda',
        receivedBy: 'Inventario de Adjudicados / Remates',
        reason: 'Paso a propiedad de la empresa por mora prolongada.',
        newCustodyStatus: 'Adjudicado'
      });

      addNotification({
        title: 'Garantía Adjudicada',
        message: `${target?.title || 'Artículo'} de ${target?.clientName} fue adjudicado formalmente y habilitado para remate.`,
        type: 'warning',
        link: '/boveda'
      });

      addToast('Garantía adjudicada y trasladada al catálogo de remates', 'success');
    } else {
      addToast(`Error al adjudicar garantía: ${error.message}`, 'error');
    }
  };

  // Liquidate / Auction Collateral (Sale)
  const liquidateAuctionCollateral = async (collateralId: string, data: {
    liquidationPrice: number;
    buyerName: string;
    buyerPhone?: string;
    paymentMethod: PaymentMethod;
    closeLoan?: boolean;
  }) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const target = vaultCollaterals.find(c => c.id === collateralId);
    if (!target) return;

    const saleAmount = Number(data.liquidationPrice);

    const { error } = await insforge.database
      .from('vault_collaterals')
      .update({
        custody_status: 'Rematado / Liquidado',
        liquidation_price: saleAmount,
        buyer_name: data.buyerName,
        buyer_phone: data.buyerPhone || null,
        liquidation_date: today,
        exit_date: today
      })
      .eq('id', collateralId)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setVaultCollaterals(prev => prev.map(c => c.id === collateralId ? {
        ...c,
        custodyStatus: 'Rematado / Liquidado',
        liquidationPrice: saleAmount,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        liquidationDate: today,
        exitDate: today
      } : c));

      // Log movement
      await recordCustodyMovement({
        collateralId,
        movementType: 'Remate / Liquidación',
        authorizedBy: currentUser.name || 'Gerencia',
        receivedBy: data.buyerName,
        reason: `Venta en remate por RD$ ${saleAmount.toLocaleString()} a ${data.buyerName}`,
        newCustodyStatus: 'Rematado / Liquidado'
      });

      // Automatic accounting registration
      await addTransaction({
        type: 'Ingreso',
        category: 'Capital',
        amount: saleAmount,
        date: today,
        description: `Liquidación / Remate de Garantía: ${target.title} (Cliente: ${target.clientName}) • Comprador: ${data.buyerName}`,
        paymentType: 'Capital',
        paymentMethod: data.paymentMethod
      });

      // If associated loan exists and closeLoan is selected, settle loan
      if (target.loanId) {
        const associatedLoan = loans.find(l => l.id === target.loanId);
        if (associatedLoan && data.closeLoan) {
          const newBal = Math.max(0, associatedLoan.remainingBalance - saleAmount);
          await updateLoan({
            ...associatedLoan,
            status: newBal === 0 ? 'Pagado' : associatedLoan.status,
            remainingBalance: newBal
          });
        }
      }

      addNotification({
        title: 'Garantía Rematada con Éxito',
        message: `Se vendió ${target.title} en remate por RD$ ${saleAmount.toLocaleString()} a ${data.buyerName}.`,
        type: 'success',
        link: '/boveda'
      });

      addToast(`Garantía liquidada en remate por RD$ ${saleAmount.toLocaleString()}`, 'success');
    } else {
      addToast(`Error al liquidar garantía: ${error.message}`, 'error');
    }
  };

  // Update Collateral Details
  const updateVaultCollateral = async (id: string, updates: Partial<VaultCollateral>) => {
    if (!currentUser) return;
    const dbUpdates: Partial<VaultCollateralDB> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.vaultLocation !== undefined) dbUpdates.vault_location = updates.vaultLocation;
    if (updates.drawerOrShelf !== undefined) dbUpdates.drawer_or_shelf = updates.drawerOrShelf || null;
    if (updates.sealNumber !== undefined) dbUpdates.seal_number = updates.sealNumber || null;
    if (updates.appraisedValue !== undefined) dbUpdates.appraised_value = updates.appraisedValue;
    if (updates.hasKeys !== undefined) dbUpdates.has_keys = updates.hasKeys;
    if (updates.keysCount !== undefined) dbUpdates.keys_count = updates.keysCount;
    if (updates.hasOriginalDocuments !== undefined) dbUpdates.has_original_documents = updates.hasOriginalDocuments;
    if (updates.documentsList !== undefined) dbUpdates.documents_list = updates.documentsList || null;

    const { error } = await insforge.database
      .from('vault_collaterals')
      .update(dbUpdates)
      .eq('id', id)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setVaultCollaterals(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      addToast('Información de bóveda actualizada', 'success');
    }
  };

  // Delete Collateral
  const deleteVaultCollateral = async (id: string) => {
    if (!currentUser) return;
    const { error } = await insforge.database
      .from('vault_collaterals')
      .delete()
      .eq('id', id)
      .eq('lender_id', currentUser.id);

    if (!error) {
      setVaultCollaterals(prev => prev.filter(c => c.id !== id));
      addToast('Registro de bóveda eliminado', 'info');
    }
  };

  return (
    <VaultContext.Provider value={{
      vaultCollaterals, custodyLogs, isLoadingVault,
      refreshVaultData, registerVaultCollateral, recordCustodyMovement,
      adjudicateCollateral, liquidateAuctionCollateral, updateVaultCollateral, deleteVaultCollateral
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used within a VaultProvider');
  return context;
};
