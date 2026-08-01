import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { insforge } from '../lib/insforge';

export const CompanyLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { login } = useStore();
  
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
        const { data, error } = await insforge.database
          .from('company_settings')
          .select('name, logoUrl')
          .eq('custom_link', slug)
          .single();
          
        if (data && !error) {
          setCompanyName(data.name);
          setLogoUrl(data.logoUrl || '');
        } else {
          setError('Empresa no encontrada.');
        }
      } catch (e) {
        setError('Error al cargar datos de la empresa.');
      }
      setIsChecking(false);
    };
    fetchCompanyData();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    // Construct the ghost email
    const email = `${username}@${slug}.ultramoney.com`;
    const success = await login(email, password);
    
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos.');
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !companyName) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Página no encontrada</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            Ir a la página principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-16 mx-auto mb-4 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              {companyName.charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800">{companyName}</h1>
          <p className="text-slate-500 mt-1">Portal de Empleados</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Usuario</label>
            <input 
              type="text" 
              required 
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="ej. juanperez"
              value={username} 
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
