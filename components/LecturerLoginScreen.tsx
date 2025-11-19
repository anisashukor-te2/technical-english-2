
import React, { useState } from 'react';
import Modal from './common/Modal';
import * as firebaseService from '../services/firebaseService';

interface LoginScreenProps {
  userType: 'student' | 'lecturer';
  onLogin: (email: string, password: string) => void;
  onRegister: (details: any, password: string) => void;
  onBack: () => void;
  error: string | null;
  clearError: () => void;
}

const PasswordResetModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
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
          Enter the email associated with your account.
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

const LoginScreen: React.FC<LoginScreenProps> = ({
  userType,
  onLogin,
  onRegister,
  onBack,
  error: authError,
  clearError,
}) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [courseCode, setCourseCode] = useState('DUE30072');
  // Student-specific
  const [classCode, setClassCode] = useState('');
  // Lecturer-specific
  const [classCodes, setClassCodes] = useState(['']);
  const [formError, setFormError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const switchView = (newView: 'LOGIN' | 'REGISTER') => {
    setView(newView);
    setFormError(null);
    clearError();
  };
  
  // Lecturer form helpers
  const handleClassCodeChange = (index: number, value: string) => {
    const newClassCodes = [...classCodes];
    newClassCodes[index] = value;
    setClassCodes(newClassCodes);
  };

  const handleAddClassCode = () => setClassCodes([...classCodes, '']);

  const handleRemoveClassCode = (index: number) => {
    if (classCodes.length > 1) {
      setClassCodes(classCodes.filter((_, i) => i !== index));
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

    const uEmail = email.trim();
    const uPassword = password.trim();
    const uConfirmPassword = confirmPassword.trim();
    const uCourseCode = courseCode.trim().toUpperCase();

    if (!uEmail || !uPassword || !uConfirmPassword || !uCourseCode) {
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

    let details;
    if (userType === 'student') {
        const uClassCode = classCode.trim().toUpperCase();
        if(!uClassCode) {
            setFormError('Please provide your Class ID.');
            return;
        }
        details = { email: uEmail, courseCode: uCourseCode, classCode: uClassCode };
    } else { // Lecturer
        const filteredClassCodes = classCodes.map(c => c.trim().toUpperCase()).filter(Boolean);
        if (filteredClassCodes.length === 0) {
            setFormError('Please provide at least one Class ID.');
            return;
        }
        details = { email: uEmail, courseCode: uCourseCode, classCodes: filteredClassCodes };
    }

    onRegister(details, uPassword);
  };

  const displayError = authError || formError;
  const title = userType === 'student' ? 'Student Access' : 'Lecturer Access';
  const loginPlaceholder = userType === 'student' ? "e.g., student@example.com" : "e.g., lecturer@example.com";
  const registerPlaceholder = userType === 'student' ? "student@example.com" : "lecturer@example.com";

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-cyan-600">Technical English 2</h1>
            <p className="text-slate-400">{title}</p>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl p-8">
            {/* Tabs only visible for Students */}
            {userType === 'student' && (
              <div className="flex border-b border-slate-700 mb-6">
                <button onClick={() => switchView('LOGIN')} className={`flex-1 pb-2 text-center font-semibold transition-colors ${view === 'LOGIN' ? 'text-cyan-600 border-b-2 border-cyan-600' : 'text-slate-400 hover:text-white'}`}>Login</button>
                <button onClick={() => switchView('REGISTER')} className={`flex-1 pb-2 text-center font-semibold transition-colors ${view === 'REGISTER' ? 'text-cyan-600 border-b-2 border-cyan-600' : 'text-slate-400 hover:text-white'}`}>Register</button>
              </div>
            )}

            {displayError && <p className="text-red-400 text-center text-sm mb-4">{displayError}</p>}
            
            {view === 'LOGIN' ? (
                <div className="animate-fade-in">
                  {userType === 'lecturer' && <h2 className="text-xl font-bold text-slate-200 text-center mb-6">Lecturer Login</h2>}
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300">Email Address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={loginPlaceholder} className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"/>
                    </div>
                    <div>
                      <div className="flex justify-between items-baseline">
                        <label className="block text-sm font-medium text-slate-300">Password</label>
                        <button type="button" onClick={() => setIsResetModalOpen(true)} className="text-sm font-semibold text-cyan-600 hover:underline">Forgot Password?</button>
                      </div>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"/>
                    </div>
                    <button type="submit" className="w-full bg-cyan-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-900 transition-colors">Login</button>
                  </form>
                  <div className="text-center mt-4">
                      <button onClick={() => switchView('REGISTER')} className="text-sm text-slate-400 hover:text-cyan-500">
                          Don't have an account? <span className="text-cyan-500 font-semibold">Register here</span>
                      </button>
                  </div>
                </div>
            ) : ( // REGISTER VIEW
                 <div className="animate-fade-in">
                    {userType === 'lecturer' && <h2 className="text-xl font-bold text-slate-200 text-center mb-6">Lecturer Registration</h2>}
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={registerPlaceholder} className="block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"/>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Course ID</label>
                          <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="DUE30072" className="block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"/>
                        </div>
                        
                        {userType === 'student' ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Class ID (e.g., DKM5A)</label>
                                <input type="text" value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="DKM5A" className="block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"/>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {classCodes.map((code, index) => (
                                    <div key={index}>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Class ID #{index + 1}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={code} onChange={(e) => handleClassCodeChange(index, e.target.value)} placeholder={`e.g. DKM3A`} className="flex-grow bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white text-sm focus:ring-cyan-700 focus:border-cyan-700"/>
                                            {classCodes.length > 1 && (
                                              <button type="button" onClick={() => handleRemoveClassCode(index)} className="p-3 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                              </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddClassCode} className="text-sm font-bold text-cyan-500 hover:text-cyan-400 pt-1 block">
                                    + Add Another Class
                                </button>
                            </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"/>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="block w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-700 focus:border-cyan-700"/>
                        </div>

                        <button type="submit" className="w-full bg-cyan-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-900 transition-colors mt-2">Register</button>
                    </form>
                    <div className="text-center mt-4">
                        <button onClick={() => switchView('LOGIN')} className="text-sm text-slate-400 hover:text-cyan-500">
                            Already have an account? <span className="text-cyan-500 font-semibold">Login here</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="text-center mt-6 border-t border-slate-700 pt-4">
              <button onClick={onBack} className="text-sm text-slate-500 hover:text-cyan-600 transition-colors">Not a {userType}? Go back to main page.</button>
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

export default LoginScreen;
