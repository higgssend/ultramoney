import React, { useState } from 'react';
import { Landmark, Plus, X, Wallet, CheckCircle, CreditCard, DollarSign, Trash2, Edit3, ShieldCheck } from 'lucide-react';
import { useAccounting } from '../context/StoreContext';
import { BankAccount } from '../types';
import { toast } from 'sonner';

interface BankAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOMINICAN_BANKS = [
  'Banco de Reservas (Banreservas)',
  'Banco Popular Dominicano',
  'Banco BHD',
  'Scotiabank República Dominicana',
  'Banco Santa Cruz',
  'Banco Promerica',
  'Banco Caribe',
  'Banco BDI',
  'Banco Vimenca',
  'Qik Banco Digital',
  'Asociación Popular de Ahorros y Préstamos (APAP)',
  'Asociación Cibao de Ahorros y Préstamos',
  'Caja Chica / Efectivo Principal',
  'Otro Banco / Entidad'
];

export const BankAccountsModal: React.FC<BankAccountsModalProps> = ({ isOpen, onClose }) => {
  const { bankAccounts, addBankAccount, removeBankAccount, updateBankAccount } = useAccounting();

  const [isAdding, setIsAdding] = useState(false);
  const [bankName, setBankName] = useState(DOMINICAN_BANKS[0]);
  const [customBankName, setCustomBankName] = useState('');
  const [accountType, setAccountType] = useState<'Ahorros' | 'Corriente' | 'Caja Chica / Efectivo'>('Corriente');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [currency, setCurrency] = useState<'DOP' | 'USD'>('DOP');
  const [balance, setBalance] = useState<number>(0);

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editBalanceVal, setEditBalanceVal] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBankName = bankName === 'Otro Banco / Entidad' ? (customBankName.trim() || 'Banco Personalizado') : bankName;

    if (!accountName.trim()) {
      toast.error('Ingrese el nombre o titular de la cuenta/caja');
      return;
    }

    const newAccount: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: finalBankName,
      accountType,
      accountNumber: accountNumber.trim() || 'S/N',
      accountName: accountName.trim(),
      currency,
      balance: balance || 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    addBankAccount(newAccount);
    setIsAdding(false);
    setAccountNumber('');
    setAccountName('');
    setBalance(0);
  };

  const handleSaveEditBalance = (id: string) => {
    updateBankAccount(id, { balance: editBalanceVal });
    setEditingAccountId(null);
  };

  const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-2xl border border-indigo-400/30">
              <Landmark className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black">Cuentas Bancarias y Cajas</h2>
              <p className="text-xs text-indigo-200">Gestión de bancos dominicanos y cajas chicas de recaudación.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Summary Total Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Balance Total en Bancos y Cajas</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                RD$ {totalBankBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
            >
              {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isAdding ? 'Cancelar' : 'Nueva Cuenta / Caja'}
            </button>
          </div>

          {/* Add Form */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-600" /> Configurar Cuenta o Caja
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Banco / Entidad</label>
                  <select 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  >
                    {DOMINICAN_BANKS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {bankName === 'Otro Banco / Entidad' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Entidad</label>
                    <input 
                      type="text"
                      placeholder="Ej: Qik Banco / Cooperativa"
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Cuenta</label>
                  <select 
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Corriente">Cuenta Corriente</option>
                    <option value="Ahorros">Cuenta de Ahorros</option>
                    <option value="Caja Chica / Efectivo">Caja Chica / Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Número de Cuenta</label>
                  <input 
                    type="text"
                    placeholder="Ej: 960-123456-7"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Titular / Nombre de Cuenta</label>
                  <input 
                    type="text"
                    placeholder="Ej: UltraMoney SRL / Cobranzas"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Balance Inicial ($)</label>
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={balance === 0 ? '' : balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          )}

          {/* Accounts List */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Cuentas Registradas</h3>
            
            {bankAccounts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Landmark className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">No hay cuentas bancarias registradas aún.</p>
              </div>
            ) : (
              bankAccounts.map((acc) => (
                <div key={acc.id} className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-2xl">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{acc.bankName}</h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {acc.accountType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Titular: <strong className="text-slate-700 dark:text-slate-300">{acc.accountName}</strong> | No. {acc.accountNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {editingAccountId === acc.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={editBalanceVal}
                          onChange={(e) => setEditBalanceVal(Number(e.target.value))}
                          className="w-28 px-2 py-1 bg-white dark:bg-slate-900 border border-indigo-400 rounded-lg text-xs font-bold"
                        />
                        <button 
                          onClick={() => handleSaveEditBalance(acc.id)}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase">Balance Disponible</p>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          RD$ {(acc.balance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => { setEditingAccountId(acc.id); setEditBalanceVal(acc.balance); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Ajustar balance"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => removeBankAccount(acc.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};
