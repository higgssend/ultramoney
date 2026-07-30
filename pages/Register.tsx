import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ChevronLeft, Lock, Eye, EyeOff, CheckCircle, ShieldCheck, ArrowRight, User } from 'lucide-react';
import { insforge } from '../lib/insforge';

// ─── Password Helpers ───────────────────────────────────────────
const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Muy débil', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Débil', color: 'bg-orange-500' };
  if (score === 3) return { score, label: 'Aceptable', color: 'bg-yellow-500' };
  if (score === 4) return { score, label: 'Fuerte', color: 'bg-indigo-500' };
  return { score, label: 'Muy fuerte', color: 'bg-indigo-700' };
};

const validatePassword = (pw: string): string | null => {
  if (pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(pw)) return 'Debe incluir al menos una letra mayúscula.';
  if (!/[0-9]/.test(pw)) return 'Debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Debe incluir al menos un símbolo (!@#$%...).';
  return null;
};

// ─── OTP Verification Step ──────────────────────────────────────
const OtpVerificationStep: React.FC<{ email: string; onSuccess: () => void; }> = ({ email, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('El código debe tener 6 dígitos.'); return; }
    setLoading(true); setError('');
    try {
      const { error } = await insforge.auth.verifyEmail({ email, otp });
      if (error) throw error;
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código inválido o expirado.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResent(false);
    try {
      await insforge.auth.resendVerificationEmail({ email });
      setResent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código.');
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Verifica tu correo</h2>
        <p className="text-slate-500 mt-2 text-sm">
          Enviamos un código de 6 dígitos a <span className="font-semibold text-slate-700">{email}</span>.<br />
          Introdúcelo a continuación para activar tu cuenta.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />{error}
        </div>
      )}
      {resent && (
        <div className="bg-indigo-50 text-indigo-700 p-4 rounded-xl text-sm font-medium border border-indigo-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ¡Código reenviado! Revisa tu bandeja de entrada.
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Código de Verificación</label>
          <input
            type="text" inputMode="numeric" maxLength={6} required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="block w-full text-center text-3xl font-mono tracking-[0.5em] px-4 py-4 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-all"
            placeholder="------"
            autoComplete="one-time-code"
          />
        </div>
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>Verificando...</>
          ) : 'Verificar y Activar Cuenta'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500">
        ¿No recibiste el código?{' '}
        <button onClick={handleResend} className="font-bold text-indigo-600 hover:underline">Reenviar código</button>
      </p>
    </div>
  );
};

