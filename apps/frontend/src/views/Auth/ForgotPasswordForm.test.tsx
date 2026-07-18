import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const mockOnBackToLogin = vi.fn();

vi.mock('../../api/auth', () => ({
  forgotPassword: vi.fn(),
}));

import { forgotPassword } from '../../api/auth';

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email field and submit button', () => {
    render(<ForgotPasswordForm onBackToLogin={mockOnBackToLogin} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    render(<ForgotPasswordForm onBackToLogin={mockOnBackToLogin} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<ForgotPasswordForm onBackToLogin={mockOnBackToLogin} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows success state after submission', async () => {
    const mockForgot = vi.mocked(forgotPassword);
    mockForgot.mockResolvedValueOnce({ message: 'Reset link sent' });

    render(<ForgotPasswordForm onBackToLogin={mockOnBackToLogin} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Send Reset Link' })).not.toBeInTheDocument();
    });
  });

  it('shows server error on failure', async () => {
    const mockForgot = vi.mocked(forgotPassword);
    mockForgot.mockRejectedValueOnce({ message: 'Email not found' });

    render(<ForgotPasswordForm onBackToLogin={mockOnBackToLogin} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument();
    });
  });

  it('calls onBackToLogin when link is clicked', () => {
    render(<ForgotPasswordForm onBackToLogin={mockOnBackToLogin} />);
    fireEvent.click(screen.getByText('Sign in'));
    expect(mockOnBackToLogin).toHaveBeenCalled();
  });
});
