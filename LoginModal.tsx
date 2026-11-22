import { AlertCircle, KeyRound, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SAMPLE_CREDENTIALS } from '../constants/sampleData';
import type { UserAccount } from '../types/reservation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Authentication failed.');
        return;
      }
      onLoginSuccess(data.user);
      setUsername('');
      setPassword('');
      onClose();
    } catch {
      setError('Unable to reach authentication server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const applyCredential = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-dialog-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="login-dialog-title" className="text-lg font-semibold text-slate-900">
              Sign In to Oasis Rail
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Enter your passenger or operator credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="modal-username" className="block text-sm font-medium text-slate-700 mb-1.5">
              Username
            </label>
            <input
              id="modal-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. passenger1"
              autoComplete="username"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
            />
          </div>

          <div>
            <label htmlFor="modal-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            {submitting ? 'Verifying...' : 'Sign In'}
          </button>

          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sample Test Accounts (click to fill)</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_CREDENTIALS.map((cred) => (
                <button
                  key={cred.username}
                  type="button"
                  onClick={() => applyCredential(cred.username, cred.password)}
                  className="flex items-center justify-between px-3 py-2 text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="font-medium text-slate-900">
                    {cred.fullName} ({cred.role})
                  </span>
                  <span className="font-mono text-slate-600">
                    {cred.username} / {cred.password}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
