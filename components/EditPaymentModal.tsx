import React, { useState, useEffect } from 'react';
import { 
  X, Save, Trash2, Clock, Calendar, CreditCard, Banknote, AlertTriangle, 
  CheckCircle, FileText, Upload, RefreshCw, DollarSign, ShieldAlert 
} from 'lucide-react';
import { Transaction, PaymentMethod, Loan, formatReceiptId, formatLoanId } from '../types';
import { useAccounting, useLoans, useClients } from '../context/StoreContext';
import { CustomSelect } from './CustomSelect';
import { parseToLocalDateTimeInputs, combineDateAndTimeToISO, formatExactDateTime } from '../utils/dateUtils';
import { toast } from 'sonner';

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const { updateTransaction, deleteTransaction, bankAccounts } = useAccounting();
  const { loans } = useLoans();
  const { clients } = useClients();

  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentTime, setPaymentTime] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [paymentType, setPaymentType] = useState<Transaction['paymentType']>('Interes');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form when transaction opens
  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount || ''));
      const parsed = parseToLocalDateTimeInputs(transaction.date);
      setPaymentDate(parsed.date);
      setPaymentTime(parsed.time);
      setDescription(transaction.description || '');
      setPaymentMethod(transaction.paymentMethod || 'Efectivo');
      setPaymentType(transaction.paymentType || 'Interes');
      setBankAccountId(transaction.bankAccountId || '');
      setProofUrl(transaction.proofUrl || '');
      setShowDeleteConfirm(false);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const linkedLoan = transaction.referenceId 
    ? loans.find(l => 
        l.id === transaction.referenceId || 
        formatLoanId(l.id) === transaction.referenceId || 
        formatLoanId(l.id).replace(/\s+/g, '') === transaction.referenceId.replace(/\s+/g, '')
      ) 
    : undefined;
  const linkedClient = linkedLoan 
    ? clients.find(c => c.id === linkedLoan.clientId) 
    : (transaction.referenceId ? clients.find(c => c.id === transaction.referenceId) : undefined);
  const clientName = linkedClient 
    ? `${linkedClient.name} ${linkedClient.lastName || ''}`.trim() 
    : (linkedLoan ? (linkedLoan.clientName || linkedLoan.clientname || 'Cliente') : 'Cliente');

  const oldAmount = Number(transaction.amount) || 0;
  const newAmount = Number(amount) || 0;
  const amountDiff = newAmount - oldAmount;

  // Set current time helper
  const handleSetCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setPaymentTime(`${hours}:${minutes}`);
    toast.info(`Hora ajustada a la hora actual (${hours}:${minutes})`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Ingrese un monto válido mayor a 0');
      return;
    }
    if (!paymentDate) {
      toast.error('Seleccione una fecha de pago válida');
      return;
    }

    setIsSaving(true);
    try {
      const exactIsoDate = combineDateAndTimeToISO(paymentDate, paymentTime);

      await updateTransaction(transaction.id, {
        amount: Number(amount),
        date: exactIsoDate,
        description,
        paymentMethod,
        paymentType,
        bankAccountId: bankAccountId || undefined,
        proofUrl: proofUrl || undefined
      }, true);

      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar los cambios del pago');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction(transaction.id, true);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al anular el pago');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                  Editar Pago / Recibo
                </h3>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {formatReceiptId(transaction.id)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Modifica el monto, fecha y hora exacta, método de pago o anula la transacción.
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Linked Client and Loan Context Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente Asociado</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{clientName}</span>
            </div>
            {linkedLoan && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Préstamo</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  #{formatLoanId(linkedLoan.id, linkedLoan.loanCategory, linkedLoan.loanType)}
                </span>
              </div>
            )}
            {linkedLoan && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Pendiente Préstamo</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">
                  RD$ {(linkedLoan.remainingBalance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Amount & Impact Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Monto Pagado (RD$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 dark:text-indigo-400 text-lg">
                RD$
              </span>
              <input 
                type="number"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-3 bg-indigo-50/40 dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900 rounded-2xl text-xl font-black text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            {/* Live Balance Impact Indicator */}
            {amountDiff !== 0 && linkedLoan && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${amountDiff > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {amountDiff > 0 
                    ? `Al aumentar el pago en RD$ ${amountDiff.toLocaleString()}, el balance restante del préstamo disminuirá automáticamente a RD$ ${Math.max(0, linkedLoan.remainingBalance - amountDiff).toLocaleString()}.`
                    : `Al reducir el pago en RD$ ${Math.abs(amountDiff).toLocaleString()}, el balance restante del préstamo aumentará a RD$ ${(linkedLoan.remainingBalance + Math.abs(amountDiff)).toLocaleString()}.`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Exact Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Fecha del Pago
              </label>
              <input 
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Hora Exacta de Registro
                </label>
                <button
                  type="button"
                  onClick={handleSetCurrentTime}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Hora actual
                </button>
              </div>
              <input 
                type="time"
                step="1"
                value={paymentTime}
                onChange={e => setPaymentTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Payment Method & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Método de Pago
              </label>
              <CustomSelect 
                value={paymentMethod}
                onChange={val => setPaymentMethod(val as PaymentMethod)}
                className="w-full"
                options={[
                  { value: 'Efectivo', label: 'Efectivo en Caja' },
                  { value: 'Transferencia', label: 'Transferencia Bancaria' },
                  { value: 'Tarjeta', label: 'Tarjeta de Crédito / Débito' },
                  { value: 'Verifone / POS', label: 'Verifone / Terminal POS' },
                  { value: 'Cheque', label: 'Cheque' }
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tipo / Concepto de Aplicación
              </label>
              <CustomSelect 
                value={paymentType || 'Interes'}
                onChange={val => setPaymentType(val as Transaction['paymentType'])}
                className="w-full"
                options={[
                  { value: 'Interes', label: 'Cuota Regular / Intereses' },
                  { value: 'Capital', label: 'Abono Directo a Capital' },
                  { value: 'Mixto', label: 'Pago Mixto (Capital + Interés)' },
                  { value: 'Mora', label: 'Recargo de Mora' },
                  { value: 'Cierre', label: 'Gastos de Cierre / Formalización' },
                  { value: 'Otro', label: 'Otro Concepto' }
                ]}
              />
            </div>
          </div>

          {/* Bank Account Destination */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cuenta Bancaria o Caja Destino (Opcional)
            </label>
            <CustomSelect 
              value={bankAccountId}
              onChange={val => setBankAccountId(val)}
              className="w-full"
              options={[
                { value: '', label: '-- Caja General por Defecto --' },
                ...bankAccounts.map(b => ({
                  value: b.id,
                  label: `${b.bankName} - ${b.accountName} (Bal: RD$ ${(b.balance || 0).toLocaleString()})`
                }))
              ]}
            />
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Concepto / Detalle de la Transacción
            </label>
            <input 
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Cuota #3, Abono quincenal, etc."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Proof Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Comprobante / Voucher Adjunto
            </label>
            <input 
              type="file"
              accept="image/*,application/pdf"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setProofUrl(ev.target?.result as string);
                    toast.success('Comprobante cargado');
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {proofUrl && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Comprobante adjuntado
                </span>
                <button
                  type="button"
                  onClick={() => setProofUrl('')}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Quitar comprobante
                </button>
              </div>
            )}
          </div>

          {/* Delete Confirmation Warning Box */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>¿Estás seguro de anular y eliminar este pago?</span>
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-300">
                Esta acción eliminará el registro del recibo y restaurará automáticamente el monto de <strong>RD$ {oldAmount.toLocaleString()}</strong> a la deuda del préstamo #{formatLoanId(transaction.referenceId || '')}.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Anulando...' : 'Confirmar Anulación'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              {!showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Anular / Eliminar Pago
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold text-xs transition-colors"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
