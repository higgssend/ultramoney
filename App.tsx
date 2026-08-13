import React, { useState, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import MobileNav from './components/MobileNav';
import { HiddenDocumentRenderer } from './components/HiddenDocumentRenderer';
import { StoreProvider, useAuth } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

// Dynamic Code Splitting with React.lazy
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Clients = React.lazy(() => import('./pages/Clients'));
const LoanRequest = React.lazy(() => import('./pages/LoanRequest').then(m => ({ default: m.default || (m as any).LoanRequest })));
const Accounting = React.lazy(() => import('./pages/Accounting'));
const CreditInquiry = React.lazy(() => import('./pages/CreditInquiry'));
const Loans = React.lazy(() => import('./pages/Loans'));
const Payments = React.lazy(() => import('./pages/Payments'));
const Overdue = React.lazy(() => import('./pages/Overdue'));
const Portfolio = React.lazy(() => import('./pages/Portfolio'));
const RoutesPage = React.lazy(() => import('./pages/Routes'));
const Employees = React.lazy(() => import('./pages/Employees'));
const Classification = React.lazy(() => import('./pages/Classification'));
const DeepAccounting = React.lazy(() => import('./pages/DeepAccounting'));
const Bitacora = React.lazy(() => import('./pages/Bitacora'));
const Profit = React.lazy(() => import('./pages/Profit'));
const BankAccountsPage = React.lazy(() => import('./pages/BankAccountsPage'));
const ClientDetail = React.lazy(() => import('./pages/ClientDetail'));
const DocumentPage = React.lazy(() => import('./pages/DocumentPage').then(m => ({ default: m.DocumentPage })));
const InventoryPage = React.lazy(() => import('./pages/Inventory').then(m => ({ default: m.InventoryPage })));
const LoanDetail = React.lazy(() => import('./pages/LoanDetail').then(m => ({ default: m.LoanDetail })));
const NewClient = React.lazy(() => import('./pages/NewClient'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const Login = React.lazy(() => import('./pages/Login'));
const EmployeeLogin = React.lazy(() => import('./pages/EmployeeLogin'));
const CompanyLogin = React.lazy(() => import('./pages/CompanyLogin').then(m => ({ default: m.CompanyLogin })));
const ClientPortals = React.lazy(() => import('./pages/ClientPortals'));
const ClientPortal = React.lazy(() => import('./pages/ClientPortal').then(m => ({ default: m.ClientPortal })));
const ReceiptView = React.lazy(() => import('./pages/ReceiptView').then(m => ({ default: m.ReceiptView })));
const PublicDocumentView = React.lazy(() => import('./pages/PublicDocumentView').then(m => ({ default: m.PublicDocumentView })));
const Register = React.lazy(() => import('./pages/Register'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Simulator = React.lazy(() => import('./pages/Simulator'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const HelpPage = React.lazy(() => import('./pages/Help'));
const MigrationCenter = React.lazy(() => import('./pages/MigrationCenter'));
const CreditBureauExport = React.lazy(() => import('./pages/CreditBureauExport'));

// Feature Pages Dynamic Imports
const CreditFeature = React.lazy(() => import('./pages/features/CreditFeature'));
const AccountingFeature = React.lazy(() => import('./pages/features/AccountingFeature'));
const NotificationsFeature = React.lazy(() => import('./pages/features/NotificationsFeature'));
const PermissionsFeature = React.lazy(() => import('./pages/features/PermissionsFeature'));
const SecurityFeature = React.lazy(() => import('./pages/features/SecurityFeature'));
const CloudFeature = React.lazy(() => import('./pages/features/CloudFeature'));
const MobileAppFeature = React.lazy(() => import('./pages/features/MobileAppFeature'));
const PricingFeature = React.lazy(() => import('./pages/features/PricingFeature'));
const ScalabilityFeature = React.lazy(() => import('./pages/features/ScalabilityFeature'));

// Initialize Core Web Vitals reporting
function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(metric.name, Math.round(metric.value));
  }
}
onCLS(reportWebVitals);
onINP(reportWebVitals);
onLCP(reportWebVitals);
onFCP(reportWebVitals);
onTTFB(reportWebVitals);

// Fallback Loader Component
const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 p-8">
    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Cargando módulo...</p>
  </div>
);

// Auth Guard Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoadingAuth } = useAuth();
  
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

// Public Only Guard Wrapper
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoadingAuth } = useAuth();
  
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
  const { currentUser } = useAuth();
  const location = useLocation();

  // Define routes where Sidebar/Layout should NOT appear
  const isFullScreenPage = 
    location.pathname === '/login' || 
    location.pathname === '/login-staff' || 
    location.pathname === '/register' || 
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/portal/') ||
    location.pathname.startsWith('/login/') ||
    location.pathname.startsWith('/recibo/') ||
    location.pathname.startsWith('/documento/') ||
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
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={("__TAURI__" in window || "__TAURI_INTERNALS__" in window || window.navigator.userAgent.includes('Tauri')) ? <Navigate to="/login" replace /> : <LandingPage />} />
                <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                <Route path="/login/:slug" element={<PublicOnlyRoute><CompanyLogin /></PublicOnlyRoute>} />
                <Route path="/login-staff" element={<PublicOnlyRoute><EmployeeLogin /></PublicOnlyRoute>} />
                <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
                <Route path="/portal/:clientId" element={<ClientPortal />} />
                <Route path="/recibo/:transactionId" element={<ReceiptView />} />
                <Route path="/documento/:docType/:loanId" element={<PublicDocumentView />} />
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
                <Route path="/clientes/editar/:id" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />
                <Route path="/documentos/:clientId" element={<ProtectedRoute><DocumentPage /></ProtectedRoute>} />
                <Route path="/inventario" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
                <Route path="/solicitudes" element={<ProtectedRoute><LoanRequest /></ProtectedRoute>} />
                <Route path="/prestamos" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
                <Route path="/prestamos/:id" element={<ProtectedRoute><LoanDetail /></ProtectedRoute>} />
                <Route path="/pagos" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                <Route path="/atrasos" element={<ProtectedRoute><Overdue /></ProtectedRoute>} />
                <Route path="/cartera" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                <Route path="/rutas" element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
                <Route path="/empleados" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                <Route path="/clasificacion" element={<ProtectedRoute><Classification /></ProtectedRoute>} />
                <Route path="/contabilidad" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
                <Route path="/contabilidad-avanzada" element={<ProtectedRoute><DeepAccounting /></ProtectedRoute>} />
                <Route path="/caja" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
                <Route path="/bancos" element={<ProtectedRoute><BankAccountsPage /></ProtectedRoute>} />
                <Route path="/bitacora" element={<ProtectedRoute><Bitacora /></ProtectedRoute>} />
                <Route path="/ganancias" element={<ProtectedRoute><Profit /></ProtectedRoute>} />
                <Route path="/nuevo-cliente" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />
                <Route path="/facturas" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                <Route path="/portales-clientes" element={<ProtectedRoute><ClientPortals /></ProtectedRoute>} />
                <Route path="/configuracion" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/migracion" element={<ProtectedRoute><MigrationCenter /></ProtectedRoute>} />
                <Route path="/buro-credito" element={<ProtectedRoute><CreditBureauExport /></ProtectedRoute>} />
                
                {/* Fallback Catch-all Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
        
        {/* Mobile Navigation Footer (Only if logged in and sidebar is closed) */}
        {!isFullScreenPage && !isSidebarOpen && currentUser && <MobileNav />}

        {/* Global Renderers */}
        <HiddenDocumentRenderer />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
