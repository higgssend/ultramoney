import React, { useState } from 'react';
import { Collateral } from '../../types';
import { Shield, Type, Hash, DollarSign, User, Image as ImageIcon, Smartphone, Cpu, CheckCircle, CreditCard, Package, Upload, X, Laptop, Monitor, HardDrive, BatteryCharging, Tablet, Wifi } from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';
import { useInventory } from '../../context/StoreContext';

interface CollateralFormProps {
    collateral: Collateral | undefined;
    onChange: (collateral: Collateral | undefined) => void;
    isFinancing?: boolean;
}

export const CollateralForm: React.FC<CollateralFormProps> = ({ collateral, onChange, isFinancing }) => {
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

        const targetType: Collateral['type'] = 
            item.category === 'Teléfono / Celular' ? 'Teléfono / Celular' : 
            item.category === 'Tablets / iPads' ? 'Tablets / iPads' :
            item.category === 'Laptops / Portátiles' ? 'Laptops / Portátiles' :
            item.category === 'PC / Computadoras de Escritorio' ? 'PC / Computadoras de Escritorio' :
            item.category === 'Vehículo' ? 'Vehículo' :
            item.category === 'Electrodoméstico' ? 'Electrodoméstico' : 'Otro';

        onChange({
            type: targetType,
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

    const handleChange = <K extends keyof Collateral>(field: K, value: Collateral[K]) => {
        if (!collateral) return;
        
        // Auto-update combined description for phone, tablet, laptop, pc
        const updated = { ...collateral, [field]: value };
        if (updated.type === 'Teléfono / Celular') {
            const b = updated.brand || '';
            const m = updated.model || '';
            const storage = updated.storage ? ` (${updated.storage})` : '';
            const color = updated.color ? ` - Color: ${updated.color}` : '';
            if (b || m) {
                updated.description = `${b} ${m}${storage}${color}`.trim();
            }
        } else if (updated.type === 'Tablets / iPads') {
            const b = updated.brand || '';
            const m = updated.model || '';
            const storage = updated.storage ? ` (${updated.storage})` : '';
            const conn = updated.connectivity ? ` - ${updated.connectivity}` : '';
            const color = updated.color ? ` - Color: ${updated.color}` : '';
            const serial = updated.serialNumber || updated.refNumber ? ` [S/N: ${updated.serialNumber || updated.refNumber}]` : '';
            if (b || m) {
                updated.description = `${b} ${m}${storage}${conn}${color}${serial}`.trim();
            }
        } else if (updated.type === 'Laptops / Portátiles' || updated.type === 'PC / Computadoras de Escritorio') {
            const b = updated.brand || '';
            const m = updated.model || '';
            const cpu = updated.processor ? ` | CPU: ${updated.processor}` : '';
            const ram = updated.ram ? ` | RAM: ${updated.ram}` : '';
            const storage = updated.storage || updated.storageType ? ` | Disco: ${updated.storage || updated.storageType}` : '';
            const gpu = updated.graphicsCard ? ` | GPU: ${updated.graphicsCard}` : '';
            const serial = updated.serialNumber || updated.refNumber ? ` (S/N: ${updated.serialNumber || updated.refNumber})` : '';
            if (b || m) {
                updated.description = `${b} ${m}${cpu}${ram}${storage}${gpu}${serial}`.trim();
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
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isFinancing ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {isFinancing ? <Package className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        </div>
                        {isFinancing ? 'Bien / Producto Financiado (Reserva de Dominio)' : 'Garantía del Préstamo'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {isFinancing 
                            ? 'Selecciona un producto del stock de tu tienda o especifica el equipo / vehículo a financiar.'
                            : 'Especifica la garantía entregada por el cliente como respaldo en custodia.'}
                    </p>
                </div>
                {isFinancing && (
                    <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Financiamiento
                    </span>
                )}
            </div>

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
                                    label: `${item.name} (${item.brand || ''} ${item.model || ''}) - RD$ ${item.cashPrice.toLocaleString()} [${item.condition || 'Disponible'}]`
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
                            { value: 'Teléfono / Celular', label: 'Teléfono / Celular / Dispositivo Móvil' },
                            { value: 'Tablets / iPads', label: 'Tablets / iPads / Dispositivos Tablet' },
                            { value: 'Laptops / Portátiles', label: 'Laptops / Computadoras Portátiles' },
                            { value: 'PC / Computadoras de Escritorio', label: 'PC / Computadoras de Escritorio / Servidores' },
                            { value: 'Tarjeta de Crédito / Débito', label: 'Tarjeta de Crédito / Débito en Custodia' },
                            { value: 'Vehículo', label: 'Vehículo / Auto / Pasola' },
                            { value: 'Propiedad', label: 'Propiedad Inmobiliaria / Terreno' },
                            { value: 'Electrodoméstico', label: 'Electrodoméstico / Equipo' },
                            { value: 'Joya', label: 'Joya / Objeto de Valor' },
                            { value: 'Otro', label: 'Otro bien en garantía' }
                        ]}
                    />
                </div>

                {collateral && collateral.type !== 'Sin Garantía' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-2">
                        
                        {/* TELÉFONO / CELULAR */}
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
                                            { value: 'Excelente / Como Nuevo', label: 'Excelente / Como Nuevo (Grado A+)' },
                                            { value: 'Bueno con uso normal', label: 'Bueno (Uso Normal)' },
                                            { value: 'Con detalles / Rayaduras', label: 'Con detalles cosméticos' },
                                            { value: 'Pantalla / Cristal Dañado', label: 'Pantalla / Cristal agrietado' }
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

                        {/* TABLETS / IPADS */}
                        {collateral.type === 'Tablets / iPads' && (
                            <>
                                <div className="md:col-span-2 bg-purple-50/70 border border-purple-200 p-3 rounded-2xl flex items-center gap-2 text-purple-950 text-xs font-semibold mb-1">
                                    <Tablet className="w-4 h-4 text-purple-600 shrink-0" />
                                    <span>Formulario Especializado de Tablets / iPads (Marca, Modelo, Conectividad, Serial, Pantalla y Accesorios)</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Marca de la Tablet</label>
                                    <CustomSelect
                                        value={collateral.brand || ''}
                                        onChange={(val) => handleChange('brand', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Apple', label: 'Apple (iPad Pro / Air / Mini / Clásico)' },
                                            { value: 'Samsung', label: 'Samsung (Galaxy Tab S / Tab A)' },
                                            { value: 'Xiaomi', label: 'Xiaomi (Pad / Redmi Pad)' },
                                            { value: 'Lenovo', label: 'Lenovo (Tab P11 / Tab M10)' },
                                            { value: 'Amazon', label: 'Amazon (Fire HD 10 / 8 / 7)' },
                                            { value: 'Huawei', label: 'Huawei (MatePad)' },
                                            { value: 'Microsoft', label: 'Microsoft (Surface Pro / Go)' },
                                            { value: 'Otra Marca', label: 'Otra Marca de Tablet' }
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
                                            placeholder="Ej. iPad Pro 11 M4 / Galaxy Tab S9 FE"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Conectividad de Red</label>
                                    <CustomSelect
                                        value={collateral.connectivity || 'Wi-Fi Only'}
                                        onChange={(val) => handleChange('connectivity', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Wi-Fi Only', label: 'Solo Wi-Fi' },
                                            { value: 'Wi-Fi + Celular (LTE / 5G)', label: 'Wi-Fi + Celular / SIM / 5G' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Número de Serie / IMEI</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.refNumber || ''}
                                            onChange={(e) => {
                                                handleChange('refNumber', e.target.value);
                                                handleChange('serialNumber', e.target.value);
                                            }}
                                            placeholder="Ej. DMPT21XX89 / 356789..."
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-bold font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Capacidad de Almacenamiento</label>
                                    <CustomSelect
                                        value={collateral.storage || '128GB'}
                                        onChange={(val) => handleChange('storage', val)}
                                        className="w-full"
                                        options={[
                                            { value: '32GB', label: '32 GB' },
                                            { value: '64GB', label: '64 GB' },
                                            { value: '128GB', label: '128 GB' },
                                            { value: '256GB', label: '256 GB' },
                                            { value: '512GB', label: '512 GB' },
                                            { value: '1TB', label: '1 TB' },
                                            { value: '2TB', label: '2 TB' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tamaño de Pantalla</label>
                                    <CustomSelect
                                        value={collateral.screenSize || '11.0"'}
                                        onChange={(val) => handleChange('screenSize', val)}
                                        className="w-full"
                                        options={[
                                            { value: '8.3" - 8.7" (Compacta/Mini)', label: '8.3" - 8.7" (Mini / Compacta)' },
                                            { value: '10.2" - 10.9" (Estándar)', label: '10.2" - 10.9" (Estándar / Air)' },
                                            { value: '11.0" (Pro)', label: '11.0" (Pro)' },
                                            { value: '12.4" - 13.0" (Grande)', label: '12.4" - 13.0" (Max / Ultra)' },
                                            { value: '14.6" (Extra Grande)', label: '14.6" (Ultra Tab)' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Estado / Condición</label>
                                    <CustomSelect
                                        value={collateral.condition || 'Excelente / Como Nuevo'}
                                        onChange={(val) => handleChange('condition', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Nuevo Sellado en Caja', label: 'Nuevo Sellado en Caja' },
                                            { value: 'Excelente / Como Nuevo', label: 'Excelente / Como Nuevo (Grado A+)' },
                                            { value: 'Bueno con uso normal', label: 'Bueno (Uso Normal)' },
                                            { value: 'Con detalles cosméticos', label: 'Con detalles cosméticos / rayaduras' },
                                            { value: 'Pantalla / Cristal con detalles', label: 'Pantalla / Cristal con fisura' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Salud de Batería (%)</label>
                                    <input 
                                        type="text"
                                        value={collateral.batteryHealth || ''}
                                        onChange={(e) => handleChange('batteryHealth', e.target.value)}
                                        placeholder="Ej. 100%, 94%"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Color</label>
                                    <input 
                                        type="text"
                                        value={collateral.color || ''}
                                        onChange={(e) => handleChange('color', e.target.value)}
                                        placeholder="Ej. Space Gray, Silver, Starlight"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Sistema Operativo</label>
                                    <CustomSelect
                                        value={collateral.operatingSystem || 'iPadOS'}
                                        onChange={(val) => handleChange('operatingSystem', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'iPadOS', label: 'Apple iPadOS' },
                                            { value: 'Android', label: 'Google Android' },
                                            { value: 'Windows 11', label: 'Microsoft Windows 11' },
                                            { value: 'FireOS', label: 'Amazon Fire OS' }
                                        ]}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Accesorios Incluidos</label>
                                    <input 
                                        type="text"
                                        value={collateral.accessories || ''}
                                        onChange={(e) => handleChange('accessories', e.target.value)}
                                        placeholder="Ej. Apple Pencil 2da Gen, Magic Keyboard con Trackpad, Cargador 20W USB-C, Cover"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Detalles / Defectos Cosméticos</label>
                                    <input 
                                        type="text"
                                        value={collateral.defects || ''}
                                        onChange={(e) => handleChange('defects', e.target.value)}
                                        placeholder="Ej. Leves marcas de uso en los bordes, cristal impecable"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>
                            </>
                        )}

                        {/* 💻 LAPTOPS / PORTÁTILES */}
                        {collateral.type === 'Laptops / Portátiles' && (
                            <>
                                <div className="md:col-span-2 bg-blue-50/70 border border-blue-200 p-3 rounded-2xl flex items-center gap-2 text-blue-950 text-xs font-semibold mb-1">
                                    <Laptop className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Formulario Especializado de Laptops / Portátiles (Procesador, RAM, SSD, Gráfica, Serial y Estado)</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Marca de la Laptop</label>
                                    <CustomSelect
                                        value={collateral.brand || ''}
                                        onChange={(val) => handleChange('brand', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Apple', label: 'Apple (MacBook Pro / Air)' },
                                            { value: 'Dell', label: 'Dell (Latitude, XPS, Inspiron, Alienware)' },
                                            { value: 'HP', label: 'HP (Pavilion, Victus, Omen, Envy, EliteBook)' },
                                            { value: 'Lenovo', label: 'Lenovo (ThinkPad, Legion, IdeaPad, Yoga)' },
                                            { value: 'Asus', label: 'Asus (ROG, TUF, ZenBook, VivoBook)' },
                                            { value: 'Acer', label: 'Acer (Nitro, Predator, Aspire, Swift)' },
                                            { value: 'MSI', label: 'MSI (Gaming, Stealth, Modern)' },
                                            { value: 'Samsung', label: 'Samsung (Galaxy Book)' },
                                            { value: 'Microsoft', label: 'Microsoft (Surface Laptop)' },
                                            { value: 'Toshiba', label: 'Toshiba / Dynabook' },
                                            { value: 'Otra Marca', label: 'Otra Marca de Laptop' }
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
                                            placeholder="Ej. MacBook Pro 16 M3 Max / ThinkPad T14 Gen 4"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Procesador (CPU)</label>
                                    <div className="relative">
                                        <Cpu className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.processor || ''}
                                            onChange={(e) => handleChange('processor', e.target.value)}
                                            placeholder="Ej. Intel Core i7-13700H / AMD Ryzen 7 / Apple M3"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Memoria RAM</label>
                                    <CustomSelect
                                        value={collateral.ram || '16 GB'}
                                        onChange={(val) => handleChange('ram', val)}
                                        className="w-full"
                                        options={[
                                            { value: '8 GB', label: '8 GB RAM' },
                                            { value: '16 GB', label: '16 GB RAM' },
                                            { value: '24 GB', label: '24 GB RAM' },
                                            { value: '32 GB', label: '32 GB RAM' },
                                            { value: '64 GB', label: '64 GB RAM' },
                                            { value: '4 GB (Básico)', label: '4 GB RAM' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Almacenamiento (Disco)</label>
                                    <div className="relative">
                                        <HardDrive className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.storage || collateral.storageType || ''}
                                            onChange={(e) => {
                                                handleChange('storage', e.target.value);
                                                handleChange('storageType', e.target.value);
                                            }}
                                            placeholder="Ej. SSD NVMe 512 GB / 1 TB SSD"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tarjeta Gráfica (GPU)</label>
                                    <input 
                                        type="text"
                                        value={collateral.graphicsCard || ''}
                                        onChange={(e) => handleChange('graphicsCard', e.target.value)}
                                        placeholder="Ej. NVIDIA RTX 4060 8GB / Intel Iris Xe"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Número de Serie / Service Tag</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.serialNumber || collateral.refNumber || ''}
                                            onChange={(e) => {
                                                handleChange('serialNumber', e.target.value);
                                                handleChange('refNumber', e.target.value);
                                            }}
                                            placeholder="Ej. C02D1234MD6R / ST-998877"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tamaño de Pantalla</label>
                                    <CustomSelect
                                        value={collateral.screenSize || '15.6"'}
                                        onChange={(val) => handleChange('screenSize', val)}
                                        className="w-full"
                                        options={[
                                            { value: '13.3"', label: '13.3" (Ultraportable)' },
                                            { value: '14.0"', label: '14.0" (Compacta / Business)' },
                                            { value: '15.6"', label: '15.6" (Estándar)' },
                                            { value: '16.0"', label: '16.0" (Pro / Creadores)' },
                                            { value: '17.3"', label: '17.3" (Gamer / Pantalla Grande)' },
                                            { value: '12.0" - 13.0"', label: '12" - 13" Mini / Tablet' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Estado / Condición</label>
                                    <CustomSelect
                                        value={collateral.condition || 'Excelente / Como Nuevo'}
                                        onChange={(val) => handleChange('condition', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Nuevo Sellado en Caja', label: 'Nuevo Sellado en Caja' },
                                            { value: 'Como Nuevo / Grado A+', label: 'Como Nuevo / Grado A+ (Sin detalles)' },
                                            { value: 'Usado - Excelente Estado', label: 'Usado - Excelente Estado' },
                                            { value: 'Open Box / Reacondicionado', label: 'Open Box / Reacondicionado' },
                                            { value: 'Usado con Detalles Cosméticos', label: 'Usado con Detalles Cosméticos' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Salud de la Batería (%)</label>
                                    <div className="relative">
                                        <BatteryCharging className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.batteryHealth || ''}
                                            onChange={(e) => handleChange('batteryHealth', e.target.value)}
                                            placeholder="Ej. 100% / 94% / 350 ciclos"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Sistema Operativo</label>
                                    <CustomSelect
                                        value={collateral.operatingSystem || 'Windows 11 Pro'}
                                        onChange={(val) => handleChange('operatingSystem', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Windows 11 Pro', label: 'Windows 11 Pro' },
                                            { value: 'Windows 11 Home', label: 'Windows 11 Home' },
                                            { value: 'macOS Sonoma / Sequoia', label: 'macOS (Apple)' },
                                            { value: 'Windows 10 Pro', label: 'Windows 10 Pro' },
                                            { value: 'Linux Ubuntu / Fedora', label: 'Linux' },
                                            { value: 'Sin Sistema / FreeDOS', label: 'Sin Sistema Operativo' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Color del Equipo</label>
                                    <input 
                                        type="text"
                                        value={collateral.color || ''}
                                        onChange={(e) => handleChange('color', e.target.value)}
                                        placeholder="Ej. Space Gray / Plata / Negro Mate"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Accesorios Incluidos y Observaciones</label>
                                    <input 
                                        type="text"
                                        value={collateral.accessories || collateral.defects || ''}
                                        onChange={(e) => {
                                            handleChange('accessories', e.target.value);
                                            handleChange('defects', e.target.value);
                                        }}
                                        placeholder="Ej. Cargador original 67W, Mouse inalámbrico, Maletín acolchado, Factura original"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </>
                        )}

                        {/* 🖥️ PC / COMPUTADORAS DE ESCRITORIO */}
                        {collateral.type === 'PC / Computadoras de Escritorio' && (
                            <>
                                <div className="md:col-span-2 bg-purple-50/70 border border-purple-200 p-3 rounded-2xl flex items-center gap-2 text-purple-950 text-xs font-semibold mb-1">
                                    <Monitor className="w-4 h-4 text-purple-600 shrink-0" />
                                    <span>Formulario Especializado de PC de Escritorio / Torre / Servidor (Gabinete, CPU, RAM, Gráfica, Monitor y Serial)</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Computadora</label>
                                    <CustomSelect
                                        value={collateral.storageType || 'Torre Gamer / ATX'}
                                        onChange={(val) => handleChange('storageType', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Torre Gamer / ATX', label: 'Torre Gamer / Estación Custom ATX' },
                                            { value: 'PC de Oficina / SFF Slim', label: 'PC de Oficina / Torre SFF' },
                                            { value: 'All-in-One (Todo en Uno)', label: 'All-in-One (Todo en Uno con Pantalla)' },
                                            { value: 'Mini PC / Micro Torre', label: 'Mini PC / NUC / Mac Mini' },
                                            { value: 'Workstation / Servidor', label: 'Workstation Profesional / Servidor' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Marca / Ensamblaje</label>
                                    <CustomSelect
                                        value={collateral.brand || ''}
                                        onChange={(val) => handleChange('brand', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Ensamblada Custom / Clon Gamer', label: 'Ensamblada Custom / Clon Gamer' },
                                            { value: 'Dell', label: 'Dell (OptiPlex, Precision, Alienware)' },
                                            { value: 'HP', label: 'HP (ProDesk, EliteDesk, Omen, Pavilion)' },
                                            { value: 'Lenovo', label: 'Lenovo (ThinkCentre, Legion)' },
                                            { value: 'Apple', label: 'Apple (iMac, Mac Studio, Mac Mini, Mac Pro)' },
                                            { value: 'Asus', label: 'Asus (ROG, ExpertCenter)' },
                                            { value: 'MSI', label: 'MSI (Aegis, Infinite)' },
                                            { value: 'Otra Marca', label: 'Otra Marca / Ensamblador' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Modelo / Gabinete Específico</label>
                                    <div className="relative">
                                        <Type className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.model || ''}
                                            onChange={(e) => handleChange('model', e.target.value)}
                                            placeholder="Ej. Clon Gamer Corsair / Dell OptiPlex 7090 / iMac 24"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Procesador (CPU)</label>
                                    <div className="relative">
                                        <Cpu className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.processor || ''}
                                            onChange={(e) => handleChange('processor', e.target.value)}
                                            placeholder="Ej. Intel Core i7-14700K / Ryzen 7 7800X3D"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Memoria RAM</label>
                                    <CustomSelect
                                        value={collateral.ram || '16 GB'}
                                        onChange={(val) => handleChange('ram', val)}
                                        className="w-full"
                                        options={[
                                            { value: '8 GB DDR4', label: '8 GB DDR4' },
                                            { value: '16 GB DDR4/DDR5', label: '16 GB DDR4/DDR5' },
                                            { value: '32 GB DDR5', label: '32 GB DDR5' },
                                            { value: '64 GB DDR5', label: '64 GB DDR5' },
                                            { value: '128 GB', label: '128 GB' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Almacenamiento (Discos)</label>
                                    <div className="relative">
                                        <HardDrive className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.storage || ''}
                                            onChange={(e) => handleChange('storage', e.target.value)}
                                            placeholder="Ej. 1 TB SSD NVMe M.2 + 2 TB HDD"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tarjeta Gráfica Dedicada (GPU)</label>
                                    <input 
                                        type="text"
                                        value={collateral.graphicsCard || ''}
                                        onChange={(e) => handleChange('graphicsCard', e.target.value)}
                                        placeholder="Ej. NVIDIA GeForce RTX 4070 12GB / Integrada"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Monitor Incluido</label>
                                    <CustomSelect
                                        value={collateral.screenSize || 'Sin Monitor (Solo Torre)'}
                                        onChange={(val) => handleChange('screenSize', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Sin Monitor (Solo Torre)', label: 'Sin Monitor (Solo Torre / Gabinete)' },
                                            { value: 'Monitor 24" FHD (1080p)', label: 'Monitor 24" FHD (1080p)' },
                                            { value: 'Monitor 27" 2K (1440p)', label: 'Monitor 27" 2K (1440p 144Hz-180Hz)' },
                                            { value: 'Monitor 32" Curvo / 4K', label: 'Monitor 32" Curvo / 4K' },
                                            { value: 'Pantalla Integrada All-in-One', label: 'Pantalla Integrada All-in-One' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Número de Serie / Service Tag</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            value={collateral.serialNumber || collateral.refNumber || ''}
                                            onChange={(e) => {
                                                handleChange('serialNumber', e.target.value);
                                                handleChange('refNumber', e.target.value);
                                            }}
                                            placeholder="Ej. S/N PC-8837190"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-bold font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Estado / Condición</label>
                                    <CustomSelect
                                        value={collateral.condition || 'Excelente / Como Nuevo'}
                                        onChange={(val) => handleChange('condition', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Nuevo en Caja', label: 'Nuevo en Caja' },
                                            { value: 'Excelente / Como Nuevo', label: 'Excelente / Como Nuevo' },
                                            { value: 'Armado Customizado / Modificado', label: 'Armado Customizado / Modificado' },
                                            { value: 'Usado de Oficina', label: 'Usado de Oficina' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Sistema Operativo</label>
                                    <CustomSelect
                                        value={collateral.operatingSystem || 'Windows 11 Pro'}
                                        onChange={(val) => handleChange('operatingSystem', val)}
                                        className="w-full"
                                        options={[
                                            { value: 'Windows 11 Pro 64-bit', label: 'Windows 11 Pro 64-bit' },
                                            { value: 'Windows 10 Pro', label: 'Windows 10 Pro' },
                                            { value: 'macOS Sonoma / Sequoia', label: 'macOS (Apple)' },
                                            { value: 'Linux Ubuntu / Debian', label: 'Linux' },
                                            { value: 'Windows Server', label: 'Windows Server' }
                                        ]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Accesorios y Periféricos</label>
                                    <input 
                                        type="text"
                                        value={collateral.accessories || ''}
                                        onChange={(e) => handleChange('accessories', e.target.value)}
                                        placeholder="Ej. Teclado mecánico RGB, Mouse gamer, Cables de poder y HDMI/DisplayPort"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
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
                                            { value: 'Visa Crédito', label: 'Visa Crédito' },
                                            { value: 'Visa Débito', label: 'Visa Débito / Nómina' },
                                            { value: 'Mastercard Crédito', label: 'Mastercard Crédito' },
                                            { value: 'Mastercard Débito', label: 'Mastercard Débito' },
                                            { value: 'American Express', label: 'American Express' }
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
                                            const files = (e.target.files ? Array.from(e.target.files) : []) as File[];
                                            files.forEach((file: File) => {
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
