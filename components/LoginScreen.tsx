

import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => boolean;
  // Fix: Changed onRegister prop to match the object being passed, as Lecturer type does not include password.
  onRegister: (details: { email: string; password: string }) => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister }) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    const success = onLogin(email.trim(), password.trim());
    if (!success) {
      setError('Login failed. Please check your credentials or register.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const uEmail = email.trim();
    const uPassword = password.trim();

    if (!uEmail || !uPassword) {
      setError('Please fill in all fields with valid information.');
      return;
    }

    const success = onRegister({ email: uEmail, password: uPassword });
    if (!success) {
      setError('Registration failed. This email might already be taken.');
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g., lecturer@example.com"
          className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors">
        Login
      </button>
    </form>
  );

  const renderRegisterForm = () => (
    <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
      <div>
        <label htmlFor="registerEmail" className="block text-sm font-medium text-slate-700">Email Address</label>
        <input
          id="registerEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g., lecturer@example.com"
          className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <div>
        <label htmlFor="registerPassword" className="block text-sm font-medium text-slate-700">Password</label>
        <input
          id="registerPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6+ characters"
          className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors">
        Register
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-700">Technical Communication Coach</h1>
            <p className="text-slate-600">Lecturer Portal</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex border-b border-slate-300">
              <button
                onClick={() => { setView('LOGIN'); setError(null); }}
                className={`flex-1 py-2 text-center font-semibold transition-colors ${view === 'LOGIN' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Login
              </button>
              <button
                onClick={() => { setView('REGISTER'); setError(null); }}
                className={`flex-1 py-2 text-center font-semibold transition-colors ${view === 'REGISTER' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Register
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}
          {view === 'LOGIN' ? renderLoginForm() : renderRegisterForm()}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;