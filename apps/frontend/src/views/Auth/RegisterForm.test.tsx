import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from './RegisterForm';

const mockOnSuccess = vi.fn();
const mockOnSwitchToLogin = vi.fn();

vi.mock('../../api/auth', () => ({
  register: vi.fn(),
}));

import { register } from '../../api/auth';

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls register on valid submission', async () => {
    const mockRegister = vi.mocked(register);
    mockRegister.mockResolvedValueOnce({
      user: { id: '1', email: 'a@b.com', name: 'Test User', role: 'user', createdAt: '2024-01-01' },
      token: 'abc',
      expiresAt: '2099-01-01',
    });

    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'a@b.com',
        password: 'password123',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows server error on failed registration', async () => {
    const mockRegister = vi.mocked(register);
    mockRegister.mockRejectedValueOnce({ message: 'Email already in use' });

    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });

  it('calls onSwitchToLogin when link is clicked', () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onSwitchToLogin={mockOnSwitchToLogin} />);
    fireEvent.click(screen.getByText('Sign in'));
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });
});
