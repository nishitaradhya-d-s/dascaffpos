import React, { useState } from 'react';
import { CafeSettings } from '../../types';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (rememberMe: boolean) => void;
  settings: CafeSettings;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim();
      const cleanPass = password.trim();

      // Official staff credentials: DASCAFF / rakdas@098 (or admin/admin)
      if (
        (cleanUser.toUpperCase() === 'DASCAFF' && cleanPass === 'rakdas@098') ||
        (cleanUser.toLowerCase() === 'admin' && cleanPass === 'admin')
      ) {
        onLoginSuccess(rememberMe);
      } else {
        setError('Invalid Staff Login ID or Password. Please check and try again.');
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#F4F1EE] text-[#2D241E] p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white border border-[#E0D7D0] rounded-xl p-6 sm:p-8 shadow-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-[#4B3621] text-amber-200 flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-xs font-cinzel">
            DC
          </div>
          <h1 className="text-2xl font-bold text-[#2D241E] tracking-wide uppercase font-cinzel">
            {settings.cafeName}
          </h1>
          <p className="text-xs text-[#4B3621] font-semibold mt-1 tracking-wider uppercase">
            {settings.tagline || 'Al Dhawq Wal Madaaq'}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#F4F1EE] border border-[#E0D7D0] text-[11px] text-[#8B7E74] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Staff POS Terminal</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#2D241E] uppercase tracking-wider mb-1.5">
              Login ID / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8B7E74] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Staff Login ID"
                required
                autoFocus
                className="w-full bg-white border border-[#E0D7D0] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#2D241E] font-medium focus:outline-hidden focus:border-[#4B3621]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D241E] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8B7E74] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                required
                className="w-full bg-white border border-[#E0D7D0] rounded-lg py-2.5 pl-10 pr-10 text-sm text-[#2D241E] font-medium focus:outline-hidden focus:border-[#4B3621]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7E74] hover:text-[#2D241E] transition-colors p-1 cursor-pointer"
                title={showPassword ? 'Hide Password' : 'View Password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#8B7E74] pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded-md border-[#E0D7D0] text-[#4B3621] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="text-[#2D241E]">Remember this device</span>
            </label>
            <span className="text-[11px] text-[#8B7E74]">Authorized Staff Only</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white font-bold rounded-lg text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to POS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="mt-6 text-center text-xs text-[#8B7E74]">
        © {new Date().getFullYear()} {settings.cafeName} • POS &amp; GST Invoicing Engine
      </div>
    </div>
  );
};
