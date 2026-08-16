import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompanySettings, AuditLog, AppNotification, PdfJob } from '../../types';
import type { AuditLogDB, NotificationDB } from '../../types.db';
import { insforge } from '../../lib/insforge';
import { useToast } from '../ToastContext';
import { useAuth } from './AuthContext';
import { logger } from '../../utils/logger';

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
  exportSystemBackup?: () => string;
  importSystemBackup?: (json: string) => boolean;
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Local storage caching isolated per user
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(`um_notifications_${currentUser.id}`, JSON.stringify(notifications));
    }
  }, [notifications, currentUser?.id]);

  useEffect(() => {
    if (!currentUser) {
      setCompanySettings(initialCompanySettings);
      setAuditLogs([]);
      setNotifications([]);
      return;
    }

    // Reset previous user's settings immediately to prevent stale cross-user leaks
    setCompanySettings(initialCompanySettings);
    setAuditLogs([]);
    setNotifications([]);

    const fetchSettingsAndData = async () => {
      try {
        const [settingsRes, bitacoraRes, notifRes] = await Promise.all([
          insforge.database.from('company_settings').select('*').eq('lender_id', currentUser.id).maybeSingle(),
          insforge.database.from('bitacora_logs').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }),
          insforge.database.from('notifications').select('*').eq('lender_id', currentUser.id).order('created_at', { ascending: false }).limit(50)
        ]);

        if (settingsRes.data) {
          setCompanySettings({
            name: settingsRes.data.name, slogan: settingsRes.data.slogan, rnc: settingsRes.data.rnc,
            address: settingsRes.data.address, phone: settingsRes.data.phone, email: settingsRes.data.email,
            currency: settingsRes.data.currency || 'DOP', termsAndConditions: settingsRes.data.terms_and_conditions,
            logoUrl: settingsRes.data.logourl, customLink: settingsRes.data.custom_link
          });
          if (settingsRes.data.currency === 'USD') setGlobalCurrencyState('USD');
        } else {
          setCompanySettings(initialCompanySettings);
        }

        if (bitacoraRes.data) {
           setAuditLogs((bitacoraRes.data as AuditLogDB[]).map((l) => ({
             id: l.id,
             userId: l.user_id || '',
             userName: l.user_name || 'Sistema',
             action: l.action || '',
             details: l.details || '',
             timestamp: l.timestamp || new Date().toISOString()
           })));
        }

        if (notifRes.data && notifRes.data.length > 0) {
          const dbNotifs: AppNotification[] = (notifRes.data as NotificationDB[]).map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: (n.type as AppNotification['type']) || 'info',
            read: Boolean(n.read),
            link: n.link || undefined,
            date: n.created_at || new Date().toISOString()
          }));
          setNotifications(dbNotifs);
        } else {
          // If no notifications exist in DB for this lender, create initial welcome
          const welcomeNotifId = `notif-welcome-${currentUser.id}`;
          const welcomeNotif: AppNotification = {
            id: welcomeNotifId,
            title: 'Bienvenido a UltraMoney',
            message: 'Su sistema de préstamos y tesorería está activo y sincronizado en la nube.',
            date: new Date().toISOString(),
            read: false,
            type: 'info'
          };
          setNotifications([welcomeNotif]);

          void (async () => {
            try {
              await insforge.database.from('notifications').insert([{
                id: welcomeNotifId,
                lender_id: currentUser.id,
                user_id: currentUser.id,
                title: welcomeNotif.title,
                message: welcomeNotif.message,
                type: welcomeNotif.type,
                read: false
              }]);
            } catch (err) {
              logger.error("Error creating initial notification in DB:", err);
            }
          })();
        }
      } catch (error) {
        logger.error("Error fetching settings and notifications:", error);
      }
    };
    fetchSettingsAndData();
  }, [currentUser]);

  const updateCompanySettings = async (settings: CompanySettings) => {
    if (!currentUser) return;
    const formattedSlug = settings.customLink ? settings.customLink.toLowerCase().trim().replace(/[^a-z0-9-]/g, '') : null;
    
    const payload = {
      lender_id: currentUser.id,
      name: settings.name,
      slogan: settings.slogan,
      rnc: settings.rnc,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      currency: settings.currency,
      terms_and_conditions: settings.termsAndConditions,
      logourl: settings.logoUrl || null,
      custom_link: formattedSlug
    };
    
    try {
      // Check if exists for this lender
      const { data: existing } = await insforge.database
        .from('company_settings')
        .select('lender_id')
        .eq('lender_id', currentUser.id)
        .maybeSingle();
      
      if (existing) {
        const { error } = await insforge.database
          .from('company_settings')
          .update(payload)
          .eq('lender_id', currentUser.id);
        if (error) logger.error("Error updating company_settings:", error);
      } else {
        const { error } = await insforge.database
          .from('company_settings')
          .insert([payload]);
        if (error) logger.error("Error inserting company_settings:", error);
      }
    } catch (err) {
      logger.error("Database company settings save exception:", err);
    }
    
    const finalSettings: CompanySettings = {
      ...settings,
      customLink: formattedSlug || undefined
    };

    setCompanySettings(finalSettings);
    addAuditLog('settings_updated', `Actualizó la configuración de la empresa (${finalSettings.name})`);
    addToast("Configuración guardada exitosamente en la nube", "success");
  };

  const setGlobalCurrency = (currency: 'DOP' | 'USD') => {
    setGlobalCurrencyState(currency);
    updateCompanySettings({ ...companySettings, currency });
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    const newNotifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newNotif: AppNotification = { 
      ...notif, 
      id: newNotifId, 
      date: new Date().toISOString(), 
      read: false 
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (currentUser) {
      void (async () => {
        try {
          await insforge.database.from('notifications').insert([{
            id: newNotifId,
            lender_id: currentUser.id,
            user_id: currentUser.id,
            title: newNotif.title,
            message: newNotif.message,
            type: newNotif.type,
            read: false,
            link: newNotif.link || null
          }]);
        } catch (err) {
          logger.error('Error inserting notification to DB:', err);
        }
      })();
    }
  };
  
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (currentUser) {
      void (async () => {
        try {
          await insforge.database
            .from('notifications')
            .update({ read: true, updated_at: new Date().toISOString() })
            .eq('id', id);
        } catch (err) {
          logger.error('Error marking notification as read in DB:', err);
        }
      })();
    }
  };
  
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (currentUser) {
      void (async () => {
        try {
          await insforge.database
            .from('notifications')
            .update({ read: true, updated_at: new Date().toISOString() })
            .eq('lender_id', currentUser.id)
            .eq('read', false);
        } catch (err) {
          logger.error('Error marking all notifications as read in DB:', err);
        }
      })();
    }
  };

  const addAuditLog = async (action: string, details: string) => {
    if (!currentUser) return;
    const { data, error } = await insforge.database.from('bitacora_logs').insert([{
      lender_id: currentUser.id,
      user_id: currentUser.id,
      user_name: currentUser.name || currentUser.email || 'Sistema',
      action,
      details
    }]).select().single();

    const newLog: AuditLog = {
      id: data?.id || `log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email || 'Sistema',
      action,
      details,
      timestamp: data?.created_at || new Date().toISOString()
    };

    setAuditLogs(prev => [newLog, ...prev]);
    if (error) {
      logger.error("Error guardando bitácora:", error);
    }
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
