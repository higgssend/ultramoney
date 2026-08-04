import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, User, Lock, ArrowRight, Building2 } from 'lucide-react';
import { useAuth } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';

const EmployeeLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginEmployee } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await loginEmployee(username, pin);
      if (success) {
        addToast("Sesión iniciada correctamente", 'success');
        navigate('/dashboard'); 
      } else {
        addToast("Usuario o PIN incorrectos", 'error');
      }
    } catch (error) {
      addToast("Error al conectar con el servidor", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-secondary text-white tracking-tight">Portal de Personal</h1>
            <p className="text-indigo-100 mt-2">Acceso exclusivo para empleados</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Usuario Asignado</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                  placeholder="Ej. juan.perez"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">PIN de Acceso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none text-2xl tracking-[0.5em] font-mono"
                  placeholder="••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !pin}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Verificando...' : 'Entrar al Portal'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
