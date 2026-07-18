import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

const mockOnSuccess = vi.fn();
const mockOnSwitchToRegister = vi.fn();

vi.mock('../../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

import { login } from '../../api/auth';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    render(<LoginForm onSuccess={mockOnSuccess} onSwitchToRegister={mockOnSwitchToRegister} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} onSwitchToRegister={mockOnSwitchToRegister} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} onSwitchToRegister={mockOnSwitchToRegister} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('calls login on valid submission', async () => {
    const mockLogin = vi.mocked(login);
    mockLogin.mockResolvedValueOnce({
      user: { id: '1', email: 'a@b.com', name: 'Test', role: 'user', createdAt: '2024-01-01' },
      token: 'abc',
      expiresAt: '2099-01-01',
    });

    render(<LoginForm onSuccess={mockOnSuccess} onSwitchToRegister={mockOnSwitchToRegister} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows server error on failed login', async () => {
    const mockLogin = vi.mocked(login);
    mockLogin.mockRejectedValueOnce({ message: 'Invalid credentials' });

    render(<LoginForm onSuccess={mockOnSuccess} onSwitchToRegister={mockOnSwitchToRegister} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('calls onSwitchToRegister when link is clicked', () => {
    render(<LoginForm onSuccess={mockOnSuccess} onSwitchToRegister={mockOnSwitchToRegister} />);
    fireEvent.click(screen.getByText('Create one'));
    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const mockLogin = vi.mocked(login);
    mockLogin.mockImplementationOnce(() => new Promise(() => {}));

    render(<LoginForm onSuccess={mockOnSuccess} onSwitchToRegister={mockOnSwitchToRegister} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeDisabled();
    });
  });

  it('disables submit button while loading', async () => {
    const mockLogin = vi.mocked(login);
    mockLogin.mockImplementationOnce(() => new Promise(() => {}));

    render(<LoginForm onSuccess={mockOnSuccess} onSwitchToRegister={mockOnSwitchToRegister} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Sign In' });
      expect(button).toBeDisabled();
    });
  });
});
