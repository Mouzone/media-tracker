import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useNavigate } from '@tanstack/react-router';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Set persistence based on remember me checkbox
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation will be handled by the route or we can force it
      navigate({ to: '/' });
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Login</h2>
      </div>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:outline-none focus:border-primary-500 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400"
            placeholder="Email address"
            required
          />
        </div>
        
        <div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:outline-none focus:border-primary-500 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400"
            placeholder="Password"
            required
          />
        </div>

        <div className="flex items-center pt-2">
          <label className="flex items-center cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Remember me</span>
          </label>
        </div>

        {error && (
          <div className="pt-2">
            <p className="text-xs text-red-500 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 mt-4 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white dark:text-gray-900 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
        >
          {isLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
}
