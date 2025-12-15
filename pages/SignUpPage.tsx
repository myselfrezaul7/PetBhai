import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleIcon } from '../components/icons';
import { signInWithGoogle } from '../services/authService';

const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<boolean>(false);
  const { signup, socialLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password);
      navigate('/community');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async () => {
    setIsSocialLoading(true);
    try {
      const socialUser = await signInWithGoogle();
      await socialLogin(socialUser);
      navigate('/community');
    } catch (error) {
      console.error(`Google Sign-In failed`, error);
      setError(`Failed to sign in with Google. Please try again.`);
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 flex-grow flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md glass-card p-8 md:p-10">
        <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Join Our Community
        </h1>

        {error && (
          <p
            id="auth-error"
            role="alert"
            className="bg-red-100/80 text-red-800 dark:bg-red-500/30 dark:text-red-200 p-3 rounded-lg text-center mb-6"
          >
            {error}
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleSocialLogin}
            disabled={isSocialLoading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon className="w-6 h-6" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {isSocialLoading ? 'Signing up...' : 'Sign up with Google'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50"
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? 'auth-error' : undefined}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50"
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? 'auth-error' : undefined}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 dark:bg-slate-700/50"
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? 'auth-error' : undefined}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading || isSocialLoading}
              className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up with Email'}
            </button>
          </div>
        </form>
        <p className="text-center mt-6 text-slate-600 dark:text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-orange-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
