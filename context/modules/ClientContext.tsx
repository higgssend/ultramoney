import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Client, ClientNote, ClientDocument, Route, ClientRelationship, RelationshipType } from '../../types';
import type { ClientDB, ClientNoteDB, ClientDocumentDB, RouteDB, ClientRelationshipDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { logger } from '../../utils/logger';
import { uploadToBucketHelper } from '../../utils/storage';

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
  updateClientDocument: (id: string, updates: Partial<ClientDocument>, file?: File) => Promise<void>;
  removeClientDocument: (id: string) => void;
  generateClientPin: (clientId: string) => string;
  addRoute: (route: Omit<Route, 'id' | 'createdAt'>) => Promise<void>;
  updateRoute: (id: string, updates: Partial<Route>) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  clientRelationships: ClientRelationship[];
  addClientRelationship: (rel: Omit<ClientRelationship, 'id' | 'lenderId' | 'createdAt'>) => Promise<ClientRelationship | void>;
  updateClientRelationship: (id: string, updates: Partial<ClientRelationship>) => Promise<void>;
  deleteClientRelationship: (id: string) => Promise<void>;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { addAuditLog } = useSettings();
  const { currentUser } = useAuth();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [clientRelationships, setClientRelationships] = useState<ClientRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshClients = useCallback(async () => {
    if (!currentUser) {
      setClients([]); setClientNotes([]); setClientDocuments([]); setRoutes([]); setClientRelationships([]);
      return;
    }
    setIsLoading(true);
    try {
      const [clientsRes, notesRes, docsRes] = await Promise.all([
        insforge.database.from('clients').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
        insforge.database.from('client_notes').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
        insforge.database.from('client_documents').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
      ]);

      if (clientsRes.data) {
        setClients((clientsRes.data as ClientDB[]).map((c) => ({
          id: c.id,
          name: c.name,
          lastName: c.lastname || undefined,
          cedula: c.cedula,
          documentType: c.documenttype as Client['documentType'],
          email: c.email || undefined,
          phone: c.phone,
          whatsapp: c.whatsapp || undefined,
          phoneHome: c.phonehome || undefined,
          address: c.address,
          province: c.province || undefined,
          municipality: c.municipality || undefined,
          sector: c.sector || undefined,
          referenceAddress: c.referenceaddress || undefined,
          companyName: c.companyname || undefined,
          jobPosition: c.jobposition || undefined,
          coordinates: c.coordinates as { lat: number; lng: number } | undefined,
          routeId: c.routeid || undefined,
          routeSequence: c.routesequence || 0,
          occupation: c.occupation || undefined,
          sex: (c.sex || 'Otro') as Client['sex'],
          income: c.income || 0,
          creditScore: c.creditscore || 650,
          status: (c.status || 'Al Día') as Client['status'],
          avatarUrl: c.avatarurl || undefined,
          joinedDate: c.joineddate || c.created_at || new Date().toISOString(),
          portalPin: c.portalpin || undefined,
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
          fileUrl: d.file_url, fileType: d.file_type || 'application/pdf', uploadDate: d.upload_date, tags: d.tags || []
        })));
      }
      try {
        const routesRes = await insforge.database.from('routes').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false });
        if (routesRes.data) {
          setRoutes((routesRes.data as RouteDB[]).map((r) => ({
            id: r.id, name: r.name, description: r.description,
            collectorId: r.collector_id, status: (r.status || 'Activa') as Route['status'], createdAt: r.created_at || ''
          })));
        }
      } catch (err) {
        logger.error("Error loading routes:", err);
      }

      try {
        const relsRes = await insforge.database.from('client_relationships').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false });
        if (relsRes.data) {
          setClientRelationships((relsRes.data as ClientRelationshipDB[]).map((rel) => ({
            id: rel.id,
            lenderId: rel.lender_id,
            clientIdA: rel.client_id_a,
            clientNameA: rel.client_name_a,
            clientIdB: rel.client_id_b,
            clientNameB: rel.client_name_b,
            relationshipType: rel.relationship_type as RelationshipType,
            notes: rel.notes || undefined,
            createdAt: rel.created_at || new Date().toISOString()
          })));
        }
      } catch (err) {
        logger.error("Error loading client relationships:", err);
      }
    } catch (error) {
      logger.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);;

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const addClient = async (client: Omit<Client, 'id'>): Promise<Client | void> => {
    if (!currentUser) return;
    
    const routeIdClean = client.routeId && client.routeId.trim() !== '' ? client.routeId : null;

    let avatarUrl = client.avatarUrl || null;
    if (avatarUrl && avatarUrl.startsWith('data:')) {
      const uploadedUrl = await uploadToBucketHelper(avatarUrl, 'client-photos', 'avatars');
      if (uploadedUrl) avatarUrl = uploadedUrl;
    }

    const { data, error } = await insforge.database.from('clients').insert([{
      lender_id: currentUser.id,
      name: client.name,
      lastname: client.lastName || null,
      cedula: client.cedula,
      documenttype: client.documentType || 'Cedula',
      email: client.email || null,
      phone: client.phone,
      whatsapp: client.whatsapp || null,
      phonehome: client.phoneHome || null,
      address: client.address,
      province: client.province || null,
      municipality: client.municipality || null,
      sector: client.sector || null,
      referenceaddress: client.referenceAddress || null,
      companyname: client.companyName || null,
      jobposition: client.jobPosition || null,
      coordinates: client.coordinates || null,
      routeid: routeIdClean,
      routesequence: client.routeSequence || 0,
      occupation: client.occupation || null,
      sex: client.sex || 'Otro',
      income: client.income || 0,
      creditscore: client.creditScore || 650,
      avatarurl: avatarUrl,
      status: 'Al Día',
      joineddate: new Date().toISOString().split('T')[0],
      clientpin: Math.floor(1000 + Math.random() * 9000).toString(),
      portal_alias: client.portalAlias || null,
      portal_active: client.portalActive !== false,
    }]).select().single();
    
    if (data && !error) {
      const newClient: Client = {
        id: data.id,
        name: data.name,
        lastName: data.lastname || '',
        cedula: data.cedula || '',
        documentType: data.documenttype || 'Cedula',
        email: data.email || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        phoneHome: data.phonehome || '',
        address: data.address || '',
        province: data.province || '',
        municipality: data.municipality || '',
        sector: data.sector || '',
        referenceAddress: data.referenceaddress || '',
        companyName: data.companyname || '',
        jobPosition: data.jobposition || '',
        coordinates: data.coordinates || undefined,
        routeId: data.routeid || '',
        routeSequence: data.routesequence || 0,
        occupation: data.occupation || '',
        sex: data.sex || 'Otro',
        income: Number(data.income) || 0,
        creditScore: Number(data.creditscore) || 650,
        avatarUrl: data.avatarurl || undefined,
        status: data.status || 'Al Día',
        joinedDate: data.joineddate || '',
        clientPin: data.clientpin || '',
        portalAlias: data.portal_alias || undefined,
        portalActive: data.portal_active ?? true,
        guarantors: []
      };
      setClients(prev => [newClient, ...prev]);
      addAuditLog('client_created', `Registró al cliente ${newClient.name}`);
      addToast("Cliente registrado exitosamente", "success");
      return newClient;
    } else {
      logger.error("Error al registrar cliente:", error);
      addToast(`Error al registrar cliente: ${error?.message || 'Error desconocido'}`, "error");
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    if (!currentUser) return;
    const clientObj = clients.find(c => c.id === id);
    const { error } = await insforge.database.from('clients').delete().eq('id', id).eq('lender_id', currentUser.id);
    if (!error) {
      setClients(prev => prev.filter(c => c.id !== id));
      addAuditLog('client_deleted', `Eliminó al cliente ${clientObj ? clientObj.name : id}`);
      addToast('Cliente eliminado exitosamente', 'success');
    } else {
      logger.error('Error al eliminar cliente:', error);
      addToast(`Error al eliminar cliente: ${error?.message || 'Error desconocido'}`, 'error');
    }
  };

  const updateClient = async (updatedClient: Client) => {
    if (!currentUser) return;
    const routeIdClean = updatedClient.routeId && updatedClient.routeId.trim() !== '' ? updatedClient.routeId : null;

    let avatarUrl = updatedClient.avatarUrl || null;
    if (avatarUrl && avatarUrl.startsWith('data:')) {
      const uploadedUrl = await uploadToBucketHelper(avatarUrl, 'client-photos', 'avatars');
      if (uploadedUrl) avatarUrl = uploadedUrl;
    }

    const { error } = await insforge.database.from('clients').update({
      name: updatedClient.name,
      lastname: updatedClient.lastName || null,
      cedula: updatedClient.cedula,
      documenttype: updatedClient.documentType,
      email: updatedClient.email || null,
      phone: updatedClient.phone,
      whatsapp: updatedClient.whatsapp || null,
      phonehome: updatedClient.phoneHome || null,
      address: updatedClient.address,
      province: updatedClient.province || null,
      municipality: updatedClient.municipality || null,
      sector: updatedClient.sector || null,
      referenceaddress: updatedClient.referenceAddress || null,
      companyname: updatedClient.companyName || null,
      jobposition: updatedClient.jobPosition || null,
      coordinates: updatedClient.coordinates || null,
      routeid: routeIdClean,
      routesequence: updatedClient.routeSequence || 0,
      occupation: updatedClient.occupation || null,
      sex: updatedClient.sex,
      income: updatedClient.income || 0,
      status: updatedClient.status,
      clientpin: updatedClient.clientPin,
      portal_alias: updatedClient.portalAlias || null,
      portal_active: updatedClient.portalActive !== false,
      avatarurl: avatarUrl,
      creditscore: updatedClient.creditScore
    }).eq('id', updatedClient.id).eq('lender_id', currentUser.id);
    
    if (!error) {
      setClients(prev => prev.map(c => c.id === updatedClient.id ? { ...c, ...updatedClient } : c));
      
      // Update denormalized clientname in loans & loan_requests in database
      const fullName = `${updatedClient.name} ${updatedClient.lastName || ''}`.trim();
      Promise.all([
        insforge.database.from('loans').update({
          clientname: fullName,
          client_name: fullName
        }).eq('clientid', updatedClient.id),
        insforge.database.from('loans').update({
          clientname: fullName,
          client_name: fullName
        }).eq('client_id', updatedClient.id),
        insforge.database.from('loan_requests').update({
          client_name: fullName
        }).eq('client_id', updatedClient.id)
      ]).catch(err => {
        logger.error("Error al actualizar nombre en préstamos:", err);
      });

      addToast("Cliente actualizado exitosamente", "success");
    } else {
      logger.error("Error al actualizar cliente:", error);
      addToast(`Error al actualizar cliente: ${error?.message || 'Error desconocido'}`, "error");
    }
  };

  const addClientNote = async (note: ClientNote) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('client_notes').insert([{
      lender_id: currentUser.id, client_id: note.clientId, content: note.content,
      date: note.date, created_by: currentUser.name || 'Agente'
    }]).select().single();
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

    const { error } = await insforge.database.from('client_documents').insert([{
      lender_id: currentUser.id, client_id: doc.clientId, title: doc.title, type: doc.type,
      file_url: fileUrl, upload_date: doc.uploadDate, tags: doc.tags || []
    }]);
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

  const updateClientDocument = async (id: string, updates: Partial<ClientDocument>, file?: File) => {
    if (!currentUser) return;
    let fileUrl = updates.fileUrl;

    if (file) {
      const ext = file.name.split('.').pop();
      const filename = `${updates.clientId || 'docs'}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: uploadError } = await insforge.storage.from('client-documents').upload(filename, file);
      if (uploadError) {
        addToast("Error al subir nuevo archivo", 'error');
        return;
      }
      const { data } = insforge.storage.from('client-documents').getPublicUrl(filename);
      fileUrl = data.publicUrl;
    }

    const payload: Partial<ClientDocumentDB> = {};
    if (updates.title !== undefined) {
      payload.title = updates.title;
      payload.name = updates.title;
    }
    if (updates.type !== undefined) payload.type = updates.type;
    if (fileUrl !== undefined) {
      payload.file_url = fileUrl;
      payload.url = fileUrl;
    }

    const { error } = await insforge.database.from('client_documents').update(payload).eq('id', id);
    if (!error) {
      setClientDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates, ...(fileUrl ? { fileUrl } : {}) } : d));
      addToast("Documento actualizado exitosamente", "success");
    } else {
      addToast("Error al actualizar documento", "error");
    }
  };

  const generateClientPin = (clientId: string) => {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const existing = clients.find(c => c.id === clientId);
    if (existing) {
      updateClient({ ...existing, clientPin: newPin });
    } else {
      insforge.database.from('clients').update({ clientpin: newPin }).eq('id', clientId);
    }
    return newPin;
  };

  const addRoute = async (route: Omit<Route, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const { data, error } = await insforge.database.from('routes').insert([{
      name: route.name, description: route.description, collector_id: route.collectorId, lender_id: currentUser.id
    }]).select();
    if (!error && data && data[0]) {
      setRoutes([...routes, {
        id: data[0].id,
        name: data[0].name,
        description: data[0].description,
        collectorId: data[0].collector_id,
        status: (data[0].status || 'Activa') as Route['status'],
        createdAt: data[0].created_at || new Date().toISOString()
      }]);
      addToast("Ruta creada exitosamente", "success");
    } else addToast("Error al crear ruta", "error");
  };

  const updateRoute = async (id: string, updates: Partial<Route>) => {
    if (!currentUser) return;
    const dbUpdates: Partial<RouteDB> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.collectorId !== undefined) dbUpdates.collector_id = updates.collectorId;

    const { error } = await insforge.database.from('routes').update(dbUpdates).eq('id', id).eq('lender_id', currentUser.id);
    if (!error) {
      setRoutes(routes.map(r => r.id === id ? { ...r, ...updates } : r));
      addToast("Ruta actualizada exitosamente", "success");
    } else addToast("Error al actualizar ruta", "error");
  };

  const deleteRoute = async (id: string) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('routes').delete().eq('id', id).eq('lender_id', currentUser.id);
    if (!error) {
      setRoutes(routes.filter(r => r.id !== id));
      addToast("Ruta eliminada exitosamente", "success");
    } else addToast("Error al eliminar ruta", "error");
  };

  const addClientRelationship = async (rel: Omit<ClientRelationship, 'id' | 'lenderId' | 'createdAt'>): Promise<ClientRelationship | void> => {
    if (!currentUser) return;
    const newId = `rel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const { error } = await insforge.database.from('client_relationships').insert([{
      id: newId,
      lender_id: currentUser.id,
      client_id_a: rel.clientIdA,
      client_name_a: rel.clientNameA,
      client_id_b: rel.clientIdB,
      client_name_b: rel.clientNameB,
      relationship_type: rel.relationshipType,
      notes: rel.notes || null,
      created_at: now
    }]);

    if (!error) {
      const createdRel: ClientRelationship = {
        id: newId,
        lenderId: currentUser.id,
        clientIdA: rel.clientIdA,
        clientNameA: rel.clientNameA,
        clientIdB: rel.clientIdB,
        clientNameB: rel.clientNameB,
        relationshipType: rel.relationshipType,
        notes: rel.notes,
        createdAt: now
      };
      setClientRelationships(prev => [createdRel, ...prev]);
      addToast("Vínculo registrado exitosamente", "success");
      return createdRel;
    } else {
      addToast("Error al registrar vínculo", "error");
    }
  };

  const updateClientRelationship = async (id: string, updates: Partial<ClientRelationship>) => {
    if (!currentUser) return;
    const dbUpdates: Partial<ClientRelationshipDB> = {};
    if (updates.relationshipType !== undefined) dbUpdates.relationship_type = updates.relationshipType;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.clientNameA !== undefined) dbUpdates.client_name_a = updates.clientNameA;
    if (updates.clientNameB !== undefined) dbUpdates.client_name_b = updates.clientNameB;

    const { error } = await insforge.database.from('client_relationships').update(dbUpdates).eq('id', id).eq('lender_id', currentUser.id);
    if (!error) {
      setClientRelationships(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      addToast("Vínculo actualizado exitosamente", "success");
    } else {
      addToast("Error al actualizar vínculo", "error");
    }
  };

  const deleteClientRelationship = async (id: string) => {
    if (!currentUser) return;
    const { error } = await insforge.database.from('client_relationships').delete().eq('id', id).eq('lender_id', currentUser.id);
    if (!error) {
      setClientRelationships(prev => prev.filter(r => r.id !== id));
      addToast("Vínculo eliminado exitosamente", "success");
    } else {
      addToast("Error al eliminar vínculo", "error");
    }
  };

  return (
    <ClientContext.Provider value={{
      clients, clientNotes, clientDocuments, routes, clientRelationships,
      addClient, updateClient, deleteClient, addClientNote, addClientDocument, updateClientDocument, removeClientDocument, generateClientPin,
      addRoute, updateRoute, deleteRoute, addClientRelationship, updateClientRelationship, deleteClientRelationship, refreshClients
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
