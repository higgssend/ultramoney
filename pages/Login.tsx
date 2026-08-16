import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ChevronLeft, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { insforge } from '../lib/insforge';

import { open } from '@tauri-apps/plugin-shell';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
const REMEMBER_EMAIL_KEY = 'ultramoney_remembered_email';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'method' | 'email-form'>('method');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load remembered email on mount
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
      setStep('email-form');
    }
  }, []);

  // Listen for Deep Link OAuth Redirects in Tauri
  useEffect(() => {
    const isTauri = '__TAURI__' in window || '__TAURI_INTERNALS__' in window || window.navigator.userAgent.includes('Tauri');
    let unlisten: (() => void) | undefined;
    if (isTauri) {
      onOpenUrl((urls) => {
        if (urls.length > 0) {
          const url = urls[0];
          if (url.includes('#access_token=')) {
            window.location.hash = url.substring(url.indexOf('#'));
            navigate('/dashboard');
          }
        }
      }).then(fn => { unlisten = fn; }).catch(console.error);
    }
    return () => {
      if (unlisten) unlisten();
    };
  }, [navigate]);

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      type OAuthOptions = { provider: 'google' | 'apple'; redirectTo?: string; skipBrowserRedirect?: boolean };
      const isTauri = '__TAURI__' in window || '__TAURI_INTERNALS__' in window || window.navigator.userAgent.includes('Tauri');
      if (isTauri) {
        const { data, error } = await (insforge.auth.signInWithOAuth as (opts: OAuthOptions) => Promise<{ data?: { url?: string }; error?: Error | null }> )({
          provider,
          redirectTo: 'ultramoney://login',
          skipBrowserRedirect: true
        });
        if (error) throw error;
        if (data?.url) {
          await open(data.url);
        }
        return;
      }

      const { error } = await (insforge.auth.signInWithOAuth as (opts: OAuthOptions) => Promise<{ data?: { url?: string }; error?: Error | null }> )({
        provider,
        redirectTo: window.location.origin + '/dashboard'
      });
      if (error) throw error;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : `Error al iniciar sesión con ${provider}.`;
      setError(errorMsg);
    }
  };

  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResent, setOtpResent] = useState(false);

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) { setError('El código debe tener 6 dígitos.'); return; }
    setOtpLoading(true); setError('');
    try {
      const { error } = await insforge.auth.verifyEmail({ email: unverifiedEmail, otp: otpCode });
      if (error) throw error;
      
      // Auto login after verification
      const { data: loginData, error: loginErr } = await insforge.auth.signInWithPassword({
        email: unverifiedEmail,
        password,
      });
      if (loginErr) throw loginErr;

      if (loginData?.accessToken) {
        localStorage.setItem('um_access_token', loginData.accessToken);
        insforge.setAccessToken(loginData.accessToken);
      }
      if (loginData?.refreshToken) {
        localStorage.setItem('um_refresh_token', loginData.refreshToken);
      }

      if (loginData?.user) {
        type LoginUserShape = {
          id: string;
          email?: string;
          metadata?: Record<string, unknown>;
          user_metadata?: Record<string, unknown>;
          profile?: { name?: string; roleId?: string; roleIds?: string[] };
        };
        const u = loginData.user as LoginUserShape;
        const meta = u.metadata || u.user_metadata || {};
        const activeUser = {
          id: u.id,
          email: u.email || '',
          name: (u.profile?.name || meta.name || u.email || 'Usuario') as string,
          roleId: (meta.roleId || u.profile?.roleId || 'Admin') as string,
          username: (meta.username || u.email?.split('@')[0] || 'usuario') as string,
          roleIds: (Array.isArray(meta.roleIds) ? meta.roleIds : []) as string[]
        };
        localStorage.setItem('um_user_session', JSON.stringify(activeUser));
      }

      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código de verificación inválido o expirado.');
    } finally { setOtpLoading(false); }
  };

  const handleResendOtp = async () => {
    setOtpResent(false);
    try {
      await insforge.auth.resendVerificationEmail({ email: unverifiedEmail });
      setOtpResent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure no dead or expired bearer token interferes with login
      try {
        insforge.setAccessToken(null);
      } catch {
        // ignore
      }

      const cleanInput = email.trim().toLowerCase();
      const loginEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@app.ultramoney.com`;
      const { data, error } = await insforge.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        const msg = error.message || '';
        const next = error.nextActions;
        if (error.statusCode === 403 || msg.includes('verify') || (typeof next === 'string' && next.includes('verify')) || (Array.isArray(next) && next.includes('verify'))) {
          setUnverifiedEmail(loginEmail);
          setStep('method');
          // Automatically prompt for OTP verification
          setError('Tu correo aún no está verificado. Se ha enviado un código de 6 dígitos a tu correo para activar tu cuenta.');
          return;
        }
        throw error;
      }

      if (data?.accessToken) {
        localStorage.setItem('um_access_token', data.accessToken);
        insforge.setAccessToken(data.accessToken);
      }
      if (data?.refreshToken) {
        localStorage.setItem('um_refresh_token', data.refreshToken);
      }

      if (data?.user) {
        type LoginUserShape = {
          id: string;
          email?: string;
          metadata?: Record<string, unknown>;
          user_metadata?: Record<string, unknown>;
          profile?: { name?: string; roleId?: string; roleIds?: string[] };
        };
        const u = data.user as LoginUserShape;
        const meta = u.metadata || u.user_metadata || {};
        const activeUser = {
          id: u.id,
          email: u.email || '',
          name: (u.profile?.name || meta.name || u.email || 'Usuario') as string,
          roleId: (meta.roleId || u.profile?.roleId || 'Admin') as string,
          username: (meta.username || u.email?.split('@')[0] || 'usuario') as string,
          roleIds: (Array.isArray(meta.roleIds) ? meta.roleIds : []) as string[]
        };
        localStorage.setItem('um_user_session', JSON.stringify(activeUser));
      }

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, cleanInput);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      // Full reload so AuthContext picks up the session cleanly
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Credenciales inválidas. Por favor verifica tu correo y contraseña.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const leftPanel = (
    <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 p-16 text-white max-w-xl">
        <div className="flex items-center gap-3 mb-10">
          <img src="/logoultramoney.svg" alt="Ultramoney" className="w-10 h-10" />
          <span className="text-2xl font-black tracking-tight text-white">ultramoney</span>
        </div>
        <h1 className="text-5xl font-black mb-6 tracking-tight leading-tight">
          Control Total de <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">Tu Financiera.</span>
        </h1>
        <p className="text-lg text-slate-300 mb-10 leading-relaxed">
          Ultramoney es la plataforma definitiva para gestionar préstamos, cobranza y contabilidad en tiempo real. Rápido, seguro y eficiente.
        </p>

        <div className="flex gap-4">
          <div className="flex -space-x-4">
            {['A','B','C','D'].map((l, i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {l}
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-bold text-sm">Empresas confían</span>
            <span className="text-xs text-slate-400">en nuestra tecnología.</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {leftPanel}

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-y-auto">
        <button
          onClick={() => {
            if (step === 'email-form') setStep('method');
            else navigate('/');
          }}
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium z-20"
        >
          <ChevronLeft className="w-5 h-5" />
          {step === 'email-form' ? 'Elegir otro método' : 'Volver al Inicio'}
        </button>

        <div className="w-full max-w-md py-16 lg:py-0">
          
          {/* ── Step: Choose Method ── */}
          {step === 'method' && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <img src="/logoultramoney.svg" alt="Ultramoney Logo" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-3xl font-black text-slate-900">Iniciar Sesión</h2>
                <p className="text-slate-500 mt-2">Elige cómo quieres acceder a tu cuenta.</p>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />{error}
                </div>
              )}

              <div className="space-y-3">
                {/* Google */}
                <button
                  onClick={() => handleOAuthLogin('google')}
                  className="w-full flex items-center gap-4 px-5 py-4 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-left"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">Entrar con Google</p>
                    <p className="text-xs text-slate-400">Acceso instantáneo con tu cuenta Google</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 ml-auto transition-colors" />
                </button>

                {/* Apple */}
                <button
                  onClick={() => handleOAuthLogin('apple')}
                  className="w-full flex items-center gap-4 px-5 py-4 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-left"
                >
                  <svg className="w-5 h-5 flex-shrink-0 text-slate-900" viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">Entrar con Apple</p>
                    <p className="text-xs text-slate-400">Acceso con tu Apple ID</p>
                  </div>
                </button>
                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-slate-400 font-medium">O usa tu correo</span></div>
                </div>

                {/* Email */}
                <button
                  onClick={() => setStep('email-form')}
                  className="w-full flex items-center gap-4 px-5 py-4 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">Entrar con Correo</p>
                    <p className="text-xs text-slate-400">Inicia sesión con email y contraseña</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 ml-auto transition-colors" />
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-slate-500">
                  ¿No tienes una cuenta?{' '}
                  <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Regístrate gratis
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Email Form ── */}
          {step === 'email-form' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <img src="/logoultramoney.svg" alt="Ultramoney Logo" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-3xl font-black text-slate-900">Bienvenido de nuevo</h2>
                <p className="text-slate-500 mt-2">Ingresa tus datos para continuar.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                {unverifiedEmail && (
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-indigo-900">Verifica tu código de 6 dígitos</p>
                      <p className="text-xs text-indigo-700 mt-0.5">Enviado a <span className="font-semibold">{unverifiedEmail}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full text-center text-2xl font-mono tracking-widest px-3 py-3 border-2 border-indigo-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        placeholder="------"
                      />
                      <button
                        type="button"
                        onClick={handleOtpVerify}
                        disabled={otpLoading || otpCode.length !== 6}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all flex-shrink-0"
                      >
                        {otpLoading ? 'Verificando...' : 'Verificar'}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-indigo-600 font-medium hover:underline"
                      >
                        Reenviar código
                      </button>
                      {otpResent && <span className="text-emerald-600 font-bold">¡Código reenviado!</span>}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Usuario o Correo</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                        placeholder="ej. juanperez o correo@ejemplo.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-slate-700">Contraseña</label>
                      <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-all text-sm"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-slate-300 rounded cursor-pointer focus:ring-indigo-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                    Recordarme en este dispositivo
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Iniciando Sesión...
                    </>
                  ) : (
                    <>Iniciar Sesión con Correo <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-sm text-slate-500">
                  ¿No tienes una cuenta?{' '}
                  <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Regístrate gratis
                  </Link>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
