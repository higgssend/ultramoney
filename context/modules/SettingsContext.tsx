import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompanySettings, AuditLog, AppNotification, PdfJob } from '../../types';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  companySettings: CompanySettings;
  globalCurrency: 'DOP' | 'USD';
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  pdfQueue: PdfJob[];
  
  updateCompanySettings: (settings: CompanySettings) => void;
  setGlobalCurrency: (currency: 'DOP' | 'USD') => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addAuditLog: (action: string, details: string) => void;
  enqueuePdf: (job: Omit<PdfJob, 'id'>) => void;
  removePdfJob: (id: string) => void;
}

const initialCompanySettings: CompanySettings = {
  name: 'Ultramoney S.R.L.',
  slogan: 'Tu socio financiero de confianza',
  rnc: '131-00000-1',
  address: 'Av. 27 de Febrero #23, Santo Domingo, RD',
  phone: '(809) 555-0100',
  email: 'contacto@ultramoney.com',
  currency: 'DOP',
  termsAndConditions: 'El incumplimiento de pago generará una mora del 5% mensual.'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialCompanySettings);
  const [globalCurrency, setGlobalCurrencyState] = useState<'DOP' | 'USD'>('DOP');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pdfQueue, setPdfQueue] = useState<PdfJob[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('um_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { id: '1', title: 'Bienvenido', message: 'Bienvenido a Ultramoney. Aquí aparecerán tus alertas.', date: new Date().toISOString(), read: false, type: 'info' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('um_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (!currentUser) {
      setCompanySettings(initialCompanySettings);
      setAuditLogs([]);
      return;
    }

    const fetchSettings = async () => {
      try {
        const [settingsRes, bitacoraRes] = await Promise.all([
          insforge.database.from('company_settings').select('*').maybeSingle(),
          insforge.database.from('bitacora_logs').select('*').order('created_at', { ascending: false })
        ]);

        if (settingsRes.data) {
          setCompanySettings({
            name: settingsRes.data.name, slogan: settingsRes.data.slogan, rnc: settingsRes.data.rnc,
            address: settingsRes.data.address, phone: settingsRes.data.phone, email: settingsRes.data.email,
            currency: settingsRes.data.currency, termsAndConditions: settingsRes.data.terms_and_conditions
          });
          if (settingsRes.data.currency === 'USD') setGlobalCurrencyState('USD');
        }
        if (bitacoraRes.data) {
           setAuditLogs(bitacoraRes.data.map((l: any) => ({
             id: l.id, userId: l.user_id, userName: l.user_name, action: l.action, details: l.details, timestamp: l.created_at
           })));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [currentUser]);

  const updateCompanySettings = async (settings: CompanySettings) => {
    const payload = {
      lender_id: currentUser?.id, name: settings.name, slogan: settings.slogan, rnc: settings.rnc,
      address: settings.address, phone: settings.phone, email: settings.email, currency: settings.currency,
      terms_and_conditions: settings.termsAndConditions
    };
    
    // Check if exists
    const { data: existing } = await insforge.database.from('company_settings').select('id').maybeSingle();
    
    if (existing) {
      await insforge.database.from('company_settings').update(payload).eq('id', existing.id);
    } else {
      await insforge.database.from('company_settings').insert(payload);
    }
    
    setCompanySettings(settings);
    addToast("Configuración guardada", "success");
  };

  const setGlobalCurrency = (currency: 'DOP' | 'USD') => {
    setGlobalCurrencyState(currency);
    updateCompanySettings({ ...companySettings, currency });
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    const newNotif: AppNotification = { ...notif, id: `notif-${Date.now()}`, date: new Date().toISOString(), read: false };
    setNotifications(prev => [newNotif, ...prev]);
  };
  
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addAuditLog = async (action: string, details: string) => {
    if (!currentUser) return;
    const log: AuditLog = {
      id: `log-${Date.now()}`, userId: currentUser.id, userName: currentUser.name || currentUser.email || 'Sistema',
      action, details, timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
    await insforge.database.from('bitacora_logs').insert({
      lender_id: currentUser.id, user_id: currentUser.id, user_name: currentUser.name || currentUser.email || 'Sistema',
      action, details
    });
  };

  const enqueuePdf = (job: Omit<PdfJob, 'id'>) => {
    setPdfQueue(prev => [...prev, { ...job, id: Math.random().toString(36).substr(2, 9) }]);
  };
  const removePdfJob = (id: string) => {
    setPdfQueue(prev => prev.filter(job => job.id !== id));
  };

  const exportSystemBackup = () => {
    return JSON.stringify({ auditLogs, companySettings }, null, 2);
  };
  
  const importSystemBackup = (_jsonContent: string) => {
    addToast("Usa el Centro de Migración para subir datos masivos", "info");
    return false;
  };

  return (
    <SettingsContext.Provider value={{
      companySettings, globalCurrency, auditLogs, notifications, pdfQueue,
      updateCompanySettings, setGlobalCurrency, addNotification, markNotificationAsRead,
      markAllNotificationsAsRead, addAuditLog, enqueuePdf, removePdfJob,
      exportSystemBackup, importSystemBackup
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
