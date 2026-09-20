import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Key,
  UserPlus,
  ArrowRight,
  User,
  Sparkles,
  Lock
} from 'lucide-react';
import { useSyncStore } from '@/lib/sync';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';

export function LoginPage() {
  const navigate = useNavigate();
  const isConfigured = useSyncStore((s) => s.isConfigured);
  const signUp = useSyncStore((s) => s.signUp);
  const logIn = useSyncStore((s) => s.logIn);
  const showToast = useUIStore((s) => s.showToast);

  const profile = useSettingsStore((s) => s.profile);
  const setProfileName = useSettingsStore((s) => s.setProfileName);
  const { theme } = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>(isConfigured ? 'login' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(profile.name || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTheme = () => {
    updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });
  };

  const handleGuestAccess = () => {
    if (name.trim()) {
      setProfileName(name.trim());
    } else {
      setProfileName('Creator');
    }
    localStorage.setItem('lifeassist_bypass_login', 'true');
    showToast('Logged in locally as guest.', 'success');
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      handleGuestAccess();
      return;
    }

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (authMode === 'signup') {
        if (name.trim()) {
          setProfileName(name.trim());
        }
        await signUp(email, password);
        showToast('Account created and sync linked successfully.', 'success');
      } else {
        await logIn(email, password);
        showToast('Signed in successfully.', 'success');
      }
      localStorage.setItem('lifeassist_bypass_login', 'true');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication.');
      showToast('Authentication failed.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden flex flex-col justify-between font-body text-ink-primary">
      {/* Background Grid Lines & Blur */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-cyan/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-indigo/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.05] bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/jelly-logo.png" alt="Jelly" className="h-9 w-9 rounded-xl object-cover border border-cyan-400/40 shadow-lg shadow-cyan-500/30" />
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
            Jelly
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-ink-muted hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 my-8">
        <div className="w-full max-w-4xl rounded-3xl border border-white/[0.08] bg-[#0c111d]/90 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Panel: Gradient Highlight Brand Panel */}
          <div className="p-8 md:p-12 bg-gradient-to-br from-accent-cyan via-sky-600 to-accent-indigo flex flex-col justify-between relative overflow-hidden">
            {/* Ambient specular sheet */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.08] via-transparent to-white/[0.02] pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-3 mb-10">
                <img src="/jelly-logo.png" alt="Jelly" className="h-10 w-10 rounded-xl object-cover border border-white/40 shadow-xl" />
                <span className="font-display font-extrabold text-2xl text-white tracking-tight">
                  Jelly
                </span>
              </div>

              <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-tight mb-4 tracking-tight">
                Your AI Personal <br />
                <span className="text-white/80">Operating System</span>
              </h1>
              <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed">
                Securely manage your daily tasks, notes, reminders, habits, and calendar events — all in one private, intelligent assistant space.
              </p>

              <ul className="space-y-4 text-white/90 text-sm">
                <li className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white shrink-0">
                    <Check size={14} />
                  </span>
                  <span>End-to-end encrypted cloud sync</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white shrink-0">
                    <Check size={14} />
                  </span>
                  <span>Intelligent AI-powered recommendations</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white shrink-0">
                    <Check size={14} />
                  </span>
                  <span>Real-time habits and productivity tracking</span>
                </li>
              </ul>
            </div>

            <div className="mt-12 text-xs text-white/60 font-medium">
              Made by Saimanideep
            </div>
          </div>

          {/* Right Panel: Interactive Login Form Panel */}
          <div className="p-8 md:p-12 flex flex-col justify-between">
            <div>
              {/* Tab Toggle Switchers */}
              {isConfigured && (
                <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl mb-8">
                  <button
                    onClick={() => { setAuthMode('login'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      authMode === 'login' 
                        ? 'bg-accent-cyan text-white shadow-glow border border-accent-cyan/10' 
                        : 'text-ink-muted hover:text-white'
                    }`}
                  >
                    <Key size={14} />
                    Sign In
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      authMode === 'signup' 
                        ? 'bg-accent-cyan text-white shadow-glow border border-accent-cyan/10' 
                        : 'text-ink-muted hover:text-white'
                    }`}
                  >
                    <UserPlus size={14} />
                    Create Account
                  </button>
                </div>
              )}

              {/* Title Section */}
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-display font-semibold tracking-tight text-white">
                  {authMode === 'login' ? 'Welcome back, ' : 'Get started with '}
                  <span className="text-accent-cyan font-bold">Creator</span>
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {authMode === 'login' 
                    ? 'Enter your email and password to sync your account.' 
                    : 'Configure your credentials to sync tasks across all devices.'}
                </p>
              </div>

              {/* Form Section */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-accent-rose/10 border border-accent-rose/25 text-xs rounded-xl flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-accent-rose">
                      <span className="font-bold shrink-0">⚠️ Error:</span>
                      <span className="leading-relaxed">{error}</span>
                    </div>
                    {(error.includes('configuration-not-found') || error.includes('operation-not-allowed')) && (
                      <div className="mt-1 pt-3 border-t border-accent-rose/20 text-ink-primary space-y-2.5">
                        <p className="font-semibold text-accent-amber flex items-center gap-1.5">
                          <Sparkles size={14} className="animate-pulse" /> Firebase Configuration Needed:
                        </p>
                        <p className="text-ink-muted leading-relaxed">
                          Your Firebase project console has not enabled the <strong>Email/Password</strong> sign-in method.
                        </p>
                        <div className="text-xs text-ink-muted leading-relaxed space-y-1">
                          <p>To fix this and enable syncing:</p>
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>Open the <a href="https://console.firebase.google.com/project/life-assist-8934f/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline font-medium">Firebase Auth Providers Console</a>.</li>
                            <li>Enable <strong>Email/Password</strong> authentication.</li>
                          </ol>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleGuestAccess}
                            className="w-full py-2.5 px-3 rounded-lg bg-accent-cyan hover:bg-accent-cyan/90 text-black font-bold text-xs transition-colors shadow-glow"
                          >
                            Bypass & Continue to App in Offline Mode
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Name Input Field for signup or guest modes */}
                {(authMode === 'signup' || !isConfigured) && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-ink-muted mb-1.5">
                      Your Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-10 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-accent-cyan/60 focus:border-accent-cyan/60 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email / Password Inputs (Show only when Firebase is configured) */}
                {isConfigured ? (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-ink-muted mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
                          <User size={16} />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="w-full pl-10 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-accent-cyan/60 focus:border-accent-cyan/60 transition-all"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-ink-muted mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
                          <Lock size={16} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-10 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-accent-cyan/60 focus:border-accent-cyan/60 transition-all"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-faint hover:text-white transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3.5 bg-accent-cyan/5 border border-accent-cyan/15 text-ink-primary text-xs rounded-xl flex flex-col gap-1.5 leading-relaxed">
                    <p className="font-semibold text-accent-cyan flex items-center gap-1.5">
                      <Sparkles size={14} /> Firebase Sync is Offline
                    </p>
                    <p className="text-ink-muted">
                      Your database will save locally. Set Firebase VITE keys in your <code>.env</code> file to enable real-time cloud synchronization.
                    </p>
                  </div>
                )}

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-accent-cyan hover:bg-accent-cyan/90 text-black font-semibold px-4 py-3 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Prominent Offline Guest Bypass Button */}
                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleGuestAccess}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium px-4 py-3 text-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    Continue Offline as Guest
                  </button>
                )}
              </form>
            </div>

            {/* Offline Guest Option / Tab Toggle footers */}
            <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
              {isConfigured ? (
                <div className="space-y-4">
                  <button
                    onClick={handleGuestAccess}
                    className="text-xs text-ink-muted hover:text-white transition-colors underline underline-offset-4 cursor-pointer"
                  >
                    Continue to App as Guest (Local Offline)
                  </button>

                  <p className="text-xs text-ink-muted">
                    {authMode === 'login' ? (
                      <>
                        Don't have an account?{' '}
                        <button
                          onClick={() => { setAuthMode('signup'); setError(null); }}
                          className="text-accent-cyan hover:underline font-semibold cursor-pointer"
                        >
                          Create one
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button
                          onClick={() => { setAuthMode('login'); setError(null); }}
                          className="text-accent-cyan hover:underline font-semibold cursor-pointer"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleGuestAccess}
                  className="text-xs text-accent-cyan font-semibold hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  Start using Jelly (Offline)
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Grid footer spacing */}
      <div className="h-6 pointer-events-none" />
    </div>
  );
}
