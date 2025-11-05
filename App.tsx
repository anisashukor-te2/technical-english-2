


import React, { useState, useEffect, useCallback } from 'react';
import { getPresentationFeedback, getFreePracticeFeedback } from './services/geminiService';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import * as firebaseService from './services/firebaseService';

import BottomNavBar from './components/BottomNavBar';
import Loader from './components/Loader';
import PresentationModeSelection from './components/PresentationModeSelection';
import PracticeScreen from './components/PracticeScreen';
import FreePracticeScreen from './components/FreePracticeScreen';
import FeedbackScreen from './components/FeedbackScreen';
import { PresentationReviewScreen } from './components/PresentationReviewScreen';
import MeetingSkillsModule from './components/meeting/MeetingSkillsModule';
import HandlingComplaintsModule from './components/complaints/HandlingComplaintsModule';
import ResourceLibrary from './components/ResourceLibrary';
import UserTypeSelectionScreen from './components/UserTypeSelectionScreen';
import StudentLoginScreen from './components/StudentLoginScreen';
import LecturerLoginScreen from './components/LecturerLoginScreen';
import Breadcrumbs from './components/common/Breadcrumbs';
import Modal from './components/common/Modal';
import { PresentationProvider, usePresentation } from './contexts/PresentationContext';
import { Student, Lecturer, ActiveModule, PresentationMode, PracticeView, FeedbackData, Slide, PracticeSession, UserProfile } from './types';


