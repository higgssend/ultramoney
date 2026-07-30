import React from 'react';
import { Collateral } from '../../types';
import { Shield, Type, Hash, DollarSign, Upload, User, Image as ImageIcon } from 'lucide-react';

interface CollateralFormProps {
    collateral: Collateral | undefined;
    onChange: (collateral: Collateral | undefined) => void;
}

export const CollateralForm: React.FC<CollateralFormProps> = ({ collateral, onChange }) => {

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as Collateral['type'];
        if (type === 'Sin Garantía') {
            onChange(undefined);
        } else {
            onChange({ type, description: '', refNumber: '' });
        }
    };

    const handleChange = (field: keyof Collateral, value: any) => {
        if (!collateral) return;
        onChange({ ...collateral, [field]: value });
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Shield className="w-5 h-5" /></div>
                Garantía del Préstamo
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Garantía</label>
                    <select 
                        value={collateral?.type || 'Sin Garantía'}
                        onChange={handleTypeChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Sin Garantía">Sin Garantía</option>
                        <option value="Vehículo">Vehículo</option>
                        <option value="Propiedad">Propiedad</option>
                        <option value="Electrodoméstico">Electrodoméstico</option>
                        <option value="Joya">Joya</option>
                    </select>
                </div>

                {collateral && collateral.type !== 'Sin Garantía' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-2">
                        {collateral.type === 'Vehículo' && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Marca / Modelo / Año</label>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Ej. Toyota Corolla 2020 Gris"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Matrícula / Placa</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.refNumber}
                                            onChange={(e) => handleChange('refNumber', e.target.value)}
                                            placeholder="Ej. A-123456"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {collateral.type === 'Propiedad' && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Dirección de la Propiedad</label>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Ej. Av. Principal #123, Sector"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Número de Título / Parcela</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.refNumber}
                                            onChange={(e) => handleChange('refNumber', e.target.value)}
                                            placeholder="Referencia"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {(collateral.type === 'Electrodoméstico' || collateral.type === 'Joya') && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Descripción del Artículo</label>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Ej. Nevera Samsung 2 Puertas Gris"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Número de Serie (Opcional)</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.refNumber}
                                            onChange={(e) => handleChange('refNumber', e.target.value)}
                                            placeholder="Serie"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </>
                        )}



                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Valor Estimado (Opcional)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                <input 
                                    type="number"
                                    value={collateral.estimatedValue || ''}
                                    onChange={(e) => handleChange('estimatedValue', Number(e.target.value))}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Propietario Legal (Si es tercero)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                <input 
                                    type="text"
                                    value={collateral.ownerName || ''}
                                    onChange={(e) => handleChange('ownerName', e.target.value)}
                                    placeholder="Dejar en blanco si es el mismo cliente"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2 mt-2">
                            <label className="cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                                <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                                <span className="font-bold text-sm">Adjuntar Documento / Foto</span>
                                <span className="text-xs">Formatos soportados: JPG, PNG, PDF</span>
                                <input type="file" className="hidden" accept="image/*,.pdf" />
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
