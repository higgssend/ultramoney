import React from 'react';
import { Collateral } from '../../types';
import { Shield, Type, Hash, DollarSign, User, Image as ImageIcon, Smartphone, Cpu, CheckCircle } from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';

interface CollateralFormProps {
    collateral: Collateral | undefined;
    onChange: (collateral: Collateral | undefined) => void;
}

export const CollateralForm: React.FC<CollateralFormProps> = ({ collateral, onChange }) => {

    const handleTypeChange = (val: string) => {
        const type = val as Collateral['type'];
        if (type === 'Sin Garantía') {
            onChange(undefined);
        } else {
            onChange({ type, description: '', refNumber: '' });
        }
    };

    const handleChange = (field: keyof Collateral, value: any) => {
        if (!collateral) return;
        
        // Auto-update combined description for phone if brand/model change
        const updated = { ...collateral, [field]: value };
        if (updated.type === 'Teléfono / Celular') {
            const b = updated.brand || '';
            const m = updated.model || '';
            const storage = updated.storage ? ` (${updated.storage})` : '';
            const color = updated.color ? ` - Color: ${updated.color}` : '';
            if (b || m) {
                updated.description = `${b} ${m}${storage}${color}`.trim();
            }
        }
        onChange(updated);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Shield className="w-5 h-5" /></div>
                Garantía del Préstamo
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Garantía</label>
                    <CustomSelect 
                        value={collateral?.type || 'Sin Garantía'}
                        onChange={handleTypeChange}
                        className="w-full"
                        options={[
                            { value: 'Sin Garantía', label: 'Sin Garantía' },
                            { value: 'Teléfono / Celular', label: '📱 Teléfono / Celular / Dispositivo Móvil' },
                            { value: 'Vehículo', label: '🚗 Vehículo' },
                            { value: 'Propiedad', label: '🏠 Propiedad Inmobiliaria' },
                            { value: 'Electrodoméstico', label: '📺 Electrodoméstico / Equipo' },
                            { value: 'Joya', label: '💎 Joya / Objeto de Valor' },
                            { value: 'Otro', label: '📦 Otro bien en garantía' }
                        ]}
                    />
                </div>

                {collateral && collateral.type !== 'Sin Garantía' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-2">
                        
                        {/* 📱 TELÉFONO / CELULAR */}
                        {collateral.type === 'Teléfono / Celular' && (
                            <>
                                <div className="md:col-span-2 bg-indigo-50/60 border border-indigo-100 p-3 rounded-2xl flex items-center gap-2 text-indigo-900 text-xs font-semibold mb-1">
                                    <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span>Formulario Completo de Dispositivo Móvil (IMEI, Marca, Condición y Almacenamiento)</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Marca del Equipo</label>
                                    <CustomSelect
                                        value={collateral.brand || ''}
                                        onChange={(val) => handleChange('brand', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Apple', label: 'Apple (iPhone)' },
                                            { value: 'Samsung', label: 'Samsung' },
                                            { value: 'Xiaomi', label: 'Xiaomi / Redmi / Poco' },
                                            { value: 'Motorola', label: 'Motorola' },
                                            { value: 'Google', label: 'Google Pixel' },
                                            { value: 'Huawei', label: 'Huawei' },
                                            { value: 'Honor', label: 'Honor' },
                                            { value: 'ZTE', label: 'ZTE' },
                                            { value: 'Infinix', label: 'Infinix' },
                                            { value: 'Tecno', label: 'Tecno' },
                                            { value: 'Otra Marca', label: 'Otra Marca' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Modelo Específico</label>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.model || ''}
                                            onChange={(e) => handleChange('model', e.target.value)}
                                            placeholder="Ej. iPhone 15 Pro Max / S24 Ultra"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">IMEI / Serie Principal (IMEI 1)</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.refNumber || ''}
                                            onChange={(e) => handleChange('refNumber', e.target.value)}
                                            placeholder="Ej. 356789012345678"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">IMEI 2 (Opcional - Dual SIM)</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.imei2 || ''}
                                            onChange={(e) => handleChange('imei2', e.target.value)}
                                            placeholder="Ej. 356789012345679"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Estado del Equipo</label>
                                    <CustomSelect
                                        value={collateral.condition || 'Excelente / Como Nuevo'}
                                        onChange={(val) => handleChange('condition', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Excelente / Como Nuevo', label: '✨ Excelente / Como Nuevo' },
                                            { value: 'Bueno con uso normal', label: '👍 Bueno (Uso Normal)' },
                                            { value: 'Con detalles / Rayaduras', label: '⚠️ Con detalles cosméticos' },
                                            { value: 'Pantalla / Cristal Dañado', label: '🛠️ Pantalla / Cristal agrietado' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Almacenamiento</label>
                                    <CustomSelect
                                        value={collateral.storage || '128GB'}
                                        onChange={(val) => handleChange('storage', val)}
                                        className="w-full"
                                        options={[
                                            { value: '64GB', label: '64 GB' },
                                            { value: '128GB', label: '128 GB' },
                                            { value: '256GB', label: '256 GB' },
                                            { value: '512GB', label: '512 GB' },
                                            { value: '1TB', label: '1 TB' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Color del Equipo</label>
                                    <input 
                                        type="text"
                                        value={collateral.color || ''}
                                        onChange={(e) => handleChange('color', e.target.value)}
                                        placeholder="Ej. Titanium Negro / Plata"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Detalles / Defectos Cosméticos</label>
                                    <input 
                                        type="text"
                                        value={collateral.defects || ''}
                                        onChange={(e) => handleChange('defects', e.target.value)}
                                        placeholder="Ej. Sin cargador, Batería 84%, Tapa rayada"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </>
                        )}

                        {/* VEHÍCULO */}
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
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Matrícula / Placa / Chasis</label>
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
                        
                        {/* PROPIEDAD */}
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

                        {/* OTROS TIPOS DE GARANTÍA */}
                        {collateral.type !== 'Teléfono / Celular' && collateral.type !== 'Vehículo' && collateral.type !== 'Propiedad' && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Descripción del Artículo</label>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Ej. TV LG 65 Oled 4K / Anillo de Oro 18K"
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
                                            placeholder="Serie / Ref"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Valor Estimado (RD$)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                <input 
                                    type="number"
                                    value={collateral.estimatedValue || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleChange('estimatedValue', e.target.value === '' ? 0 : Number(e.target.value))}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
                                />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Propietario Legal (Si es de un tercero)</label>
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
                    </div>
                )}
            </div>
        </div>
    );
};
