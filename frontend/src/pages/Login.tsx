import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, KeyRound, Lock, Mail, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expired = searchParams.get('expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/author/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          BookLeaf Publishing Portal
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Sign in to access your author dashboard or operations desk
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/80">
          {expired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="author@email.com or admin@bookleaf.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-smooth"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Demo Bootstrap Accounts Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Test Demo Credentials</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('priya.sharma@email.com', 'AuthorDemo@2026')}
                className="text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-xs transition-smooth group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-brand-800">
                  Priya Sharma <span className="text-slate-400 font-normal">(Author AUTH001)</span>
                </div>
                <div className="text-slate-500 text-[11px]">priya.sharma@email.com • 2 Published Books</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('sneha.kulkarni@email.com', 'AuthorDemo@2026')}
                className="text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-xs transition-smooth group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-brand-800">
                  Sneha Kulkarni <span className="text-slate-400 font-normal">(Author AUTH007)</span>
                </div>
                <div className="text-slate-500 text-[11px]">sneha.kulkarni@email.com • Includes Book in Production</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin@bookleaf.com', 'AdminSecure@2026')}
                className="text-left px-3 py-2 rounded-lg bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200 hover:border-purple-300 text-xs transition-smooth group"
              >
                <div className="font-semibold text-purple-900 group-hover:text-purple-950 flex items-center justify-between">
                  <span>Operations Administrator</span>
                  <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded">Admin</span>
                </div>
                <div className="text-purple-700 text-[11px]">admin@bookleaf.com • Full Support Workbench</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
