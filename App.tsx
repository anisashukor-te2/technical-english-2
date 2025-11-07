
import React, { useState, useEffect, useCallback } from 'react';
// FIX: Add getFreePracticeFeedback import
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
import HandlingComplaintsModule from './components/handlingComplaints/HandlingComplaintsModule';
// FIX: Change to named import for ResourceLibrary
import { ResourceLibrary } from './components/ResourceLibrary';
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
  const [isViewUsersModalOpen, setIsViewUsersModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
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
// FIX: Added missing curly braces to the catch block to correct syntax and resolve scoping issues.
    } catch (error: any) {
      setAuthError(firebaseService.formatAuthError(error));
    }
  };

  const handleUpdateLecturerClasses = async (newClassCodes: string[]) => {
    if (!currentUser || currentUser.role !== 'lecturer') return;
    try {
      await firebaseService.updateUser(currentUser.uid, { classCodes: newClassCodes });
      setCurrentUser(prev => prev ? { ...prev, classCodes: newClassCodes } as UserProfile : null);
      setIsManageClassesModalOpen(false);
    } catch (error) {
      console.error("Could not update classes:", error);
      alert("Failed to update classes. Please try again.");
    }
  };
  
  const handleOpenViewUsersModal = async () => {
    if (currentUser?.role !== 'lecturer') return;
    setIsUsersLoading(true);
    setIsViewUsersModalOpen(true);
    try {
      const users = await firebaseService.getUsersForLecturer(currentUser.email);
      setAllUsers(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      // Optionally set an error state to display in the modal
    } finally {
      setIsUsersLoading(false);
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
    if (!currentUser) { // Allow both students and lecturers
        setPresentationError("User not found. Cannot process recording.");
        return;
    }
    setPracticeView('PROCESSING');
    setLoadingMessage('Analyzing your performance...');
    setPresentationError(null);

    try {
        const mimeType = recordingBlob.type;
        
        // Convert blob to base64 for Gemini API analysis
        const base64Data = await firebaseService.blobToBase64(recordingBlob);
        setRecordingBase64(base64Data);
        setRecordingMimeType(mimeType);

        setLoadingMessage('Generating AI feedback...');
        const feedback = userScript
            ? await getFreePracticeFeedback(base64Data, mimeType, duration, userScript)
            : await getPresentationFeedback(base64Data, mimeType, duration);

        // If user is a student, save the session.
        if (currentUser.role === 'student') {
            const newSessionId = `session_${Date.now()}`;

            setLoadingMessage('Uploading your recording...');
            const downloadURL = await firebaseService.uploadRecording(recordingBlob, currentUser.uid, newSessionId);

            setRecordingUrl(downloadURL);
            setSlides(presentationSlides || null);
            
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

        } else {
            // For lecturers, just show the feedback temporarily without saving.
            // Create a temporary URL for the recording blob to be played back on the feedback screen.
            const tempRecordingUrl = URL.createObjectURL(recordingBlob);
            setRecordingUrl(tempRecordingUrl);
            setSlides(presentationSlides || null);
            setSessionId(null); // No session ID for lecturers
        }
        
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
                    if (practiceView === 'PRACTICE') return <FreePracticeScreen userType={userType!} />;
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
                  const modeLabel = presentationMode === 'GUIDED' ? 'Guided Practice' : 'Free Practice';
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
          default:
              items.push({ label: 'Dashboard' });
      }
      return items;
    };
    return <Breadcrumbs items={generateBreadcrumbs()} />;
  };

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

  if (isAuthLoading) {
    return <Loader message="Authenticating..." />;
  }

  if (!currentUser) {
      if (userType === 'student') {
          return <StudentLoginScreen onLogin={handleLogin} onRegister={handleStudentRegister} onBack={handleBackToUserTypeSelection} error={authError} clearError={() => setAuthError(null)} />;
      }
      if (userType === 'lecturer') {
          return <LecturerLoginScreen onLogin={handleLogin} onRegister={handleLecturerRegister} onBack={handleBackToUserTypeSelection} error={authError} clearError={() => setAuthError(null)} />;
      }
      return <UserTypeSelectionScreen onSelectType={handleSelectUserType} />;
  }

  return (
    <PresentationProvider value={presentationContextValue}>
        <div className="bg-slate-900 min-h-screen font-sans pb-32">
            <header className="bg-slate-800 shadow-sm p-4 sticky top-0 z-10 border-b border-slate-700">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex-1">
                      <BreadcrumbsRenderer />
                    </div>
                    <div className="flex-1 text-center">
                      <h1 className="text-xl font-bold text-slate-200 hidden md:block">Technical English 2</h1>
                    </div>
                    <div className="flex-1 flex justify-end items-center gap-4">
                        <span className="text-sm text-slate-400 hidden md:block">{currentUser.email}</span>
                        <button onClick={handleLogout} className="text-sm bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-500">
                            Logout
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-4 sm:p-6">
                <ActiveModuleRenderer />
            </main>
            <BottomNavBar activeModule={activeModule} setActiveModule={handleModuleChange} userType={userType!} onNavigate={() => {}} />
        </div>
    </PresentationProvider>
  );
};

export default App;
