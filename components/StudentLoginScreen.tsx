import React, { useState } from 'react';
import Modal from './common/Modal';
import * as firebaseService from '../services/firebaseService';

interface StudentLoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (details: { email: string; courseCode: string; classCode: string }, password: string) => void;
  onBack: () => void;
  error: string | null;
  clearError: () => void;
}

const PasswordResetModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [resetEmail, setResetEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setResetEmail('');
      setMessage(null);
      setIsSending(false);
    }, 300);
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsSending(true);
    try {
      await firebaseService.sendPasswordReset(resetEmail);
    } catch (error) {
      console.error("Password reset error:", error);
    } finally {
      setMessage('If an account exists for this email, a reset link has been sent.');
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Your Password">
      <form onSubmit={handleSendResetLink} className="space-y-4">
        <p className="text-sm text-slate-400">
          Enter the email associated with your student account.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-300">Email Address</label>
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"
            required
          />
        </div>

        {message && <p className="text-green-400 text-sm text-center">{message}</p>}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSending || !!message}
            className="bg-cyan-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-900 disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const StudentLoginScreen: React.FC<StudentLoginScreenProps> = ({
  onLogin,
  onRegister,
  onBack,
  error: authError,
  clearError
}) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [classCode, setClassCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const switchView = (newView: 'LOGIN' | 'REGISTER') => {
    setView(newView);
    setFormError(null);
    clearError();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    if (!email.trim() || !password.trim()) {
      setFormError('Email and password are required.');
      return;
    }

    onLogin(email.trim(), password.trim());
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    if (!email || !password || !classCode || !courseCode) {
      setFormError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    onRegister(
      {
        email: email.trim(),
        courseCode: courseCode.trim().toUpperCase(),
        classCode: classCode.trim().toUpperCase(),
      },
      password.trim()
    );
  };

  const displayError = authError || formError;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-cyan-600">Technical English 2</h1>
            <p className="text-slate-400">Student Access</p>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl p-8">
            {displayError && (
              <p className="text-red-400 text-center text-sm mb-4">{displayError}</p>
            )}

            {view === 'LOGIN' ? (
              <div className="animate-fade-in">

                <h2 className="text-xl font-bold text-center text-slate-200 mb-4">Student Login</h2>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g., student@example.com"
                      className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline">
                      <label className="block text-sm font-medium text-slate-300">Password</label>
                      <button
                        type="button"
                        onClick={() => setIsResetModalOpen(true)}
                        className="text-sm font-semibold text-cyan-600 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-900 transition-colors"
                  >
                    Login
                  </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-6">
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('REGISTER')}
                    className="font-semibold text-cyan-600 hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">

                <h2 className="text-xl font-bold text-center text-slate-200 mb-4">Student Registration</h2>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300">Course ID</label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                      placeholder="e.g., DUE30072"
                      className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300">Class ID</label>
                    <input
                      type="text"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      placeholder="e.g., DKM5A"
                      className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-900 transition-colors"
                  >
                    Register
                  </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-6">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('LOGIN')}
                    className="font-semibold text-cyan-600 hover:underline"
                  >
                    Login here
                  </button>
                </p>
              </div>
            )}

            <div className="text-center mt-6 border-t border-slate-700 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-slate-500 hover:text-cyan-600 transition-colors"
              >
                Not a student? Go back to main page.
              </button>
            </div>
          </div>

          <PasswordResetModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
          />
        </div>
      </main>

      <footer className="w-full text-left p-4 text-xs text-slate-500">
        © Developed by Anis Abd Shukor
      </footer>
    </div>
  );
};

export default StudentLoginScreen;
