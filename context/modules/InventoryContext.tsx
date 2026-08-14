import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryItem } from '../../types';
import type { InventoryItemDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useAuth } from './AuthContext';
import { useToast } from '../ToastContext';
import { logger } from '../../utils/logger';

interface InventoryContextType {
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => Promise<InventoryItem | null>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  markAsFinanced: (id: string) => Promise<void>;
  refreshInventory: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fetchInventory = async () => {
    if (!currentUser) {
      setInventory([]);
      return;
    }
    try {
      const { data, error } = await insforge.database
        .from('inventory')
        .select('*')
        .eq('lender_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setInventory(
          (data as InventoryItemDB[]).map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category || 'Teléfono / Celular',
            brand: item.brand,
            model: item.model,
            serialNumber: item.serial_number,
            imei2: item.imei2,
            condition: item.condition || 'Excelente / Como Nuevo',
            color: item.color,
            storage: item.storage,
            cashPrice: Number(item.cash_price) || 0,
            costPrice: Number(item.cost_price) || 0,
            status: (item.status || 'Disponible') as InventoryItem['status'],
            createdAt: item.created_at || new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      logger.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentUser]);

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt'>): Promise<InventoryItem | null> => {
    if (!currentUser) return null;
    try {
      const { data, error } = await insforge.database
        .from('inventory')
        .insert([
          {
            lender_id: currentUser.id,
            name: itemData.name,
            category: itemData.category,
            brand: itemData.brand,
            model: itemData.model,
            serial_number: itemData.serialNumber,
            imei2: itemData.imei2,
            condition: itemData.condition,
            color: itemData.color,
            storage: itemData.storage,
            cash_price: itemData.cashPrice,
            cost_price: itemData.costPrice || 0,
            status: itemData.status || 'Disponible',
          },
        ])
        .select()
        .single();

      if (data && !error) {
        const newItem: InventoryItem = {
          id: data.id,
          name: data.name,
          category: data.category,
          brand: data.brand,
          model: data.model,
          serialNumber: data.serial_number,
          imei2: data.imei2,
          condition: data.condition,
          color: data.color,
          storage: data.storage,
          cashPrice: Number(data.cash_price),
          costPrice: Number(data.cost_price),
          status: data.status,
          createdAt: data.created_at,
        };
        setInventory((prev) => [newItem, ...prev]);
        addToast('Equipo agregado al stock de inventario', 'success');
        return newItem;
      }
    } catch (err) {
      logger.error('Error adding inventory item:', err);
      addToast('Error al agregar al inventario', 'error');
    }
    return null;
  };

  const updateInventoryItem = async (item: InventoryItem) => {
    if (!currentUser) return;
    try {
      const { error } = await insforge.database
        .from('inventory')
        .update({
          name: item.name,
          category: item.category,
          brand: item.brand,
          model: item.model,
          serial_number: item.serialNumber,
          imei2: item.imei2,
          condition: item.condition,
          color: item.color,
          storage: item.storage,
          cash_price: item.cashPrice,
          cost_price: item.costPrice || 0,
          status: item.status,
        })
        .eq('id', item.id)
        .eq('lender_id', currentUser.id);

      if (!error) {
        setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)));
        addToast('Inventario actualizado', 'success');
      }
    } catch (err) {
      logger.error('Error updating inventory item:', err);
    }
  };

  const markAsFinanced = async (id: string) => {
    if (!currentUser) return;
    try {
      await insforge.database
        .from('inventory')
        .update({ status: 'Financiado' })
        .eq('id', id)
        .eq('lender_id', currentUser.id);

      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'Financiado' } : i)));
    } catch (err) {
      logger.error('Error marking as financed:', err);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    if (!currentUser) return;
    try {
      const { error } = await insforge.database
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('lender_id', currentUser.id);

      if (!error) {
        setInventory((prev) => prev.filter((i) => i.id !== id));
        addToast('Producto eliminado del inventario', 'success');
      }
    } catch (err) {
      logger.error('Error deleting inventory item:', err);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        markAsFinanced,
        refreshInventory: fetchInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
