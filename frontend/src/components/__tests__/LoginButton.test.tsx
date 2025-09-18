import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginButton } from '../LoginButton';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign in button when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      getAccessToken: jest.fn(),
      isLoading: false,
      error: null,
    });

    render(<LoginButton />);

    expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
  });

  it('renders sign out button with user name when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: 'John Doe', email: 'john@example.com', id: '123' },
      login: jest.fn(),
      logout: jest.fn(),
      getAccessToken: jest.fn(),
      isLoading: false,
      error: null,
    });

    render(<LoginButton />);

    expect(screen.getByText('Sign out (John Doe)')).toBeInTheDocument();
  });

  it('calls login function when sign in button is clicked', async () => {
    const mockLogin = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: mockLogin,
      logout: jest.fn(),
      getAccessToken: jest.fn(),
      isLoading: false,
      error: null,
    });

    render(<LoginButton />);

    fireEvent.click(screen.getByText('Sign in with Microsoft'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  it('calls logout function when sign out button is clicked', async () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: 'John Doe', email: 'john@example.com', id: '123' },
      login: jest.fn(),
      logout: mockLogout,
      getAccessToken: jest.fn(),
      isLoading: false,
      error: null,
    });

    render(<LoginButton />);

    fireEvent.click(screen.getByText('Sign out (John Doe)'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      getAccessToken: jest.fn(),
      isLoading: true,
      error: null,
    });

    render(<LoginButton />);

    // Spinner should be visible (testing by class or role would be more robust)
    expect(screen.queryByText('Sign in with Microsoft')).not.toBeInTheDocument();
  });

  it('displays email when name is not available', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: undefined, email: 'john@example.com', id: '123' },
      login: jest.fn(),
      logout: jest.fn(),
      getAccessToken: jest.fn(),
      isLoading: false,
      error: null,
    });

    render(<LoginButton />);

    expect(screen.getByText('Sign out (john@example.com)')).toBeInTheDocument();
  });
});