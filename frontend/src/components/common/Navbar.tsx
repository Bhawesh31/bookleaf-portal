import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  DollarSign,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-navy-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link
              to={user.role === 'admin' ? '/admin/dashboard' : '/author/dashboard'}
              className="flex items-center space-x-2.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-smooth">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-white">
                BookLeaf <span className="text-brand-400 font-normal">Publishing</span>
              </span>
            </Link>

            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                user.role === 'admin'
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                  : 'bg-brand-900/60 text-brand-300 border border-brand-700/50'
              }`}
            >
              {user.role === 'admin' ? 'Operations Admin' : 'Author Portal'}
            </span>
          </div>

          {/* Navigation links */}
          <div className="hidden md:flex items-center space-x-1">
            {user.role === 'author' ? (
              <>
                <Link
                  to="/author/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive('/author/dashboard')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/author/books"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive('/author/books')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>My Books</span>
                </Link>
                <Link
                  to="/author/royalties"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive('/author/royalties')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Royalties</span>
                </Link>
                <Link
                  to="/author/tickets"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive('/author/tickets')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  <span>My Tickets</span>
                </Link>
                <Link
                  to="/author/submit-ticket"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive('/author/submit-ticket')
                      ? 'bg-brand-600 text-white'
                      : 'bg-brand-600/90 text-white hover:bg-brand-600'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Raise Query</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive('/admin/dashboard')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Overview</span>
                </Link>
                <Link
                  to="/admin/queue"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive('/admin/queue')
                      ? 'bg-slate-800 text-brand-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  <span>Ticket Queue</span>
                </Link>
              </>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-200">{user.full_name}</div>
              <div className="text-xs text-slate-400 truncate max-w-[180px]">{user.email}</div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-red-950/40 hover:border-red-700 text-slate-300 hover:text-red-300 text-xs font-medium transition-smooth"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
