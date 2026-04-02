import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

const loginUser = {
  id: 1,
  name: 'Aisha Rahman',
  email: 'aisha@example.com',
  wishlist: [],
  orderHistory: [],
  favorites: [],
  isPlusMember: false,
};

const loginPayload = {
  token: 'header.eyJleHAiOjQ3NDIyNjE2MDB9.signature',
  user: loginUser,
};

const signupPayload = {
  token: 'header.eyJleHAiOjQ3NDIyNjE2MDB9.signature',
  user: {
    id: 3,
    name: 'New User',
    email: 'new@example.com',
    wishlist: [],
    orderHistory: [],
    favorites: [],
    isPlusMember: false,
  },
};

const TestComponent: React.FC = () => {
  const {
    isAuthenticated,
    currentUser,
    login,
    logout,
    signup,
    addToWishlist,
    removeFromWishlist,
    favoritePet,
    unfavoritePet,
  } = useAuth();

  const handleLogin = async () => {
    try {
      await login('aisha@example.com', 'password123');
    } catch {
      // no-op
    }
  };

  const handleSignup = async () => {
    try {
      await signup('New User', 'new@example.com', 'password123');
    } catch {
      // no-op
    }
  };

  return (
    <div>
      <p data-testid="is-authenticated">{isAuthenticated.toString()}</p>
      <p data-testid="current-user">{currentUser?.name || 'null'}</p>
      <p data-testid="user-email">{currentUser?.email || 'null'}</p>
      <p data-testid="wishlist">{JSON.stringify(currentUser?.wishlist || [])}</p>
      <p data-testid="favorites">{JSON.stringify(currentUser?.favorites || [])}</p>

      <button onClick={handleLogin}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={handleSignup}>Signup</button>
      <button onClick={() => addToWishlist(100)}>Add Wishlist</button>
      <button onClick={() => removeFromWishlist(100)}>Remove Wishlist</button>
      <button onClick={() => favoritePet(200)}>Favorite Pet</button>
      <button onClick={() => unfavoritePet(200)}>Unfavorite Pet</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
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
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(loginPayload),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('current-user')).toHaveTextContent('Aisha Rahman');
  });

  it('logs out user successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(loginPayload),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('current-user')).toHaveTextContent('null');
  });

  it('signs up user successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(signupPayload),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Signup'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('current-user')).toHaveTextContent('New User');
    expect(screen.getByTestId('user-email')).toHaveTextContent('new@example.com');
  });

  it('adds and removes wishlist item with optimistic update', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginPayload),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Add Wishlist'));
    });

    expect(screen.getByTestId('wishlist')).toHaveTextContent('[100]');

    await act(async () => {
      fireEvent.click(screen.getByText('Remove Wishlist'));
    });

    expect(screen.getByTestId('wishlist')).toHaveTextContent('[]');
  });

  it('favorites and unfavorites pet with optimistic update', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginPayload),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Favorite Pet'));
    });

    expect(screen.getByTestId('favorites')).toHaveTextContent('[200]');

    await act(async () => {
      fireEvent.click(screen.getByText('Unfavorite Pet'));
    });

    expect(screen.getByTestId('favorites')).toHaveTextContent('[]');
  });
});
