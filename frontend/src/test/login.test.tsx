import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { Login } from '../pages/Login';

describe('Login Component', () => {
  it('renders login form inputs, title, and secure badge', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('BookLeaf Publishing Portal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText(/Secure TLS Encrypted Access/i)).toBeInTheDocument();
  });

  it('allows entering email and password manually into form inputs', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email address') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••••••') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecretPassword123' } });

    expect(emailInput.value).toBe('user@example.com');
    expect(passwordInput.value).toBe('SecretPassword123');
  });

  it('does not display any auto-login or 1-click credential buttons', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.queryByText(/1-Click Test Demo Credentials/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Priya Sharma/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sneha Kulkarni/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Operations Administrator/i)).not.toBeInTheDocument();
  });
});