const App: React.FC = () => {
  // User Authentication State
  const [userType, setUserType] = useState<'student' | 'lecturer' | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Navigation State
  const [activeModule, setActiveModule] = useState<ActiveModule>('PRESENTATION');
  
  // --- PRESENTATION CONTEXT STATE ---
  const [presentationMode, setPresentationMode] = useState<PresentationMode>('SELECTION');
  const [practiceView, setPracticeView] = useState<PracticeView>('PRACTICE');
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [presentationError, setPresentationError] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [recordingBase64, setRecordingBase64] = useState<string | null>(null);
  const [recordingMimeType, setRecordingMimeType] = useState<string | null>(null);

  // --- LECTURER-SPECIFIC STATE ---
  const [isManageClassesModalOpen, setIsManageClassesModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('ALL');


  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userProfile = await firebaseService.getUserProfile(user.uid);
          if (userProfile) {
            setCurrentUser(userProfile);
            setUserType(userProfile.role);
          } else {
            // This case might happen if user exists in Auth but not Firestore
            // For now, we log them out to force a clean slate.
            await firebaseService.signOutUser();
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          setAuthError("Could not load your profile. Please try logging in again.");
          await firebaseService.signOutUser();
        }
      } else {
        setCurrentUser(null);
        setUserType(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- AUTHENTICATION HANDLERS ---
  const handleSelectUserType = (type: 'student' | 'lecturer') => {
      setAuthError(null);
      setUserType(type);
  };
  
  const handleBackToUserTypeSelection = () => {
      setAuthError(null);
      setUserType(null);
  };

  const handleLogin = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    try {
      await firebaseService.signInUser(email, password);
      // onAuthStateChanged will handle setting the user state
    } catch (error: any) {
        setAuthError(firebaseService.formatAuthError(error));
    }
  };

  const handleStudentRegister = async (studentDetails: { email: string; courseId: string; lecturerClassCode: string; }, password: string): Promise<void> => {
    setAuthError(null);
    try {
        await firebaseService.signUpStudent(studentDetails, password);
    } catch (error: any) {
        setAuthError(firebaseService.formatAuthError(error));
    }
  };
  
  const handleLecturerRegister = async (lecturerDetails: Omit<Lecturer, 'uid' | 'role'>, password: string): Promise<void> => {
    setAuthError(null);
    try {
      await firebaseService.signUpLecturer(lecturerDetails, password);
    } catch (error: any) {
      setAuthError(firebaseService.formatAuthError(error));
    }
  };

  const handleUpdateLecturerClasses = async (newClassCodes: string[]) => {
    if (!currentUser || currentUser.role !== 'lecturer') return;
    try {
      await firebaseService.updateUser(currentUser.uid, { classCodes: newClassCodes });
      setCurrentUser(prev => prev ? { ...prev, classCodes: newClassCodes } : null);
      setIsManageClassesModalOpen(false);
    } catch (error) {
      console.error("Could not update classes:", error);
      alert("Failed to update classes. Please try again.");
    }
  };


  const handleLogout = async () => {
    try {
        await firebaseService.signOutUser();
        setSelectedClass('ALL');
        setAuthError(null);
    } catch (error) {
        console.error("Logout failed:", error);
        setAuthError("Failed to log out. Please try again.");
    }
  };
  
  // --- PRESENTATION CONTEXT HANDLERS ---
  const handleSelectPresentationMode = (mode: PresentationMode) => {
    setPresentationMode(mode);
    setPracticeView('PRACTICE');
    setFeedbackData(null);
  };

  const handleBackToSelection = () => {
    setPresentationMode('SELECTION');
    setPracticeView('PRACTICE');
    setFeedbackData(null);
    setRecordingUrl('');
    setSlides(null);
    setSessionId(null);
  };

  const handlePracticeAgain = () => {
    setPracticeView('PRACTICE');
    setFeedbackData(null);
    setRecordingUrl('');
    setSlides(null);
    setSessionId(null);
  };

  const handleRecordingComplete = useCallback(async (
    recordingBlob: Blob,
    duration: number,
    userScript?: string,
    presentationSlides?: Slide[],
    isSubmission = false
  ) => {
    if (!currentUser || currentUser.role !== 'student') {
        setPresentationError("User not found or not a student. Cannot process recording.");
        return;
    }
    setPracticeView('PROCESSING');
    setLoadingMessage('Analyzing your performance...');
    setPresentationError(null);

    try {
        const mimeType = recordingBlob.type;
        const newSessionId = `session_${Date.now()}`;

        setLoadingMessage('Uploading your recording...');
        const downloadURL = await firebaseService.uploadRecording(recordingBlob, currentUser.uid, newSessionId);

        setRecordingUrl(downloadURL);
        setSlides(presentationSlides || null);
        
        // Convert blob to base64 for Gemini API analysis (Storage is for persistence)
        const base64Data = await firebaseService.blobToBase64(recordingBlob);
        setRecordingBase64(base64Data);
        setRecordingMimeType(mimeType);

        setLoadingMessage('Generating AI feedback...');
        const feedback = userScript
            ? await getFreePracticeFeedback(base64Data, mimeType, duration, userScript)
            : await getPresentationFeedback(base64Data, mimeType, duration);

        setLoadingMessage('Saving your session...');
        
        const student = currentUser as Student;
        const newSession: Omit<PracticeSession, 'id'> = {
            timestamp: Date.now(),
            studentUid: currentUser.uid,
            studentEmail: currentUser.email,
            lecturerEmail: student.lecturerEmail || '',
            classCode: student.classCode || '',
            feedbackData: feedback,
            recordingUrl: downloadURL,
            recordingMimeType: mimeType,
            slides: presentationSlides || [],
            isSubmitted: isSubmission,
            peerReviews: [],
        };
        
        await firebaseService.saveSession('practiceSessions', newSessionId, newSession);
        
        setSessionId(newSessionId);
        setFeedbackData(feedback);
        setPracticeView('FEEDBACK');
    } catch (err: any) {
        console.error("Processing failed:", err);
        setPresentationError(err.message || "An unknown error occurred during analysis.");
        setPracticeView('PRACTICE'); // Go back to allow retrying
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [currentUser]);

  const handleModuleChange = (module: ActiveModule) => {
    setActiveModule(module);
  };


  const ActiveModuleRenderer: React.FC = () => {
    const {
        presentationMode,
        practiceView,
        feedbackData,
        loadingMessage,
        recordingUrl,
        slides,
        sessionId,
        handleBackToSelection,
        handlePracticeAgain
    } = usePresentation();
    
    const isStudent = currentUser?.role === 'student';

    switch (activeModule) {
        case 'PRESENTATION':
            switch (presentationMode) {
                case 'SELECTION':
                    return <PresentationModeSelection userType={userType!} />;
                case 'GUIDED':
                    if (practiceView === 'PRACTICE') return <PracticeScreen />;
                    if (practiceView === 'PROCESSING') return <Loader message={loadingMessage} />;
                    if (practiceView === 'FEEDBACK' && feedbackData) return <FeedbackScreen feedback={feedbackData} onPracticeAgain={handlePracticeAgain} onBackToMenu={handleBackToSelection} recordingUrl={recordingUrl} slides={slides} sessionId={sessionId} studentEmail={currentUser!.email} isStudent={isStudent} />;
                    return <Loader message="Loading..." />;
                case 'FREE':
                    if (practiceView === 'PRACTICE') return <FreePracticeScreen />;
                    if (practiceView === 'PROCESSING') return <Loader message={loadingMessage} />;
                    if (practiceView === 'FEEDBACK' && feedbackData) return <FeedbackScreen feedback={feedbackData} onPracticeAgain={handlePracticeAgain} onBackToMenu={handleBackToSelection} recordingUrl={recordingUrl} slides={slides} sessionId={sessionId} studentEmail={currentUser!.email} isStudent={isStudent} />;
                    return <Loader message="Loading..." />;
                case 'REVIEW':
                    return <PresentationReviewScreen user={currentUser!} userType={userType!} selectedClass={selectedClass} />;
                default:
                    return <PresentationModeSelection userType={userType!} />;
            }
        case 'MEETING':
            return <MeetingSkillsModule user={currentUser} userType={userType} selectedClass={selectedClass} />;
        case 'COMPLAINTS':
            return <HandlingComplaintsModule user={currentUser} userType={userType} selectedClass={selectedClass} />;
        case 'RESOURCES':
            return <ResourceLibrary />;
        default:
            return null;
    }
  };
  
  const BreadcrumbsRenderer: React.FC = () => {
    const { presentationMode, practiceView, handleBackToSelection, handlePracticeAgain } = usePresentation();

    const generateBreadcrumbs = () => {
      const items: { label: string; onClick?: () => void; }[] = [];

      switch (activeModule) {
          case 'PRESENTATION':
              items.push({ label: 'Presentation Skills', onClick: presentationMode !== 'SELECTION' ? handleBackToSelection : undefined });
              
              if (presentationMode === 'GUIDED' || presentationMode === 'FREE') {
                  const modeLabel = presentationMode === 'GUIDED' ? 'Guided Practice' : 'Practice';
                  if (practiceView === 'FEEDBACK') {
                      items.push({ label: modeLabel, onClick: handlePracticeAgain });
                      items.push({ label: 'Feedback Report' });
                  } else {
                      items.push({ label: modeLabel });
                  }
              } else if (presentationMode === 'REVIEW') {
                  items.push({ label: 'Review Performance' });
              }
              break;
          case 'MEETING':
              items.push({ label: 'Meeting Skills' });
              break;
          case 'COMPLAINTS':
              items.push({ label: 'Handling Complaints' });
              break;
          case 'RESOURCES':
              items.push({ label: 'Resource Library' });
              break;
      }
      
      return items;
    };
    return <Breadcrumbs items={generateBreadcrumbs()} />;
  };
  
  if (isAuthLoading) {
    return <Loader message="Authenticating..." />;
  }

  if (!currentUser) {
    const clearError = () => setAuthError(null);
    if (userType === 'student') {
      return <StudentLoginScreen onLogin={handleLogin} onRegister={handleStudentRegister} onBack={handleBackToUserTypeSelection} error={authError} clearError={clearError} />;
    }
    if (userType === 'lecturer') {
      return <LecturerLoginScreen onLogin={handleLogin} onRegister={handleLecturerRegister} onBack={handleBackToUserTypeSelection} error={authError} clearError={clearError} />;
    }
    return <UserTypeSelectionScreen onSelectType={handleSelectUserType} />;
  }

  const presentationContextValue = {
    presentationMode,
    practiceView,
    feedbackData,
    slides,
    sessionId,
    isLoading,
    loadingMessage,
    error: presentationError,
    recordingUrl,
    recordingBase64,
    recordingMimeType,
    handleRecordingComplete,
    handlePracticeAgain,
    handleSelectPresentationMode,
    handleBackToSelection,
    setError: setPresentationError,
  };


  return (
    <PresentationProvider value={presentationContextValue}>
        <div className="flex flex-col h-full">
            <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 p-4 sticky top-0 z-10">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-bold text-cyan-400">Technical English 2</h1>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">Welcome, {currentUser.email}</span>
                    {currentUser.role === 'lecturer' && (
                        <>
                            <button onClick={() => setIsManageClassesModalOpen(true)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs py-1 px-3 rounded">
                                Manage Classes
                            </button>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block py-1 px-2"
                            >
                                <option value="ALL">All Classes</option>
                                {(currentUser as Lecturer).classCodes.map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                        </>
                    )}
                    <button onClick={handleLogout} className="bg-slate-600 hover:bg-slate-500 text-white font-semibold text-sm py-1 px-3 rounded">
                      Logout
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                    <BreadcrumbsRenderer />
                </div>
              </div>
            </header>
            <main className="flex-grow p-4 md:p-8 overflow-y-auto pb-28">
              <ActiveModuleRenderer />
            </main>
            <BottomNavBar activeModule={activeModule} setActiveModule={handleModuleChange} onNavigate={() => {}} userType={userType!} />
        </div>
        {currentUser.role === 'lecturer' && (
            <ManageClassesModal
                isOpen={isManageClassesModalOpen}
                onClose={() => setIsManageClassesModalOpen(false)}
                currentClassCodes={(currentUser as Lecturer).classCodes}
                onSave={handleUpdateLecturerClasses}
            />
        )}
    </PresentationProvider>
  );
};

const ManageClassesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    currentClassCodes: string[];
    onSave: (newClassCodes: string[]) => void;
}> = ({ isOpen, onClose, currentClassCodes, onSave }) => {
    const [classCodes, setClassCodes] = useState<string[]>([]);
    
    useEffect(() => {
        if (isOpen) {
            setClassCodes(currentClassCodes.length > 0 ? [...currentClassCodes] : ['']);
        }
    }, [isOpen, currentClassCodes]);

    const handleClassCodeChange = (index: number, value: string) => {
        const newClassCodes = [...classCodes];
        newClassCodes[index] = value;
        setClassCodes(newClassCodes);
    };

    const handleAddClassCode = () => {
        if (classCodes.length < 5) {
            setClassCodes([...classCodes, '']);
        }
    };

    const handleRemoveClassCode = (index: number) => {
        if (classCodes.length > 1) {
            const newClassCodes = classCodes.filter((_, i) => i !== index);
            setClassCodes(newClassCodes);
        } else {
            // If it's the last one, just clear it
            setClassCodes(['']);
        }
    };

    const handleSaveChanges = () => {
        const cleanedCodes = classCodes.map(c => c.trim().toUpperCase()).filter(Boolean);
        if (cleanedCodes.length === 0) {
            alert("Please provide at least one class ID.");
            return;
        }
        onSave(cleanedCodes);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Your Classes">
            <div className="space-y-4">
                <p className="text-sm text-slate-400">Add, edit, or remove the class IDs associated with your account. Students will use these to register under you.</p>
                {classCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => handleClassCodeChange(index, e.target.value)}
                            placeholder={`e.g., DKM5A`}
                            className="flex-grow bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-cyan-500"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveClassCode(index)}
                            className="p-2 bg-red-800 text-white rounded-md hover:bg-red-700"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={handleAddClassCode}
                    className="w-full text-sm text-cyan-400 hover:text-cyan-300 transition-colors py-1 disabled:opacity-50"
                    disabled={classCodes.length >= 5}
                >
                    + Add Another Class
                </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                 <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500">Cancel</button>
                 <button onClick={handleSaveChanges} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
        </Modal>
    );
}

export default App;