// ─── Terms & Conditions Modal ───────────────────────────────────
const TermsModal: React.FC<{ onAccept: () => void; onClose: () => void }> = ({ onAccept, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-900">Términos y Políticas</h3>
        <p className="text-sm text-slate-500 mt-1">Por favor lee y acepta antes de continuar</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 space-y-4 leading-relaxed">
        <h4 className="font-bold text-slate-800">Términos de Servicio</h4>
        <p>Al registrarte en Ultramoney, aceptas usar la plataforma exclusivamente para la gestión legítima de préstamos financieros en cumplimiento con la legislación de tu país.</p>
        <p>Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades realizadas bajo tu cuenta.</p>
        <h4 className="font-bold text-slate-800">Política de Privacidad</h4>
        <p>Ultramoney recopila y procesa datos personales de tus clientes bajo tu responsabilidad como controlador de datos. Nos comprometemos a proteger la información con encriptación de nivel bancario (SSL/TLS).</p>
        <p>No vendemos ni compartimos datos personales con terceros no autorizados. Los datos están alojados en servidores seguros con copias de seguridad automáticas.</p>
        <h4 className="font-bold text-slate-800">Uso Aceptable</h4>
        <p>Está prohibido usar la plataforma para actividades ilegales, incluyendo lavado de dinero, tasas de interés usurarias o cualquier práctica financiera que viole la ley local.</p>
      </div>
      <div className="p-6 border-t border-slate-100 flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors text-sm">Cancelar</button>
        <button onClick={onAccept} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-800 transition-all text-sm">
          Acepto los Términos
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Register Component ────────────────────────────────────
const Register: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'method' | 'email-form' | 'otp'>('method');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingOAuth, setPendingOAuth] = useState<'google' | 'apple' | null>(null);

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(formData.password);

  const triggerOAuth = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await insforge.auth.signInWithOAuth({
        provider,
        redirectTo: window.location.origin + '/onboarding'
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Error al registrarse con ${provider}.`);
    }
  };

  const handleOAuthClick = (provider: 'google' | 'apple') => {
    if (!acceptedTerms) {
      setPendingOAuth(provider);
      setShowTermsModal(true);
      return;
    }
    triggerOAuth(provider);
  };

  const handleTermsAccept = () => {
    setAcceptedTerms(true);
    setShowTermsModal(false);
    if (pendingOAuth) {
      triggerOAuth(pendingOAuth);
      setPendingOAuth(null);
    }
  };

  const handleEmailClick = () => {
    if (!acceptedTerms) {
      setPendingOAuth(null);
      setShowTermsModal(true);
      return;
    }
    setStep('email-form');
  };

  const handleTermsModalAcceptForEmail = () => {
    setAcceptedTerms(true);
    setShowTermsModal(false);
    setStep('email-form');
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pwError = validatePassword(formData.password);
    if (pwError) { setError(pwError); return; }
    if (formData.password !== formData.confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    try {
      const { data, error } = await insforge.auth.signUp({ email: formData.email, password: formData.password, name: formData.name });
      if (error) throw error;
      
      // If accessToken exists, email confirmations are disabled and user is logged in.
      if (data?.accessToken) {
        navigate('/onboarding');
      } else {
        setRegisteredEmail(formData.email);
        setStep('otp');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar usuario. Intenta de nuevo.');
    } finally { setLoading(false); }
  };

  const leftPanel = (
    <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="relative z-10 p-16 text-white max-w-xl">
        <div className="flex items-center gap-3 mb-10">
          <img src="/logoultramoney_logooriginaldegradadomorado.svg" alt="Ultramoney" className="w-10 h-10" />
          <span className="text-2xl font-black tracking-tight text-white">ultramoney</span>
        </div>
        <h1 className="text-5xl font-black mb-6 tracking-tight leading-tight">
          Comienza a<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">Crecer Hoy.</span>
        </h1>
        <p className="text-lg text-slate-300 mb-10 leading-relaxed">
          Únete a Ultramoney y lleva la gestión de tu financiera al siguiente nivel con herramientas profesionales.
        </p>
        {['Gestión completa de préstamos', 'Portal en tiempo real para clientes', 'Contratos y garantías digitales', 'Reportes y contabilidad integrada'].map((feat, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <span className="text-slate-300 text-sm">{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {showTermsModal && (
        <TermsModal
          onAccept={pendingOAuth ? handleTermsAccept : handleTermsModalAcceptForEmail}
          onClose={() => { setShowTermsModal(false); setPendingOAuth(null); }}
        />
      )}

      {leftPanel}

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-y-auto">
        <button
          onClick={() => {
            if (step === 'otp') setStep('email-form');
            else if (step === 'email-form') setStep('method');
            else navigate('/');
          }}
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium z-20"
        >
          <ChevronLeft className="w-5 h-5" />
          {step === 'otp' ? 'Volver' : step === 'email-form' ? 'Elegir otro método' : 'Volver al Inicio'}
        </button>

        <div className="w-full max-w-md py-16 lg:py-0">

          {/* ── Step: Choose Method ── */}
          {step === 'method' && (
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <img src="/logoultramoney_logooriginaldegradadomorado.svg" alt="Ultramoney Logo" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-3xl font-black text-slate-900">Crear Cuenta</h2>
                <p className="text-slate-500 mt-2">Elige cómo quieres registrarte.</p>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />{error}
                </div>
              )}

              <div className="space-y-3">
                {/* Google */}
                <button
                  onClick={() => handleOAuthClick('google')}
                  className="w-full flex items-center gap-4 px-5 py-4 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-left"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">Continuar con Google</p>
                    <p className="text-xs text-slate-400">Inicio de sesión instantáneo con tu cuenta Google</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 ml-auto transition-colors" />
                </button>

                {/* Apple */}
                <button
                  onClick={() => handleOAuthClick('apple')}
                  className="w-full flex items-center gap-4 px-5 py-4 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-left"
                >
                  <svg className="w-5 h-5 flex-shrink-0 text-slate-900" viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">Continuar con Apple</p>
                    <p className="text-xs text-slate-400">Inicio de sesión con tu Apple ID</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 ml-auto transition-colors" />
                </button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-slate-400 font-medium">O usa tu correo</span></div>
                </div>

                {/* Email */}
                <button
                  onClick={handleEmailClick}
                  className="w-full flex items-center gap-4 px-5 py-4 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">Registrarme con Correo</p>
                    <p className="text-xs text-slate-400">Crea tu cuenta con email y contraseña segura</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 ml-auto transition-colors" />
                </button>
              </div>

              {/* Terms inline note */}
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Al continuar, aceptarás nuestros{' '}
                <button onClick={() => setShowTermsModal(true)} className="text-indigo-600 hover:underline font-medium">Términos de Servicio</button>{' '}
                y{' '}
                <button onClick={() => setShowTermsModal(true)} className="text-indigo-600 hover:underline font-medium">Política de Privacidad</button>.
              </p>

              <div className="text-center">
                <p className="text-sm text-slate-500">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Iniciar Sesión</Link>
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Email Form ── */}
          {step === 'email-form' && (
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <img src="/logoultramoney_logooriginaldegradadomorado.svg" alt="Ultramoney Logo" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-3xl font-black text-slate-900">Registrarme con Correo</h2>
                <p className="text-slate-500 mt-2">Completa tus datos para crear tu cuenta.</p>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmitEmail} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text" required value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                      placeholder="Tu Nombre Completo"
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email" required value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'} required value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                      placeholder="Mínimo 8 caracteres, mayúscula, número y símbolo"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= strength.score ? strength.color : 'bg-slate-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">Seguridad: <span className="font-semibold">{strength.label}</span></p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Confirmar Contraseña</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'} required value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:outline-none transition-all text-sm ${formData.confirmPassword && formData.confirmPassword !== formData.password ? 'border-rose-400 focus:ring-rose-400 focus:border-rose-400' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'}`}
                      placeholder="Repite tu contraseña"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Las contraseñas coinciden
                    </p>
                  )}
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    id="terms" type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="h-4 w-4 mt-0.5 text-indigo-600 border-slate-300 rounded cursor-pointer focus:ring-indigo-500"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer select-none leading-relaxed">
                    He leído y acepto los{' '}
                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-indigo-600 hover:underline font-semibold">Términos de Servicio</button>{' '}
                    y la{' '}
                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-indigo-600 hover:underline font-semibold">Política de Privacidad</button>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !acceptedTerms}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>Creando cuenta...</>
                  ) : <><User className="w-4 h-4" />Crear Cuenta con Correo</>}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-slate-500">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Iniciar Sesión</Link>
                </p>
              </div>
            </div>
          )}

          {/* ── Step: OTP ── */}
          {step === 'otp' && (
            <OtpVerificationStep
              email={registeredEmail}
              onSuccess={() => navigate('/onboarding')}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
