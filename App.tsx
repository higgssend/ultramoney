
import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import MobileNav from './components/MobileNav';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import LoanRequest from './pages/LoanRequest';

import Accounting from './pages/Accounting';
import CreditInquiry from './pages/CreditInquiry';
import Loans from './pages/Loans';
import Payments from './pages/Payments';
import Overdue from './pages/Overdue';
import Portfolio from './pages/Portfolio';
import RoutesPage from './pages/Routes';
import Employees from './pages/Employees';
import Classification from './pages/Classification';
import DeepAccounting from './pages/DeepAccounting';
import Bitacora from './pages/Bitacora';
import Profit from './pages/Profit';
import ClientDetail from './pages/ClientDetail';
import NewClient from './pages/NewClient';
import Invoices from './pages/Invoices';
import Login from './pages/Login';
import EmployeeLogin from './pages/EmployeeLogin';
import ClientPortals from './pages/ClientPortals';
import { ClientPortal } from './pages/ClientPortal';
import { ReceiptView } from './pages/ReceiptView';
import { HiddenDocumentRenderer } from './components/HiddenDocumentRenderer';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Simulator from './pages/Simulator'; 
import LandingPage from './pages/LandingPage';
import HelpPage from './pages/Help';
import MigrationCenter from './pages/MigrationCenter';
import { StoreProvider, useStore } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

// Initialize Core Web Vitals reporting
function reportWebVitals(metric: any) {
  // En producción, aquí podrías enviar estas métricas a Google Analytics (GA4) o tu propio servidor.
  if (process.env.NODE_ENV !== 'production') {
    console.log(metric.name, Math.round(metric.value));
  }
}
onCLS(reportWebVitals);
onINP(reportWebVitals);
onLCP(reportWebVitals);
onFCP(reportWebVitals);
onTTFB(reportWebVitals);


// Feature Pages Imports
import CreditFeature from './pages/features/CreditFeature';
import AccountingFeature from './pages/features/AccountingFeature';
import NotificationsFeature from './pages/features/NotificationsFeature';
import PermissionsFeature from './pages/features/PermissionsFeature';
import SecurityFeature from './pages/features/SecurityFeature';
import CloudFeature from './pages/features/CloudFeature';
import MobileAppFeature from './pages/features/MobileAppFeature';
import PricingFeature from './pages/features/PricingFeature';
import ScalabilityFeature from './pages/features/ScalabilityFeature';

// Auth Guard Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoadingAuth } = useStore();
  
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Public Only Guard Wrapper (Redirects to dashboard if logged in)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoadingAuth } = useStore();
  
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser } = useStore();
  const location = useLocation();

  // Define routes where Sidebar/Layout should NOT appear
  const isFullScreenPage = 
    location.pathname === '/login' || 
    location.pathname === '/login-staff' || 
    location.pathname === '/register' || 
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/portal/') ||
    location.pathname.startsWith('/recibo/') ||
    location.pathname === '/ayuda' ||
    location.pathname.startsWith('/features/') || 
    location.pathname === '/';

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 ${isFullScreenPage ? 'overflow-auto' : 'overflow-hidden'}`}>
      
      {/* Only show Sidebar if logged in and not on full screen pages */}
      {!isFullScreenPage && currentUser && (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}
      
      {/* Main Content Area */}
      <main className={`flex-1 h-full transition-all relative overflow-y-auto overflow-x-hidden`}>
        
        {/* Top Header (Only if logged in) */}
        {!isFullScreenPage && currentUser && (
          <TopHeader onMenuClick={() => setIsSidebarOpen(true)} />
        )}

        {/* Inner Content Wrapper */}
        <div className={`${!isFullScreenPage && currentUser ? 'p-4 md:p-8 pb-24 md:pb-8' : ''}`}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/login-staff" element={<PublicOnlyRoute><EmployeeLogin /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/portal/:clientId" element={<ClientPortal />} />
            <Route path="/recibo/:transactionId" element={<ReceiptView />} />
            <Route path="/ayuda" element={<HelpPage />} />

            {/* Feature Routes (Public) */}
            <Route path="/features/consulta" element={<CreditFeature />} />
            <Route path="/features/contabilidad" element={<AccountingFeature />} />
            <Route path="/features/notificaciones" element={<NotificationsFeature />} />
            <Route path="/features/permisos" element={<PermissionsFeature />} />
            <Route path="/features/seguridad" element={<SecurityFeature />} />
            <Route path="/features/nube" element={<CloudFeature />} />
            <Route path="/features/app-movil" element={<MobileAppFeature />} />
            <Route path="/features/precios" element={<PricingFeature />} />
            <Route path="/features/escalabilidad" element={<ScalabilityFeature />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/consultar" element={<ProtectedRoute><CreditInquiry /></ProtectedRoute>} />
            <Route path="/solicitud" element={<ProtectedRoute><LoanRequest /></ProtectedRoute>} />
            <Route path="/simulador" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/clientes/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
            <Route path="/clientes/nuevo" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />
            <Route path="/clientes/editar/:id" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />
            <Route path="/prestamos" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
            <Route path="/facturas" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/pagos" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/atrasos" element={<ProtectedRoute><Overdue /></ProtectedRoute>} />
            <Route path="/caja" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
            <Route path="/cartera" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/gastos" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
            <Route path="/ganancia" element={<ProtectedRoute><Profit /></ProtectedRoute>} />
            <Route path="/empleados" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/clasificacion" element={<ProtectedRoute><Classification /></ProtectedRoute>} />
            <Route path="/contabilidad" element={<ProtectedRoute><DeepAccounting /></ProtectedRoute>} />
            <Route path="/bitacora" element={<ProtectedRoute><Bitacora /></ProtectedRoute>} />
            <Route path="/portales" element={<ProtectedRoute><ClientPortals /></ProtectedRoute>} />
            <Route path="/migracion" element={<ProtectedRoute><MigrationCenter /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
      </main>

      {!isFullScreenPage && currentUser && (
        <MobileNav onMenuClick={() => setIsSidebarOpen(true)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <StoreProvider>
        <HiddenDocumentRenderer />
        <AppContent />
      </StoreProvider>
    </ToastProvider>
  );
};

export default App;
