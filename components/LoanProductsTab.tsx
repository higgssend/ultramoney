import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Edit2, Trash2, Check, X, ShieldAlert, CheckCircle } from 'lucide-react';
import { LoanProduct } from '../types';

export const LoanProductsTab: React.FC = () => {
    const { loanProducts, addLoanProduct, updateLoanProduct, deleteLoanProduct } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<LoanProduct> | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct?.id) {
            await updateLoanProduct(editingProduct.id, editingProduct);
        } else {
            await addLoanProduct(editingProduct as Omit<LoanProduct, 'id' | 'createdAt' | 'updatedAt'>);
        }
        setIsEditing(false);
        setEditingProduct(null);
    };

    const startEdit = (product: LoanProduct) => {
        setEditingProduct(product);
        setIsEditing(true);
    };

    const startNew = () => {
        setEditingProduct({
            name: '', description: '',
            minAmount: 1000, maxAmount: 1000000,
            interestRate: 5, interestType: 'Simple',
            frequency: 'Mensual', termMonths: 12, defaultInstallments: 12,
            requiresCollateral: false, collateralType: '',
            disbursementFee: 0, lateFeePercentage: 0, graceDays: 0,
            prepaymentAllowed: true, autoCalculateInterest: true,
            isActive: true
        });
        setIsEditing(true);
    };

    if (isEditing && editingProduct) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">{editingProduct.id ? 'Editar' : 'Nuevo'} Producto de Préstamo</h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nombre del Préstamo</label>
                            <input type="text" required value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Descripción</label>
                            <input type="text" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Monto Mínimo</label>
                            <input type="number" required value={editingProduct.minAmount || 0} onChange={e => setEditingProduct({...editingProduct, minAmount: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Monto Máximo</label>
                            <input type="number" required value={editingProduct.maxAmount || 0} onChange={e => setEditingProduct({...editingProduct, maxAmount: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Tasa de Interés (%)</label>
                            <input type="number" step="0.1" required value={editingProduct.interestRate || 0} onChange={e => setEditingProduct({...editingProduct, interestRate: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Tipo de Interés</label>
                            <select value={editingProduct.interestType} onChange={e => setEditingProduct({...editingProduct, interestType: e.target.value as any})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3">
                                <option value="Fijo">Fijo</option>
                                <option value="Simple">Simple</option>
                                <option value="Compuesto">Compuesto</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Frecuencia</label>
                            <select value={editingProduct.frequency} onChange={e => setEditingProduct({...editingProduct, frequency: e.target.value as any})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3">
                                <option value="Diario">Diario</option>
                                <option value="Semanal">Semanal</option>
                                <option value="Quincenal">Quincenal</option>
                                <option value="Mensual">Mensual</option>
                                <option value="Anual">Anual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Número de Cuotas por Defecto</label>
                            <input type="number" required value={editingProduct.defaultInstallments || 0} onChange={e => setEditingProduct({...editingProduct, defaultInstallments: parseInt(e.target.value)})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                        </div>
                        <div className="flex items-center gap-3 mt-8">
                            <input type="checkbox" checked={editingProduct.requiresCollateral || false} onChange={e => setEditingProduct({...editingProduct, requiresCollateral: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                            <label className="text-sm font-medium text-slate-700">Requiere Garantía</label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Penalidad por Mora (%)</label>
                            <input type="number" step="0.1" value={editingProduct.lateFeePercentage || 0} onChange={e => setEditingProduct({...editingProduct, lateFeePercentage: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Comisión de Desembolso (Fijo/%)</label>
                            <input type="number" step="0.1" value={editingProduct.disbursementFee || 0} onChange={e => setEditingProduct({...editingProduct, disbursementFee: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Días de Gracia</label>
                            <input type="number" value={editingProduct.graceDays || 0} onChange={e => setEditingProduct({...editingProduct, graceDays: parseInt(e.target.value)})} className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" />
                        </div>
                        <div className="flex items-center gap-3 mt-8">
                            <input type="checkbox" checked={editingProduct.prepaymentAllowed !== false} onChange={e => setEditingProduct({...editingProduct, prepaymentAllowed: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                            <label className="text-sm font-medium text-slate-700">Pago Anticipado Permitido</label>
                        </div>
                        <div className="flex items-center gap-3 mt-8">
                            <input type="checkbox" checked={editingProduct.isActive !== false} onChange={e => setEditingProduct({...editingProduct, isActive: e.target.checked})} className="w-5 h-5 text-emerald-600 rounded" />
                            <label className="text-sm font-medium text-slate-700">Producto Activo</label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">Guardar Producto</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Productos de Préstamo</h3>
                    <p className="text-sm text-slate-500">Configura las plantillas para tipos de préstamos que ofreces.</p>
                </div>
                <button onClick={startNew} className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nuevo Producto
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {(loanProducts || []).map(product => (
                    <div key={product.id} className={`bg-white rounded-2xl shadow-sm border ${product.isActive ? 'border-indigo-100' : 'border-slate-200'} p-6 relative`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    {product.name}
                                    {product.isActive ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <ShieldAlert className="w-4 h-4 text-slate-400" />}
                                </h4>
                                <p className="text-sm text-slate-500">{product.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(product)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => deleteLoanProduct(product.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Montos</span><span className="font-medium text-slate-800">${product.minAmount} - ${product.maxAmount}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Tasa</span><span className="font-medium text-slate-800">{product.interestRate}% ({product.interestType})</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Frecuencia</span><span className="font-medium text-slate-800">{product.frequency}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Plazo Defecto</span><span className="font-medium text-slate-800">{product.defaultInstallments} cuotas</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Mora</span><span className="font-medium text-slate-800">{product.lateFeePercentage}% ({product.graceDays} días gracia)</span></div>
                        </div>
                    </div>
                ))}
                {(!loanProducts || loanProducts.length === 0) && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        No hay productos de préstamo configurados.
                    </div>
                )}
            </div>
        </div>
    );
};
