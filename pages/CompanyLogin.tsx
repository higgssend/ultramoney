import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/StoreContext';
import { insforge } from '../lib/insforge';
import { Lock, User as UserIcon, Building2, ArrowRight, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';

export const CompanyLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, loginEmployee, logout } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!slug) return;
      setIsChecking(true);
      try {
        const { data, error: dbError } = await insforge.database
          .from('company_settings')
          .select('name, logourl, custom_link')
          .eq('custom_link', slug.toLowerCase())
          .maybeSingle();
          
        if (data && !dbError) {
          setCompanyName(data.name || 'UltraMoney');
          setLogoUrl(data.logourl || '');
        } else {
          // Fallback check if slug matches general default
          if (slug.toLowerCase() === 'ultramoney') {
            setCompanyName('UltraMoney Financial');
          } else {
            setError(`No encontramos una empresa registrada con el enlace personalizado "/login/${slug}".`);
          }
        }
      } catch {
        setError('Error de conexión al cargar los datos de la empresa.');
      }
      setIsChecking(false);
    };
    fetchCompanyData();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, ingresa tu usuario y contraseña/PIN.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // 1. Try Employee PIN / Username Login first
      const isEmp = await loginEmployee(username.trim(), password.trim());
      if (isEmp) {
        navigate('/dashboard');
        return;
      }

      // 2. Try InsForge Auth sign-in
      const possibleEmails = [
        username.includes('@') ? username.trim() : `${username.trim()}@${slug}.ultramoney.com`,
        `${username.trim()}@app.ultramoney.com`,
        `${username.trim()}@ultramoney.local`
      ];

      let authSuccess = false;
      for (const email of possibleEmails) {
        const { data: authData, error: authErr } = await insforge.auth.signInWithPassword({
          email,
          password: password.trim()
        });
        if (authData?.user && !authErr) {
          authSuccess = true;
          break;
        }
      }

      if (authSuccess) {
        navigate('/dashboard');
      } else {
        setError('Credenciales incorrectas. Verifica tu usuario y contraseña o PIN asignado.');
      }
    } catch {
      setError('Error al procesar el inicio de sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-bold mt-4 uppercase tracking-wider">Cargando portal...</p>
      </div>
    );
  }

  if (error && !companyName) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center text-white">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold mb-2">Empresa no encontrada</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            Ir al Login General
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Active Session Warning Bar if User is already Logged In */}
      {currentUser && (
        <div className="w-full max-w-md mb-4 bg-indigo-950/80 border border-indigo-800/80 backdrop-blur-md text-indigo-200 text-xs p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">Sesión: <strong>{currentUser.name || currentUser.email}</strong></span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link 
              to="/dashboard" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
            >
              <LayoutDashboard className="w-3 h-3" /> Panel
            </Link>
            <button 
              onClick={() => logout()} 
              title="Cerrar sesión actual"
              className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full text-white relative z-10">
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-16 mx-auto mb-4 object-contain rounded-xl" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-lg shadow-indigo-600/30">
              {companyName ? companyName.charAt(0).toUpperCase() : <Building2 className="w-8 h-8" />}
            </div>
          )}
          <h1 className="text-2xl font-black text-white tracking-tight">{companyName}</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Portal Oficial de Sucursal y Empleados</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl mb-6 text-xs font-medium leading-relaxed animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Usuario o Correo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                required 
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                placeholder="ej. carlos.cobrador"
                value={username} 
                onChange={e => setUsername(e.target.value.toLowerCase().trim())}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña o PIN de Empleado
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="password" 
                required 
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <Link to="/login" className="text-xs text-slate-500 hover:text-indigo-400 transition-colors">
            ¿Eres administrador principal? Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogin;
