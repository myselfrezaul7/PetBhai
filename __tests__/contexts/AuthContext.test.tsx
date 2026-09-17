import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

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
    fetchProfile,
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

  const handleAdminLogin = async (email: string) => {
    try {
      await login(email, 'password123');
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

  const handleFetchProfile = async (silent?: boolean) => {
    try {
      await fetchProfile(silent !== undefined ? { silent } : undefined);
    } catch {
      // no-op
    }
  };

  return (
    <div>
      <p data-testid="is-authenticated">{isAuthenticated.toString()}</p>
      <p data-testid="current-user">{currentUser?.name || 'null'}</p>
      <p data-testid="user-email">{currentUser?.email || 'null'}</p>
      <p data-testid="user-role">{currentUser?.role || 'null'}</p>
      <p data-testid="wishlist">{JSON.stringify(currentUser?.wishlist || [])}</p>
      <p data-testid="favorites">{JSON.stringify(currentUser?.favorites || [])}</p>

      <button onClick={handleLogin}>Login</button>
      <button onClick={() => handleAdminLogin('petbhaibd@gmail.com')}>Login Admin 1</button>
      <button onClick={() => handleAdminLogin('rsrezaul55@gmail.com')}>Login Admin 2</button>
      <button onClick={logout}>Logout</button>
      <button onClick={handleSignup}>Signup</button>
      <button onClick={() => handleFetchProfile()}>Fetch Profile</button>
      <button onClick={() => handleFetchProfile(true)}>Fetch Profile Silent</button>
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
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
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
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
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
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
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
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
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
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
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
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
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

  it('assigns super_admin role to admin emails in persistSession', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            token: 'header.eyJleHAiOjQ3NDIyNjE2MDB9.signature',
            user: { id: 10, name: 'Admin 1', email: 'petbhaibd@gmail.com', role: 'customer' },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            token: 'header.eyJleHAiOjQ3NDIyNjE2MDB9.signature',
            user: { id: 11, name: 'Admin 2', email: 'RSREZAUL55@GMAIL.COM', role: 'customer' },
          }),
      });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login Admin 1'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('user-role')).toHaveTextContent('super_admin');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Login Admin 2'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('user-role')).toHaveTextContent('super_admin');
    });
  });

  it('fetchProfile always calls /auth/me', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginPayload),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...loginUser,
            name: 'Updated Name',
          }),
      });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Fetch Profile'));
    });

    const calls = (global.fetch as jest.Mock).mock.calls;
    const fetchProfileCall = calls.find((call) =>
      typeof call[0] === 'string'
        ? call[0].includes('/auth/me')
        : call[0]?.url?.includes('/auth/me')
    );
    expect(fetchProfileCall).toBeDefined();
    expect(screen.getByTestId('current-user')).toHaveTextContent('Updated Name');
  });

  it('fetchProfile clears session on 404', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginPayload),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'User not found' }),
      });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Fetch Profile'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('current-user')).toHaveTextContent('null');
    });
  });

  it('fetchProfile with silent: true clears session on 404 without toast error', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginPayload),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'User not found' }),
      });

    render(
      <ToastProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ToastProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Fetch Profile Silent'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });
  });

  it('debounces concurrent visibilitychange and focus events and throttles with cooldown', async () => {
    jest.useFakeTimers();
    try {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(loginPayload),
      });

      render(
        <ToastProvider>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </ToastProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Login'));
      });
      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const initialCallsCount = (global.fetch as jest.Mock).mock.calls.length;

      // Simulate visible document
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
      });

      // Before debounce 300ms, no extra fetch called
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(initialCallsCount);

      // Fast-forward past 300ms debounce
      await act(async () => {
        jest.advanceTimersByTime(350);
      });

      // Exactly 1 extra fetch call was made for profile (debounced concurrent events)
      const afterFetchCount = (global.fetch as jest.Mock).mock.calls.length;
      expect(afterFetchCount).toBe(initialCallsCount + 1);

      // Trigger again immediately within 60s cooldown
      await act(async () => {
        window.dispatchEvent(new Event('focus'));
        jest.advanceTimersByTime(350);
      });

      // No new call due to 60s cooldown
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(afterFetchCount);

      // Advance past 60s cooldown
      await act(async () => {
        jest.advanceTimersByTime(60_001);
      });

      // Now trigger focus again
      await act(async () => {
        window.dispatchEvent(new Event('focus'));
      });
      await act(async () => {
        jest.advanceTimersByTime(350);
      });

      // A new fetch call was made
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(afterFetchCount + 1);
    } finally {
      jest.useRealTimers();
    }
  });
});
