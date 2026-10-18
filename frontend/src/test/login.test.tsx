import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { Login } from '../pages/Login';

describe('Login Component', () => {
  it('renders login form inputs and title', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('BookLeaf Publishing Portal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('author@email.com or admin@bookleaf.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('autofills Priya Sharma demo account when clicked', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    const priyaButton = screen.getByText(/Priya Sharma/i);
    fireEvent.click(priyaButton);

    const emailInput = screen.getByPlaceholderText('author@email.com or admin@bookleaf.com') as HTMLInputElement;
    expect(emailInput.value).toBe('priya.sharma@email.com');
  });

  it('autofills Administrator demo account when clicked', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    const adminButton = screen.getByText(/Operations Administrator/i);
    fireEvent.click(adminButton);

    const emailInput = screen.getByPlaceholderText('author@email.com or admin@bookleaf.com') as HTMLInputElement;
    expect(emailInput.value).toBe('admin@bookleaf.com');
  });
});
