import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Upload, ArrowRight, ShieldCheck } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useAuth, useSettings } from '../context/StoreContext';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { updateCompanySettings } = useSettings();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    rnc: '',
    address: '',
    phone: '',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Protect route if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if user has settings
      const { data: existing } = await insforge.database.from('company_settings').select('lender_id').eq('lender_id', currentUser?.id).single();

      if (existing) {
        await insforge.database.from('company_settings').update({
          name: formData.name,
          slogan: formData.slogan,
          rnc: formData.rnc,
          address: formData.address,
          phone: formData.phone,
          logoUrl: formData.logoUrl
        }).eq('lender_id', currentUser?.id);
      } else {
        await insforge.database.from('company_settings').insert([{
          lender_id: currentUser?.id,
          name: formData.name,
          slogan: formData.slogan,
          rnc: formData.rnc,
          address: formData.address,
          phone: formData.phone,
          logoUrl: formData.logoUrl
        }]);
      }

      // Update local state if needed
      updateCompanySettings({
        ...formData,
        email: currentUser?.email || '',
        currency: 'RD$',
        termsAndConditions: 'El incumplimiento de pago generará mora.'
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side Info */}
        <div className="w-full md:w-1/3 bg-indigo-600 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Detalles de tu Financiera</h2>
            <p className="text-indigo-200 text-sm">
              Configura los datos básicos de tu negocio. Esto aparecerá en los contratos y recibos de tus clientes.
            </p>
          </div>
          
          <div className="mt-8 flex items-center gap-2 text-indigo-200 text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Datos seguros en InsForge</span>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-2/3 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm border border-rose-100">
                    {error}
                </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Empresa</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                placeholder="Ej. Inversiones Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Slogan (Opcional)</label>
              <input
                type="text"
                value={formData.slogan}
                onChange={e => setFormData({...formData, slogan: e.target.value})}
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                placeholder="Tu socio de confianza"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">RNC / Cédula</label>
                <input
                  type="text"
                  value={formData.rnc}
                  onChange={e => setFormData({...formData, rnc: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  placeholder="000-0000000-0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  placeholder="(809) 000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                placeholder="Av. Principal #123"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">URL del Logo (Opcional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                  className="flex-1 border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  placeholder="https://ejemplo.com/logo.png"
                />
                <button type="button" className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button 
                type="button" 
                onClick={handleSkip}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 underline"
              >
                Omitir por ahora
              </button>

              <button 
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-transform transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/30 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Comenzar a usar'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
