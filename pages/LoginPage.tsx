import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleIcon, EyeIcon, EyeOffIcon } from '../components/icons';
import { signInWithGoogle } from '../services/authService';
import { sanitizeInput } from '../lib/security';

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<boolean>(false);
  const { login, socialLogin } = useAuth();
  const navigate = useNavigate();
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus email input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Validation functions
  const validateEmail = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address';
    if (trimmed.length > 254) return 'Email is too long';
    return undefined;
  }, []);

  const validatePassword = useCallback((value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  }, []);

  // Handle input blur for real-time validation
  const handleEmailBlur = useCallback(() => {
    const error = validateEmail(email);
    setFieldErrors((prev) => ({ ...prev, email: error }));
  }, [email, validateEmail]);

  const handlePasswordBlur = useCallback(() => {
    const error = validatePassword(password);
    setFieldErrors((prev) => ({ ...prev, password: error }));
  }, [password, validatePassword]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

      // Validate all fields
      const emailError = validateEmail(sanitizedEmail);
      const passwordError = validatePassword(password);

      if (emailError || passwordError) {
        setFieldErrors({ email: emailError, password: passwordError });
        return;
      }

      setFieldErrors({});
      setIsLoading(true);

      try {
        await login(sanitizedEmail, password);
        navigate('/community');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, login, navigate, validateEmail, validatePassword]
  );

  const handleSocialLogin = useCallback(async () => {
    setIsSocialLoading(true);
    setError('');
    try {
      const socialUser = await signInWithGoogle();
      await socialLogin(socialUser);
      navigate('/community');
    } catch (error) {
      console.error(`Google Sign-In failed`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign in with Google. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSocialLoading(false);
    }
  }, [socialLogin, navigate]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-grow flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md glass-card p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Welcome Back!
        </h1>

        {error && (
          <p
            id="auth-error"
            role="alert"
            aria-live="polite"
            className="bg-red-100/80 text-red-800 dark:bg-red-500/30 dark:text-red-200 p-3 rounded-lg text-center mb-6 text-sm sm:text-base"
          >
            {error}
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleSocialLogin}
            disabled={isSocialLoading || isLoading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]"
            aria-label="Sign in with Google"
          >
            {isSocialLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm sm:text-base">
              {isSocialLoading ? 'Signing in...' : 'Sign in with Google'}
            </span>
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 font-semibold text-sm">
            OR
          </span>
          <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
            >
              Email Address
            </label>
            <input
              ref={emailInputRef}
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              required
              autoComplete="email"
              inputMode="email"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 touch-manipulation text-base ${
                fieldErrors.email
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
              aria-required="true"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={
                fieldErrors.email ? 'email-error' : error ? 'auth-error' : undefined
              }
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                required
                autoComplete="current-password"
                className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50 touch-manipulation text-base ${
                  fieldErrors.password
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                aria-required="true"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : error ? 'auth-error' : undefined
                }
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 touch-manipulation"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.password}
              </p>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading || isSocialLoading}
              className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg text-base sm:text-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98] flex items-center justify-center gap-2"
              aria-label={isLoading ? 'Logging in, please wait' : 'Login with Email'}
            >
              {isLoading && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isLoading ? 'Logging in...' : 'Login with Email'}
            </button>
          </div>
        </form>
        <p className="text-center mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-bold text-orange-600 hover:underline touch-manipulation"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
