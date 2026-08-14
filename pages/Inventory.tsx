import React, { useState } from 'react';
import { Package, Plus, Search, Trash2, Edit, CheckCircle, Tag, DollarSign, Smartphone, Shield, X, Save } from 'lucide-react';
import { useInventory } from '../context/StoreContext';
import { InventoryItem } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import { DataExportToolbar } from '../components/DataExportToolbar';

export const InventoryPage: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Teléfono / Celular',
    brand: 'Apple',
    model: '',
    serialNumber: '',
    imei2: '',
    condition: 'Excelente / Como Nuevo',
    color: '',
    storage: '128GB',
    cashPrice: 0,
    costPrice: 0,
    status: 'Disponible'
  });

  const filteredItems = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCat = selectedCategory === 'Todas' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Teléfono / Celular',
      brand: 'Apple',
      model: '',
      serialNumber: '',
      imei2: '',
      condition: 'Excelente / Como Nuevo',
      color: '',
      storage: '128GB',
      cashPrice: 0,
      costPrice: 0,
      status: 'Disponible'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name && (!formData.brand || !formData.model)) return;

    const itemName = formData.name || `${formData.brand || ''} ${formData.model || ''}`.trim();

    if (editingItem) {
      await updateInventoryItem({
        ...editingItem,
        ...formData,
        name: itemName,
        cashPrice: Number(formData.cashPrice) || 0,
        costPrice: Number(formData.costPrice) || 0
      } as InventoryItem);
    } else {
      await addInventoryItem({
        name: itemName,
        category: formData.category || 'Teléfono / Celular',
        brand: formData.brand,
        model: formData.model,
        serialNumber: formData.serialNumber,
        imei2: formData.imei2,
        condition: formData.condition || 'Excelente / Como Nuevo',
        color: formData.color,
        storage: formData.storage,
        cashPrice: Number(formData.cashPrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        status: (formData.status as InventoryItem['status']) || 'Disponible'
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="w-full space-y-6 pb-20 animate-fade-in">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-2xl">
              <Package className="w-6 h-6" />
            </div>
            Inventario & Stock de Equipos
          </h1>
          <p className="text-slate-500 text-xs mt-1">Catálogo de teléfonos, dispositivos y bienes listos para financiamiento o venta.</p>
        </div>

        <div className="flex items-center gap-3">
          <DataExportToolbar
            data={filteredItems}
            title="Inventario de Equipos UltraMoney"
            filename="inventario_stock"
            columns={[
              { header: 'Equipo', key: 'name' },
              { header: 'Categoría', key: 'category' },
              { header: 'Marca', key: 'brand' },
              { header: 'Modelo', key: 'model' },
              { header: 'IMEI / Serial', key: 'serialNumber' },
              { header: 'Condición', key: 'condition' },
              { header: 'Precio Contado', key: 'cashPrice', format: (v) => `RD$ ${v?.toLocaleString()}` },
              { header: 'Estado', key: 'status' }
            ]}
          />
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agregar Equipo al Stock
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por marca, modelo, IMEI..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500">Filtrar por Categoría:</span>
          <CustomSelect
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            className="w-48 text-xs font-medium"
            options={[
              { value: 'Todas', label: 'Todas las Categorías' },
              { value: 'Teléfono / Celular', label: 'Teléfonos / Celulares' },
              { value: 'Electrodoméstico', label: 'Electrodomésticos' },
              { value: 'Vehículo', label: 'Vehículos / Pasolas' },
              { value: 'Otro', label: 'Otros Artículos' }
            ]}
          />
        </div>
      </div>

      {/* Grid of Stock Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No hay equipos registrados en el stock</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Agrega tus teléfonos, vehículos o electrodomésticos para seleccionarlos al instante al financiar.</p>
          <button onClick={handleOpenAddModal} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs">
            + Agregar Primer Equipo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-xl">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> {item.category}
                  </span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                    item.status === 'Disponible' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    item.status === 'Financiado' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-snug">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {item.serialNumber ? `IMEI/Serie: ${item.serialNumber}` : 'Sin Serial'}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Condición</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.condition}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Almacenamiento / Color</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.storage || '-'} {item.color ? `/ ${item.color}` : ''}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Precio de Contado</span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    RD$ {item.cashPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Editar Equipo"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteInventoryItem(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Eliminar Equipo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Agregar / Editar Equipo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="bg-emerald-600 p-6 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                {editingItem ? 'Editar Equipo en Stock' : 'Agregar Nuevo Equipo al Inventario'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-emerald-700 p-1.5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                  <CustomSelect
                    value={formData.category || 'Teléfono / Celular'}
                    onChange={(v) => setFormData({ ...formData, category: v })}
                    className="w-full text-xs"
                    options={[
                      { value: 'Teléfono / Celular', label: 'Teléfono / Celular' },
                      { value: 'Electrodoméstico', label: 'Electrodoméstico / Equipo' },
                      { value: 'Vehículo', label: 'Vehículo / Pasola' },
                      { value: 'Otro', label: 'Otro bien' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Marca</label>
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Ej. Apple / Samsung / LG"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ej. iPhone 15 Pro / S24 Ultra"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">IMEI 1 / Número de Serie</label>
                  <input
                    type="text"
                    value={formData.serialNumber || ''}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Ej. 356789012345678"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">IMEI 2 (Opcional)</label>
                  <input
                    type="text"
                    value={formData.imei2 || ''}
                    onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                    placeholder="Ej. 356789012345679"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estado del Equipo</label>
                  <CustomSelect
                    value={formData.condition || 'Excelente / Como Nuevo'}
                    onChange={(v) => setFormData({ ...formData, condition: v })}
                    className="w-full text-xs"
                    options={[
                      { value: 'Excelente / Como Nuevo', label: 'Excelente / Como Nuevo' },
                      { value: 'Bueno con uso normal', label: 'Bueno (Uso Normal)' },
                      { value: 'Con detalles / Rayaduras', label: 'Con detalles' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Almacenamiento</label>
                  <CustomSelect
                    value={formData.storage || '128GB'}
                    onChange={(v) => setFormData({ ...formData, storage: v })}
                    className="w-full text-xs"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Color del Equipo</label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Ej. Titanium Negro"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Precio de Contado (RD$)</label>
                  <input
                    type="number"
                    value={formData.cashPrice === 0 ? '' : formData.cashPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormData({ ...formData, cashPrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estado de Stock</label>
                  <CustomSelect
                    value={formData.status || 'Disponible'}
                    onChange={(v) => setFormData({ ...formData, status: v as InventoryItem['status'] })}
                    className="w-full text-xs"
                    options={[
                      { value: 'Disponible', label: 'Disponible en Stock' },
                      { value: 'Financiado', label: 'Financiado' },
                      { value: 'Vendido', label: 'Vendido' }
                    ]}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-sm"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
