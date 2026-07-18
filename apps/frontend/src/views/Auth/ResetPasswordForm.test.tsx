import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPasswordForm } from './ResetPasswordForm';

const mockOnSuccess = vi.fn();

vi.mock('../../api/auth', () => ({
  resetPassword: vi.fn(),
}));

import { resetPassword } from '../../api/auth';

describe('ResetPasswordForm', () => {
  const token = 'reset-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders password fields and submit button', () => {
    render(<ResetPasswordForm token={token} onSuccess={mockOnSuccess} />);
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ResetPasswordForm token={token} onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(<ResetPasswordForm token={token} onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    render(<ResetPasswordForm token={token} onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls resetPassword on valid submission', async () => {
    const mockReset = vi.mocked(resetPassword);
    mockReset.mockResolvedValueOnce({ message: 'Password reset' });

    render(<ResetPasswordForm token={token} onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({ token, password: 'password123' });
    });
  });

  it('shows success state after completion', async () => {
    const mockReset = vi.mocked(resetPassword);
    mockReset.mockResolvedValueOnce({ message: 'Password reset' });

    render(<ResetPasswordForm token={token} onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password reset successful')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });
  });

  it('shows server error on failure', async () => {
    const mockReset = vi.mocked(resetPassword);
    mockReset.mockRejectedValueOnce({ message: 'Invalid or expired token' });

    render(<ResetPasswordForm token={token} onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
    });
  });

  it('calls onSuccess when clicking sign in after success', async () => {
    const mockReset = vi.mocked(resetPassword);
    mockReset.mockResolvedValueOnce({ message: 'Password reset' });

    render(<ResetPasswordForm token={token} onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password reset successful')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(mockOnSuccess).toHaveBeenCalled();
  });
});
