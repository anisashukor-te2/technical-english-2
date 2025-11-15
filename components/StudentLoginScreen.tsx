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

const PasswordResetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
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
      setMessage('If an account exists for this email, a password reset link has been sent.');
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Your Password">
      <form onSubmit={handleSendResetLink} className="space-y-4">
        <p className="text-sm text-slate-400">
          Enter your email to receive a password reset link.
        </p>

        <input
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full p-3 bg-slate-700 text-white rounded"
          required
        />

        {message && <p className="text-green-400 text-sm text-center">{message}</p>}

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={handleClose} type="button" className="px-4 py-2 bg-gray-600 text-white rounded">
            Cancel
          </button>

          <button type="submit" disabled={isSending || !!message} className="px-4 py-2 bg-blue-700 text-white rounded disabled:opacity-50">
            {isSending ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const StudentLoginScreen: React.FC<StudentLoginScreenProps> = ({ onLogin, onRegister, onBack, error: authError, clearError }) => {
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
    if (newView === 'LOGIN') {
      setCourseCode('');
      setClassCode('');
    }
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
        courseCode: courseCode.trim(),
        classCode: classCode.trim(),
      },
      password.trim()
    );
  };

  const displayError = authError || formError;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg shadow-lg">
          
          <h1 className="text-center text-3xl font-bold text-cyan-500 mb-2">Technical English 2</h1>
          <p className="text-center text-slate-400 mb-6">Student Access</p>

          {displayError && <p className="text-red-400 text-center mb-4">{displayError}</p>}

          {view === 'LOGIN' ? (
            <>
              <h2 className="text-xl text-white text-center mb-4">Login</h2>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 bg-slate-700 rounded text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 bg-slate-700 rounded text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button className="w-full bg-cyan-700 text-white py-3 rounded">Login</button>
              </form>

              <button onClick={() => setIsResetModalOpen(true)} className="text-sm text-cyan-400 mt-3 block text-center">
                Forgot Password?
              </button>

              <p className="text-center text-sm text-slate-400 mt-6">
                No account?{" "}
                <button onClick={() => switchView('REGISTER')} className="text-cyan-400">
                  Register here
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl text-white text-center mb-4">Registration</h2>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 bg-slate-700 rounded text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Course Code (e.g., DUE30072)"
                  className="w-full p-3 bg-slate-700 rounded text-white"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Class Code (e.g., DKM5A)"
                  className="w-full p-3 bg-slate-700 rounded text-white"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 bg-slate-700 rounded text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full p-3 bg-slate-700 rounded text-white"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button className="w-full bg-cyan-700 text-white py-3 rounded">Register</button>
              </form>

              <p className="text-center text-sm text-slate-400 mt-6">
                Already registered?{" "}
                <button onClick={() => switchView('LOGIN')} className="text-cyan-400">
                  Login here
                </button>
              </p>
            </>
          )}

          <button onClick={onBack} className="text-sm text-gray-400 mt-6 block text-center hover:text-cyan-400">
            Back to main
          </button>
        </div>
      </main>

      <PasswordResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />

      <footer className="text-center p-4 text-xs text-gray-500">
        © Developed by Anis Abd Shukor
      </footer>
    </div>
  );
};

export default StudentLoginScreen;
