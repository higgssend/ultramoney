import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Client, ClientNote, ClientDocument, Route } from '../../types';
import type { ClientDB, ClientNoteDB, ClientDocumentDB, RouteDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { logger } from '../../utils/logger';

interface ClientContextType {
  clients: Client[];
  clientNotes: ClientNote[];
  clientDocuments: ClientDocument[];
  routes: Route[];
  
  addClient: (client: Omit<Client, 'id'>) => Promise<Client | void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addClientNote: (note: ClientNote) => void;
  addClientDocument: (doc: ClientDocument, file?: File) => void;
  removeClientDocument: (id: string) => void;
  generateClientPin: (clientId: string) => string;
  addRoute: (route: Omit<Route, 'id' | 'createdAt'>) => Promise<void>;
  updateRoute: (id: string, updates: Partial<Route>) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  const refreshClients = React.useCallback(async () => {
    if (!currentUser) {
      setClients([]); setClientNotes([]); setClientDocuments([]); setRoutes([]);
      return;
    }
    try {
      const [clientsRes, notesRes, docsRes, routesRes] = await Promise.all([
        insforge.database.from('clients').select('*').order('created_at', { ascending: false }),
        insforge.database.from('client_notes').select('*').order('created_at', { ascending: false }),
        insforge.database.from('client_documents').select('*').order('created_at', { ascending: false }),
        insforge.database.from('routes').select('*').order('created_at', { ascending: false })
      ]);

      if (clientsRes.data) {
        setClients((clientsRes.data as ClientDB[]).map((c) => ({
          id: c.id,
          name: c.name,
          lastName: c.lastname || c.last_name,
          cedula: c.cedula || '',
          documentType: (c.documenttype || c.document_type) as Client['documentType'],
          email: c.email,
          phone: c.phone || '',
          whatsapp: c.whatsapp,
          phoneHome: c.phonehome,
          address: c.address || '',
          province: c.province,
          municipality: c.municipality,
          sector: c.sector,
          referenceAddress: c.referenceaddress,
          companyName: c.companyname,
          jobPosition: c.jobposition,
          coordinates: c.coordinates ?? undefined,
          routeId: c.routeid,
          routeSequence: c.routesequence,
          occupation: c.occupation || '',
          sex: (c.sex || 'Otro') as Client['sex'],
          income: c.income,
          creditScore: c.creditscore ?? c.credit_score,
          status: (c.status || 'Activo') as Client['status'],
          joinedDate: c.joineddate || c.created_at,
          clientPin: c.clientpin,
          guarantors: c.guarantors,
          currency: (c.currency || 'DOP') as 'DOP' | 'USD',
        })));
      }
      if (notesRes.data) {
        setClientNotes((notesRes.data as ClientNoteDB[]).map((n) => ({
          id: n.id, clientId: n.client_id, content: n.content, date: n.date, createdBy: n.created_by
        })));
      }
      if (docsRes.data) {
        setClientDocuments((docsRes.data as ClientDocumentDB[]).map((d) => ({
          id: d.id, clientId: d.client_id, title: d.title, type: d.type as ClientDocument['type'],
          fileUrl: d.file_url, uploadDate: d.upload_date, tags: d.tags || []
        })));
      }
      if (routesRes.data) {
        setRoutes((routesRes.data as RouteDB[]).map((r) => ({
          id: r.id, name: r.name, description: r.description,
          collectorId: r.collector_id, status: (r.status || 'Activa') as Route['status'], createdAt: r.created_at || ''
        })));
      }
    } catch (error) {
      logger.error("Error fetching clients:", error);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const addClient = async (client: Omit<Client, 'id'>): Promise<Client | void> => {
    if (!currentUser) return;
    const { data, error } = await insforge.database.from('clients').insert({
      lender_id: currentUser.id, name: client.name, lastname: client.lastName, cedula: client.cedula,
      documenttype: client.documentType, email: client.email, phone: client.phone, whatsapp: client.whatsapp,
      phonehome: client.phoneHome, address: client.address, province: client.province, municipality: client.municipality,
      sector: client.sector, referenceaddress: client.referenceAddress, companyname: client.companyName,
      jobposition: client.jobPosition, coordinates: client.coordinates, routeid: client.routeId,
      routesequence: client.routeSequence, occupation: client.occupation, sex: client.sex,
      income: client.income, creditscore: client.creditScore, status: 'Al Día', joineddate: new Date().toISOString().split('T')[0],
      clientpin: Math.floor(1000 + Math.random() * 9000).toString(), guarantors: client.guarantors || []
    }).select().single();
    
    if (data && !error) {
      const newClient: Client = {
        id: data.id, name: data.name, lastName: data.lastname, cedula: data.cedula, documentType: data.documenttype,
        email: data.email, phone: data.phone, whatsapp: data.whatsapp, phoneHome: data.phonehome,
        address: data.address, province: data.province, municipality: data.municipality, sector: data.sector,
        referenceAddress: data.referenceaddress, companyName: data.companyname, jobPosition: data.jobposition,
        coordinates: data.coordinates, routeId: data.routeid, routeSequence: data.routesequence,
        occupation: data.occupation, sex: data.sex, income: data.income, creditScore: data.creditscore,
        status: data.status, joinedDate: data.joineddate || data.created_at, clientPin: data.clientpin, guarantors: data.guarantors
      };
      setClients(prev => [newClient, ...prev]);
      addToast("Cliente agregado", "success");
      return newClient;
    } else {
      addToast("Error al crear cliente", "error");
    }
  };

  const updateClient = async (updatedClient: Client) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('clients').update({
      name: updatedClient.name, lastname: updatedClient.lastName, cedula: updatedClient.cedula,
      documenttype: updatedClient.documentType, email: updatedClient.email, phone: updatedClient.phone,
      whatsapp: updatedClient.whatsapp, phonehome: updatedClient.phoneHome, address: updatedClient.address,
      province: updatedClient.province, municipality: updatedClient.municipality, sector: updatedClient.sector,
      referenceaddress: updatedClient.referenceAddress, companyname: updatedClient.companyName,
      jobposition: updatedClient.jobPosition, coordinates: updatedClient.coordinates, routeid: updatedClient.routeId,
      routesequence: updatedClient.routeSequence, occupation: updatedClient.occupation, sex: updatedClient.sex,
      income: updatedClient.income, status: updatedClient.status, clientpin: updatedClient.clientPin,
      guarantors: updatedClient.guarantors, creditscore: updatedClient.creditScore
    }).eq('id', updatedClient.id);
    
    if (!error) {
      setClients(prev => prev.map(c => c.id === updatedClient.id ? { ...c, ...updatedClient } : c));
      addToast("Cliente actualizado", "success");
    }
  };

  const addClientNote = async (note: ClientNote) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('client_notes').insert({
      lender_id: currentUser.id, client_id: note.clientId, content: note.content,
      date: note.date, created_by: currentUser.name || 'Agente'
    }).select().single();
    if (!error) {
      refreshClients(); // Refetch to get updated list
      addToast("Nota agregada", "success");
    }
  };

  const addClientDocument = async (doc: ClientDocument, file?: File) => {
    if (!currentUser) return;
    let fileUrl = doc.fileUrl;
    
    if (file) {
       const ext = file.name.split('.').pop();
       const filename = `${doc.clientId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
       const { error: uploadError } = await insforge.storage.from('client-documents').upload(filename, file);
       
       if (uploadError) {
         addToast("Error al subir archivo", 'error');
         return;
       }
       const { data } = insforge.storage.from('client-documents').getPublicUrl(filename);
       fileUrl = data.publicUrl;
    }

    const { error } = await insforge.database.from('client_documents').insert({
      lender_id: currentUser.id, client_id: doc.clientId, title: doc.title, type: doc.type,
      file_url: fileUrl, upload_date: doc.uploadDate, tags: doc.tags || []
    });
    if (!error) {
      refreshClients();
      addToast("Documento agregado", "success");
    }
  };

  const removeClientDocument = async (id: string) => {
    const { error } = await insforge.database.from('client_documents').delete().eq('id', id);
    if (!error) {
      setClientDocuments(prev => prev.filter(d => d.id !== id));
      addToast("Documento eliminado", "success");
    }
  };

  const generateClientPin = (clientId: string) => {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    updateClient({ id: clientId, clientPin: newPin });
    return newPin;
  };

  const addRoute = async (route: Omit<Route, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const { data, error } = await insforge.database.from('routes').insert([{
      name: route.name, description: route.description, collector_id: route.collectorId, lender_id: currentUser.id
    }]).select();
    if (!error && data) {
      setRoutes([...routes, { id: data[0].id, name: data[0].name, description: data[0].description, collectorId: data[0].collector_id }]);
      addToast("Ruta creada exitosamente", "success");
    } else addToast("Error al crear ruta", "error");
  };

  const updateRoute = async (id: string, updates: Partial<Route>) => {
    const dbUpdates: Partial<RouteDB> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.collectorId !== undefined) dbUpdates.collector_id = updates.collectorId;

    const { error } = await insforge.database.from('routes').update(dbUpdates).eq('id', id);
    if (!error) {
      setRoutes(routes.map(r => r.id === id ? { ...r, ...updates } : r));
      addToast("Ruta actualizada exitosamente", "success");
    } else addToast("Error al actualizar ruta", "error");
  };

  const deleteRoute = async (id: string) => {
    const { error } = await insforge.database.from('routes').delete().eq('id', id);
    if (!error) {
      setRoutes(routes.filter(r => r.id !== id));
      addToast("Ruta eliminada exitosamente", "success");
    } else addToast("Error al eliminar ruta", "error");
  };

  return (
    <ClientContext.Provider value={{
      clients, clientNotes, clientDocuments, routes,
      addClient, updateClient, addClientNote, addClientDocument, removeClientDocument, generateClientPin,
      addRoute, updateRoute, deleteRoute, refreshClients
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) throw new Error('useClients must be used within a ClientProvider');
  return context;
};
