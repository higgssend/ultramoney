import React, { useState } from 'react';
import { 
  Landmark, Plus, Wallet, CheckCircle, CreditCard, 
  DollarSign, Trash2, Edit3, ShieldCheck, ArrowUpRight, ArrowDownLeft, Building2 
} from 'lucide-react';
import { useAccounting } from '../context/StoreContext';
import { BankAccount } from '../types';
import { toast } from 'sonner';

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
  'Caja Principal / Efectivo',
  'Otro Banco / Entidad'
];

export const BankAccountsPage: React.FC = () => {
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
    toast.success(`Cuenta "${accountName}" agregada con éxito`);
    setIsAdding(false);
    setAccountNumber('');
    setAccountName('');
    setBalance(0);
  };

  const handleSaveEditBalance = (id: string) => {
    updateBankAccount(id, { balance: editBalanceVal });
    toast.success('Balance de la cuenta actualizado');
    setEditingAccountId(null);
  };

  const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-extrabold uppercase border border-indigo-400/30">
            Módulo Financiero
          </span>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400" /> Cuentas Bancarias & Métodos de Pago
          </h1>
          <p className="text-sm text-indigo-200/80 max-w-xl">
            Gestiona tus cuentas bancarias, cajas de cobros en efectivo y métodos de pago oficiales para recibir cuotas y desembolsar créditos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right">
            <span className="text-xs text-indigo-200 block font-medium">Balance Total Consolidado</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              RD$ {totalBankBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" /> + Añadir Cuenta Bancaria
          </button>
        </div>
      </div>

      {/* Add Account Modal Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border-2 border-indigo-500 dark:border-indigo-600 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-600" /> Crear Nueva Cuenta Bancaria o Caja
            </h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Banco / Entidad Financiera</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
              >
                {DOMINICAN_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {bankName === 'Otro Banco / Entidad' && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Banco Personalizado</label>
                <input
                  type="text"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  placeholder="Ej: Banco Lafise"
                  className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nombre o Titular de la Cuenta</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Ej. UltraMoney SRL - Cuenta Principal"
                className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Cuenta</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
              >
                <option value="Corriente">Cuenta Corriente</option>
                <option value="Ahorros">Cuenta de Ahorros</option>
                <option value="Caja Chica / Efectivo">Caja Chica / Efectivo</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Número de Cuenta</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Ej. 960-123456-7"
                className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Balance Inicial (RD$)</label>
              <input
                type="number"
                value={balance === 0 ? '' : balance}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setBalance(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0.00"
                className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">Recomendado: Ingresa el balance real actual con el que inicia esta cuenta.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-extrabold text-xs hover:bg-indigo-700 shadow-md"
            >
              Guardar Cuenta
            </button>
          </div>
        </form>
      )}

      {/* Cuentas Registradas Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" /> Cuentas & Cajas Disponibles ({bankAccounts.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bankAccounts.map((account) => {
            const isCash = account.accountType === 'Caja Chica / Efectivo';
            return (
              <div
                key={account.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border ${
                        isCash 
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200' 
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border-indigo-200'
                      }`}>
                        {isCash ? <Wallet className="w-6 h-6" /> : <Landmark className="w-6 h-6" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {account.accountType}
                        </span>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base mt-1 line-clamp-1">
                          {account.bankName}
                        </h4>
                      </div>
                    </div>

                    {!account.isDefault && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la cuenta ${account.accountName}?`)) {
                            removeBankAccount(account.id);
                            toast.success('Cuenta eliminada');
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Titular / Nombre:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{account.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">No. Cuenta:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{account.accountNumber}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Balance Disponible</span>
                      {editingAccountId === account.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            value={editBalanceVal}
                            onChange={(e) => setEditBalanceVal(Number(e.target.value))}
                            className="w-28 p-1 border rounded-lg text-xs font-bold font-mono"
                          />
                          <button
                            onClick={() => handleSaveEditBalance(account.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Guardar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          RD$ {(account.balance || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>

                    {editingAccountId !== account.id && (
                      <button
                        onClick={() => {
                          setEditingAccountId(account.id);
                          setEditBalanceVal(account.balance || 0);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                        title="Ajustar balance manual"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Métodos de Pago Habilitados */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 space-y-6 shadow-sm">
        <div>
          <h3 className="font-extrabold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" /> Métodos de Pago Habilitados para Cobros y Desembolsos
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Los cobradores y administradores pueden recibir pagos o desembolsar préstamos a través de estos métodos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Efectivo', desc: 'Caja chica y cobro presencial en mano', badge: 'Recomendado', color: 'emerald' },
            { name: 'Transferencia Bancaria', desc: 'Banreservas, Popular, BHD, Scotiabank, Qik', badge: 'Bancario', color: 'indigo' },
            { name: 'Tarjeta de Crédito / Débito', desc: 'Voucher o pasarela POS', badge: 'Digital', color: 'purple' },
            { name: 'Cheque', desc: 'Cheques de gerencia o comerciales', badge: 'Documento', color: 'amber' },
          ].map((m, idx) => (
            <div key={idx} className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-700/40 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">{m.name}</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-600/60">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Activo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BankAccountsPage;
