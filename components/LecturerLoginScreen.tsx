import React, { useState } from 'react';
import { Lecturer } from '../types';
import Modal from './common/Modal';
import * as firebaseService from '../services/firebaseService';


interface LecturerLoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (lecturer: Omit<Lecturer, 'uid' | 'role'>, password: string) => void;
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
            setMessage('If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder.');
            setIsSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reset Your Password">
            <form onSubmit={handleSendResetLink} className="space-y-4">
                <p className="text-sm text-slate-400">
                    Enter the email address associated with your account, and we'll send you a link to reset your password.
                </p>
                <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300">Email Address</label>
                    <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
                        required
                    />
                </div>
                {message && <p className="text-green-400 text-sm text-center">{message}</p>}
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={handleClose} className="bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-500">Cancel</button>
                    <button type="submit" disabled={isSending || !!message} className="bg-cyan-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSending ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


const LecturerLoginScreen: React.FC<LecturerLoginScreenProps> = ({ onLogin, onRegister, onBack, error: authError, clearError }) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [classCodes, setClassCodes] = useState(['']);
  const [formError, setFormError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const switchView = (newView: 'LOGIN' | 'REGISTER') => {
    setView(newView);
    setFormError(null);
    clearError();
  };
  
  const handleClassCodeChange = (index: number, value: string) => {
    const newClassCodes = [...classCodes];
    newClassCodes[index] = value;
    setClassCodes(newClassCodes);
  };

  const handleAddClassCode = () => {
    setClassCodes([...classCodes, '']);
  };

  const handleRemoveClassCode = (index: number) => {
    if (classCodes.length > 1) {
      const newClassCodes = classCodes.filter((_, i) => i !== index);
      setClassCodes(newClassCodes);
    }
  };


  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();
    if (!email.trim() || !password.trim()) {
      setFormError('Email and password are required.');
      return;
    }
    onLogin(email.trim(), password.trim());
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    const filteredClassCodes = classCodes.map(c => c.trim()).filter(Boolean);
    if (filteredClassCodes.length === 0) {
        setFormError('Please provide at least one Class ID.');
        return;
    }

    const lecturerDetails = {
      email: email.trim(),
      courseCode: courseCode.trim(),
      classCodes: filteredClassCodes,
    };
    
    const uPassword = password.trim();
    const uConfirmPassword = confirmPassword.trim();

    if (!lecturerDetails.email || !uPassword || !uConfirmPassword || !lecturerDetails.courseCode) {
      setFormError('Please fill in all required fields.');
      return;
    }
    
    if (uPassword.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
    }

    if (uPassword !== uConfirmPassword) {
        setFormError('Passwords do not match.');
        return;
    }

    onRegister(lecturerDetails, uPassword);
  };

  const renderLoginForm = () => (
    <div className="animate-fade-in">
        <h2 className="text-xl font-bold text-center text-slate-200 mb-4">Lecturer Login</h2>
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., lecturer@example.com"
              className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
            />
          </div>
           <div>
                <div className="flex justify-between items-baseline">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
                    <button type="button" onClick={() => setIsResetModalOpen(true)} className="text-sm font-semibold text-cyan-600 hover:underline focus:outline-none">
                        Forgot Password?
                    </button>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
                />
            </div>
          <button type="submit" className="w-full bg-cyan-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-900 transition-colors">
            Login
          </button>
        </form>
         <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <button type="button" onClick={() => switchView('REGISTER')} className="font-semibold text-cyan-600 hover:underline focus:outline-none">
                Register here
            </button>
        </p>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="animate-fade-in">
        <h2 className="text-xl font-bold text-center text-slate-200 mb-4">Lecturer Registration</h2>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label htmlFor="registerEmail" className="block text-sm font-medium text-slate-300">Email Address</label>
            <input
              id="registerEmail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
            />
          </div>
          <div>
            <label htmlFor="courseCode" className="block text-sm font-medium text-slate-300">Course ID</label>
            <input
              id="courseCode"
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g., DUE30072"
              className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
            />
          </div>
          
           <div className="space-y-2">
                {classCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="flex-grow">
                             <label htmlFor={`classCode-${index}`} className="block text-sm font-medium text-slate-300">
                                Class ID {classCodes.length > 1 ? `#${index + 1}`: ''}
                            </label>
                            <input
                                id={`classCode-${index}`}
                                type="text"
                                value={code}
                                onChange={(e) => handleClassCodeChange(index, e.target.value)}
                                placeholder="e.g., DKM5A"
                                className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
                            />
                        </div>
                        {classCodes.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveClassCode(index)}
                                className="mt-7 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                aria-label={`Remove Class ID #${index + 1}`}
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={handleAddClassCode} className="text-sm font-semibold text-cyan-600 hover:underline">
                    + Add Another Class
                </button>
            </div>

          <div>
            <label htmlFor="registerPassword" className="block text-sm font-medium text-slate-300">Password</label>
            <input
              id="registerPassword"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
            />
          </div>
           <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md shadow-sm p-3 focus:ring-cyan-700 focus:border-cyan-700 text-white"
            />
          </div>
          <button type="submit" className="w-full bg-cyan-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-900 transition-colors">
            Register
          </button>
        </form>
        <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <button type="button" onClick={() => switchView('LOGIN')} className="font-semibold text-cyan-600 hover:underline focus:outline-none">
                Login here
            </button>
        </p>
    </div>
  );

  const displayError = authError || formError;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
        <main className="flex-grow flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-cyan-600">Technical English 2</h1>
                    <p className="text-slate-400">Lecturer Access</p>
                </div>
                <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl p-8">
                {displayError && <p className="text-red-400 text-center text-sm mb-4">{displayError}</p>}
                {view === 'LOGIN' ? renderLoginForm() : renderRegisterForm()}
                <div className="text-center mt-6 border-t border-slate-700 pt-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="text-sm text-slate-500 hover:text-cyan-600 transition-colors"
                    >
                        Not a lecturer? Go back to main page.
                    </button>
                </div>
                </div>
                <PasswordResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />
            </div>
        </main>
        <footer className="w-full text-left p-4 text-xs text-slate-500">
            © Developed by Anis Abd Shukor
        </footer>
    </div>
  );
};

export default LecturerLoginScreen;