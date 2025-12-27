import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const {
    isAuthenticated,
    currentUser,
    login,
    logout,
    register,
    addToWishlist,
    removeFromWishlist,
    addToFavorites,
    removeFromFavorites,
  } = useAuth();

  const handleLogin = async () => {
    try {
      await login('aisha@example.com', 'password123');
    } catch (e) {
      // Handle error silently in tests
    }
  };

  const handleRegister = async () => {
    try {
      await register('New User', 'new@example.com', 'password123');
    } catch (e) {
      // Handle error silently in tests
    }
  };

  return (
    <div>
      <p data-testid="is-authenticated">{isAuthenticated.toString()}</p>
      <p data-testid="current-user">{currentUser?.name || 'null'}</p>
      <p data-testid="user-email">{currentUser?.email || 'null'}</p>
      <p data-testid="wishlist">{JSON.stringify(currentUser?.wishlist || [])}</p>
      <p data-testid="favorites">{JSON.stringify(currentUser?.favorites || [])}</p>
      <p data-testid="is-plus-member">{currentUser?.isPlusMember?.toString() || 'false'}</p>
      <button onClick={handleLogin}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={handleRegister}>Register</button>
      <button onClick={() => addToWishlist(100)}>Add to Wishlist</button>
      <button onClick={() => removeFromWishlist(100)}>Remove from Wishlist</button>
      <button onClick={() => addToFavorites(200)}>Add to Favorites</button>
      <button onClick={() => removeFromFavorites(200)}>Remove from Favorites</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('provides initial unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('current-user')).toHaveTextContent('null');
  });

  it('logs in user successfully', async () => {
    const mockUser = {
      id: 1,
      name: 'Aisha Rahman',
      email: 'aisha@example.com',
      wishlist: [2, 4],
      orderHistory: [],
      favorites: [1, 3],
      isPlusMember: true,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');

    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('current-user')).toHaveTextContent('Aisha Rahman');
    expect(screen.getByTestId('is-plus-member')).toHaveTextContent('true');
  });

  it('logs out user successfully', async () => {
    const mockUser = {
      id: 1,
      name: 'Aisha Rahman',
      email: 'aisha@example.com',
      wishlist: [],
      orderHistory: [],
      favorites: [],
      isPlusMember: false,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // First login
    const loginButton = screen.getByText('Login');
    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // Then logout
    const logoutButton = screen.getByText('Logout');
    act(() => {
      fireEvent.click(logoutButton);
    });

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('current-user')).toHaveTextContent('null');
  });

  it('registers new user successfully', async () => {
    const mockNewUser = {
      id: 3,
      name: 'New User',
      email: 'new@example.com',
      wishlist: [],
      orderHistory: [],
      favorites: [],
      isPlusMember: false,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNewUser),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');

    await act(async () => {
      fireEvent.click(registerButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('current-user')).toHaveTextContent('New User');
    expect(screen.getByTestId('user-email')).toHaveTextContent('new@example.com');
  });

  it('adds item to wishlist when authenticated', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      wishlist: [],
      orderHistory: [],
      favorites: [],
      isPlusMember: false,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockUser, wishlist: [100] }),
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login first
    const loginButton = screen.getByText('Login');
    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // Add to wishlist
    const addWishlistButton = screen.getByText('Add to Wishlist');
    await act(async () => {
      fireEvent.click(addWishlistButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('wishlist')).toHaveTextContent('[100]');
    });
  });
});
