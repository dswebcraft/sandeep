import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck 
} from 'lucide-react';
import { authService } from '../services/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!oldPassword) {
      setError('Purana (Current) Password enter karein.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setError('Naya password kam se kam 4 characters ka hona chahiye.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Naya password aur Confirm password match nahi kar rahe.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = authService.changePassword(oldPassword, newPassword);
      if (res.success) {
        onSuccess('Password safaltapoorvak change ho gaya hai!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setError(res.error || 'Password update nahi ho paya.');
      }
      setLoading(false);
    }, 250);
  };

  const creds = authService.getCredentials();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Change Login Password</h3>
              <p className="text-xs text-slate-400">User Login ID: <strong className="text-amber-400 font-mono">{creds.loginId}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Purana (Current) Password <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                required
                placeholder="Current password daalein..."
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 pr-10 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Naya Password <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="Minimum 4 characters..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 pr-10 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Confirm Naya Password <span className="text-amber-400">*</span>
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              required
              placeholder="Naya password dobara enter karein..."
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span>Updating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
