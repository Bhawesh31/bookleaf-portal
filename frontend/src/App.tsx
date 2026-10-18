import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { Login } from './pages/Login';
import { AuthorDashboard } from './pages/author/Dashboard';
import { MyBooks } from './pages/author/MyBooks';
import { MyRoyalties } from './pages/author/MyRoyalties';
import { SubmitTicket } from './pages/author/SubmitTicket';
import { TicketList } from './pages/author/TicketList';
import { AuthorTicketDetail } from './pages/author/TicketDetail';

import { AdminDashboard } from './pages/admin/Dashboard';
import { TicketQueue } from './pages/admin/TicketQueue';
import { AdminTicketDetail } from './pages/admin/TicketDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'admin' ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Navigate to="/author/dashboard" replace />
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />
            <main className="flex-1 pb-16">
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<Login />} />

                {/* Author Portal Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['author']} />}>
                  <Route path="/author/dashboard" element={<AuthorDashboard />} />
                  <Route path="/author/books" element={<MyBooks />} />
                  <Route path="/author/royalties" element={<MyRoyalties />} />
                  <Route path="/author/submit-ticket" element={<SubmitTicket />} />
                  <Route path="/author/tickets" element={<TicketList />} />
                  <Route path="/author/tickets/:id" element={<AuthorTicketDetail />} />
                </Route>

                {/* Admin Portal Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/queue" element={<TicketQueue />} />
                  <Route path="/admin/tickets/:id" element={<AdminTicketDetail />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
