import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Building2,
  PhoneCall,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { authService } from '../services/auth';
import { AuthUser, StoreProfile } from '../types/erp';

interface LoginViewProps {
  store: StoreProfile;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ store, onLoginSuccess }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginId.trim()) {
      setError('Please enter your Login ID or registered Mobile Number.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = authService.login(loginId, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Invalid credentials. Please verify your ID and Password.');
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Subtle Background Architectural Glows & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Header Banner */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 font-extrabold flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
            SW
          </div>
          <div>
            <div className="text-sm font-extrabold text-white tracking-wide uppercase">
              {store.name}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Enterprise Resource Planning & Ledger System
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{store.address}</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{store.mobile}</span>
          </span>
        </div>
      </header>

      {/* Central Login Authentication Card */}
      <div className="w-full max-w-md my-auto relative z-10 py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
          {/* Card Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Access Only</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Sign In to Terminal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to manage wholesale billing, stock & ledgers.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Login ID / Username
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 absolute left-3.5 top-3 transition-colors" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter your user ID..."
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 hover:text-slate-300 cursor-default">
                  Support: {store.mobile}
                </span>
              </div>
              <div className="relative group">
                <KeyRound className="w-4 h-4 text-slate-400 group-focus-within:text-amber-400 absolute left-3.5 top-3 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 p-0.5 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-400">Remember this terminal</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                v2.5 Security
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In Securely</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Enterprise Protection Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>256-Bit SSL Encrypted Session</span>
            </span>
            <span className="text-slate-400">
              Cloud Sync Active
            </span>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <footer className="w-full max-w-5xl py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 relative z-10 border-t border-slate-800/60">
        <div>
          © {new Date().getFullYear()} {store.name} • Barabanki, Uttar Pradesh
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Wholesale Patang & Manjha Ledger</span>
          <span>•</span>
          <span>Helpline: <strong className="text-slate-400">{store.mobile}</strong></span>
        </div>
      </footer>
    </div>
  );
};
