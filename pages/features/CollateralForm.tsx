import React, { useState } from 'react';
import { Collateral } from '../../types';
import { Shield, Type, Hash, DollarSign, User, Image as ImageIcon, Smartphone, Cpu, CheckCircle, CreditCard, Package, Upload, X } from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';
import { useInventory } from '../../context/StoreContext';

interface CollateralFormProps {
    collateral: Collateral | undefined;
    onChange: (collateral: Collateral | undefined) => void;
}

export const CollateralForm: React.FC<CollateralFormProps> = ({ collateral, onChange }) => {
    const { inventory } = useInventory();
    const availableItems = inventory.filter(i => i.status === 'Disponible');
    const [selectedStockId, setSelectedStockId] = useState('');

    const handleTypeChange = (val: string) => {
        const type = val as Collateral['type'];
        if (type === 'Sin Garantía') {
            onChange(undefined);
        } else {
            onChange({ type, description: '', refNumber: '' });
        }
    };

    const handleStockSelect = (stockId: string) => {
        setSelectedStockId(stockId);
        if (!stockId) return;
        const item = availableItems.find(i => i.id === stockId);
        if (!item) return;

        const targetType = item.category === 'Teléfono / Celular' ? 'Teléfono / Celular' : 
                           item.category === 'Vehículo' ? 'Vehículo' :
                           item.category === 'Electrodoméstico' ? 'Electrodoméstico' : 'Otro';

        onChange({
            type: targetType as any,
            description: `${item.brand || ''} ${item.model || item.name}`.trim(),
            refNumber: item.serialNumber || '',
            brand: item.brand,
            model: item.model,
            imei2: item.imei2,
            condition: item.condition,
            color: item.color,
            storage: item.storage,
            estimatedValue: item.cashPrice
        });
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
        } else if (updated.type === 'Tarjeta de Crédito / Débito') {
            const b = updated.bankName || '';
            const c = updated.cardType || 'Tarjeta';
            const l4 = updated.last4 || updated.refNumber || '';
            updated.description = `${b} ${c} (Terminada en ${l4})`.trim();
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
                {/* Optional Stock Item Quick-Selector */}
                {availableItems.length > 0 && (
                    <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-2 mb-2">
                        <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-emerald-600" />
                            Cargar automáticamente desde el Stock / Inventario (Opcional)
                        </label>
                        <CustomSelect
                            value={selectedStockId}
                            onChange={handleStockSelect}
                            className="w-full text-xs font-medium"
                            options={[
                                { value: '', label: '-- Llenar Formulario Manualmente --' },
                                ...availableItems.map(item => ({
                                    value: item.id,
                                    label: `📦 ${item.name} (${item.brand || ''} ${item.model || ''}) - RD$ ${item.cashPrice.toLocaleString()} [${item.condition || 'Disponible'}]`
                                }))
                            ]}
                        />
                        <p className="text-[10px] text-emerald-700 font-medium">Seleccionar un ítem del stock autocompletará marca, modelo, IMEI/Serie, condición y precio.</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Garantía</label>
                    <CustomSelect 
                        value={collateral?.type || 'Sin Garantía'}
                        onChange={handleTypeChange}
                        className="w-full"
                        options={[
                            { value: 'Sin Garantía', label: 'Sin Garantía' },
                            { value: 'Teléfono / Celular', label: '📱 Teléfono / Celular / Dispositivo Móvil' },
                            { value: 'Tarjeta de Crédito / Débito', label: '💳 Tarjeta de Crédito / Débito en Custodia' },
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

                        {/* 💳 TARJETA DE CRÉDITO / DÉBITO */}
                        {collateral.type === 'Tarjeta de Crédito / Débito' && (
                            <>
                                <div className="md:col-span-2 bg-blue-50/70 border border-blue-100 p-3 rounded-2xl flex items-center gap-2 text-blue-900 text-xs font-semibold mb-1">
                                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Registro de Tarjeta en Custodia (Banco, Marca, Últimos 4 dígitos y Vencimiento)</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Banco Emisor</label>
                                    <CustomSelect
                                        value={collateral.bankName || ''}
                                        onChange={(val) => handleChange('bankName', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Banreservas', label: 'Banreservas' },
                                            { value: 'Banco Popular', label: 'Banco Popular Dominicano' },
                                            { value: 'Banco BHD', label: 'Banco BHD' },
                                            { value: 'Scotiabank', label: 'Scotiabank' },
                                            { value: 'APAP', label: 'Asociación Popular (APAP)' },
                                            { value: 'Banco Santa Cruz', label: 'Banco Santa Cruz' },
                                            { value: 'Banco Caribe', label: 'Banco Caribe' },
                                            { value: 'Banco Promerica', label: 'Banco Promerica' },
                                            { value: 'Otro Banco', label: 'Otro Banco / Entidad' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Tarjeta</label>
                                    <CustomSelect
                                        value={collateral.cardType || 'Visa'}
                                        onChange={(val) => handleChange('cardType', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Visa Crédito', label: '💳 Visa Crédito' },
                                            { value: 'Visa Débito', label: '💳 Visa Débito / Nómina' },
                                            { value: 'Mastercard Crédito', label: '💳 Mastercard Crédito' },
                                            { value: 'Mastercard Débito', label: '💳 Mastercard Débito' },
                                            { value: 'American Express', label: '💳 American Express' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Últimos 4 Dígitos de la Tarjeta</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            maxLength={4}
                                            value={collateral.last4 || collateral.refNumber || ''}
                                            onChange={(e) => {
                                                handleChange('last4', e.target.value);
                                                handleChange('refNumber', e.target.value);
                                            }}
                                            placeholder="Ej. 4589"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold font-mono tracking-wider text-base"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Vencimiento (MM/AA)</label>
                                    <input 
                                        type="text"
                                        maxLength={5}
                                        value={collateral.expiryDate || ''}
                                        onChange={(e) => handleChange('expiryDate', e.target.value)}
                                        placeholder="Ej. 08/28"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre Impreso en la Tarjeta</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.cardHolder || collateral.ownerName || ''}
                                            onChange={(e) => {
                                                handleChange('cardHolder', e.target.value);
                                                handleChange('ownerName', e.target.value);
                                            }}
                                            placeholder="Ej. JUAN A. PEREZ (Como figura en la tarjeta)"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium uppercase text-sm"
                                        />
                                    </div>
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

                        {/* FOTOS Y DOCUMENTACIÓN ADJUNTA DE LA GARANTÍA */}
                        <div className="md:col-span-2 space-y-2 border-t border-slate-100 pt-4 mt-2">
                            <label className="block text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4 text-indigo-600" />
                                Fotos y Documentación de la Garantía
                            </label>
                            
                            <div className="flex flex-wrap gap-3 items-center pt-1">
                                {(collateral.photoUrls || []).map((url, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                                        {url.startsWith('data:image') || url.match(/\.(jpg|jpeg|png|webp)/i) || !url.includes('.pdf') ? (
                                            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">PDF</div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = (collateral.photoUrls || []).filter((_, idx) => idx !== i);
                                                handleChange('photoUrls', next);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                            title="Eliminar foto"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                <label className="w-20 h-20 border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-105">
                                    <Upload className="w-5 h-5 text-indigo-600 mb-1" />
                                    <span className="text-[10px] font-bold text-indigo-700">+ Adjuntar</span>
                                    <input 
                                        type="file" 
                                        accept="image/*,.pdf" 
                                        multiple 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            files.forEach(file => {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    const res = reader.result as string;
                                                    const existing = collateral.photoUrls || [];
                                                    handleChange('photoUrls', [...existing, res]);
                                                };
                                                reader.readAsDataURL(file);
                                            });
                                        }}
                                    />
                                </label>
                            </div>
                            <p className="text-[11px] text-slate-400">Toma o adjunta fotos del artículo, matrícula, serial, estado del equipo, tarjeta o documentos legales de la garantía.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
