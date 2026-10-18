import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Lock, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';
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
      const user = await login({ email: email.trim(), password });
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

  const [showDirectory, setShowDirectory] = useState(false);

  const demoAccounts = [
    { id: 'AUTH001', name: 'Priya Sharma', email: 'priya.sharma@email.com', role: 'Author (2 Live Titles)' },
    { id: 'AUTH002', name: 'Rohit Kapoor', email: 'rohit.kapoor@email.com', role: 'Author (2 Live Titles)' },
    { id: 'AUTH003', name: 'Ananya Reddy', email: 'ananya.reddy@email.com', role: 'Author (Unpaid Royalties)' },
    { id: 'AUTH004', name: 'Vikram Joshi', email: 'vikram.joshi@email.com', role: 'Author (2 Live Titles)' },
    { id: 'AUTH005', name: 'Meera Nair', email: 'meera.nair@email.com', role: 'Author (2 Live Titles)' },
    { id: 'AUTH006', name: 'Arjun Malhotra', email: 'arjun.malhotra@email.com', role: 'Author (1 Live Title)' },
    { id: 'AUTH007', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@email.com', role: 'Author (Book in Production)' },
    { id: 'AUTH008', name: 'Farhan Sheikh', email: 'farhan.sheikh@email.com', role: 'Author (1 Live Title)' },
    { id: 'AUTH009', name: 'Kavita Deshmukh', email: 'kavita.deshmukh@email.com', role: 'Author (2 Live Titles)' },
    { id: 'AUTH010', name: 'Diya Chatterjee', email: 'diya.chatterjee@email.com', role: 'Author (2 Live Titles)' },
    { id: 'admin', name: 'Operations Administrator', email: 'admin@bookleaf.com', role: 'Operations Desk' },
  ];

  const handleSelectDemo = (identifier: string, isAdm: boolean) => {
    setEmail(identifier);
    setPassword(isAdm ? 'AdminSecure@2026' : 'AuthorDemo@2026');
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
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email Address or Author ID
                </label>
                <span className="text-[11px] text-slate-400">e.g. AUTH002</span>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 bg-white placeholder-slate-400"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 bg-white placeholder-slate-400"
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

          {/* Collapsible Demo Accounts Directory */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDirectory(!showDirectory)}
              className="w-full flex items-center justify-between py-1.5 text-xs font-medium text-slate-600 hover:text-brand-600 transition-colors"
            >
              <span>Demo Accounts Directory (All 10 Authors &amp; Admin)</span>
              <span className="text-[11px] font-semibold text-brand-600">
                {showDirectory ? '▲ Hide' : '▼ Show'}
              </span>
            </button>

            {showDirectory && (
              <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto pr-1">
                <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 mb-2 border border-slate-200">
                  Click any account below to autofill credentials (or sign in using their <strong>Author ID</strong> directly):
                </div>
                {demoAccounts.map((acc) => {
                  const isAdm = acc.id === 'admin';
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectDemo(acc.email, isAdm)}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-smooth ${
                        isAdm
                          ? 'bg-purple-50/70 border-purple-200 hover:bg-purple-100'
                          : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          {acc.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isAdm
                              ? 'bg-purple-200 text-purple-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {acc.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between">
                        <span>{acc.email}</span>
                        <span className="text-slate-400">{acc.role}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure TLS Encrypted Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};
