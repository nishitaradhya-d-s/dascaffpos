import React, { useState } from 'react';
import { CafeSettings } from '../../types';
import { verifyManagerPassword, setManagerUnlocked } from '../../utils/storage';
import { Lock, ShieldCheck, X, ArrowRight, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';

interface ManagerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  settings: CafeSettings;
  targetSectionTitle?: string;
}

export const ManagerAuthModal: React.FC<ManagerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  settings,
  targetSectionTitle = 'Manager Section',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (verifyManagerPassword(password, settings)) {
        setManagerUnlocked(true);
        setPassword('');
        setError('');
        setLoading(false);
        onSuccess();
      } else {
        setError('Incorrect Manager Password. Please enter valid authorization code.');
        setLoading(false);
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E0D7D0] rounded-xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#4B3621] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 text-amber-200 flex items-center justify-center font-bold shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">Manager Authentication</h3>
              <p className="text-[11px] text-amber-200/80 font-medium">Access to {targetSectionTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-[#8B7E74] leading-relaxed bg-[#F4F1EE] border border-[#E0D7D0] rounded-lg p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#4B3621] shrink-0 mt-0.5" />
            <span>
              Bill Register, GST Reports, Menu Rates, and System Settings are password protected. Enter manager password to proceed.
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#2D241E] uppercase tracking-wider mb-1.5">
              Manager Password / PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#8B7E74] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Manager Password"
                required
                autoFocus
                className="w-full bg-white border border-[#E0D7D0] rounded-lg py-2 pl-10 pr-10 text-sm text-[#2D241E] font-medium focus:outline-hidden focus:border-[#4B3621]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7E74] hover:text-[#2D241E] transition-colors p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 bg-white hover:bg-[#F4F1EE] text-[#2D241E] border border-[#E0D7D0] font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Verifying...' : 'Unlock & Access'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
