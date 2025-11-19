


import React, { useState, useEffect, useCallback } from 'react';
// FIX: Add getFreePracticeFeedback import
import { getPresentationFeedback, getFreePracticeFeedback } from './services/geminiService';
import { auth } from './firebase';
// FIX: Switched to namespaced auth API call to align with compat library fix.
// import { onAuthStateChanged } from 'firebase/auth';
import * as firebaseService from './services/firebaseService';

import BottomNavBar from './components/BottomNavBar';
import Loader from './components/Loader';
import PresentationModeSelection from './components/PresentationModeSelection';
import PracticeScreen from './components/PracticeScreen';
import FreePracticeScreen from './components/FreePracticeScreen';
import FeedbackScreen from './components/FeedbackScreen';
import { PresentationReviewScreen } from './components/PresentationReviewScreen';
import MeetingSkillsModule from './components/meeting/MeetingSkillsModule';
// FIX: Changed import to a named import for HandlingComplaintsModule and added .tsx extension to resolve ambiguity.
import { HandlingComplaintsModule } from './components/complaints/HandlingComplaintsModule';
// FIX: Change to named import for ResourceLibrary
import { ResourceLibrary } from './components/ResourceLibrary';
import UserTypeSelectionScreen from './components/UserTypeSelectionScreen';
import LecturerLoginScreen from './components/LecturerLoginScreen';
import Breadcrumbs from './components/common/Breadcrumbs';
import Modal from './components/common/Modal';
import ManageClassesModal from './components/common/ManageClassesModal';
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
    // FIX: Updated to use the namespaced `auth.onAuthStateChanged` method from the compat library.
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userProfile = await firebaseService.getUserProfile(user.uid);
          
          // RACE CONDITION FIX:
          // Background triggers might create a document with just 'createdAt' but no 'role'.
          // We must verify 'role' exists to ensure it's a valid, fully registered profile.
          if (userProfile && userProfile.role) {
            setCurrentUser(userProfile);
            setUserType(userProfile.role);
            
            // AUTO-CLEANUP: Check for unwanted fields (createdAt, displayName) and remove them.
            // Casting to 'any' to check for fields that don't exist on the UserProfile type.
            const rawProfile = userProfile as any;
            if (rawProfile.createdAt || rawProfile.displayName) {
                console.log("Detected legacy fields on user profile. Cleaning up...");
                firebaseService.cleanUserProfile(user.uid).catch(err => console.warn("Auto-cleanup failed:", err));
            }

          } else {
            console.log("User authenticated but profile incomplete (ghost document). Waiting for full registration...");
            setCurrentUser(null);
            // Do not sign out here. Allow handleRegister to complete the DB write.
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          setAuthError("Could not load your profile. Please try logging in again.");
          // CRITICAL FIX: Do NOT sign out here. If this error occurs during the registration race condition,
          // signing out will cause the subsequent database write to fail with a permission error.
          // Let the user stay in a 'logged in but loading' state.
          // await firebaseService.signOutUser(); 
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

  const handleRegister = async (details: any, password: string): Promise<void> => {
    setAuthError(null);
    try {
        let newUserProfile;
        if (userType === 'student') {
             newUserProfile = await firebaseService.signUpStudent(details.email, details.courseCode, details.classCode, password);
        } else if (userType === 'lecturer') {
             newUserProfile = await firebaseService.signUpLecturer(details.email, details.courseCode, details.classCodes, password);
        }

        // Manually update state to bypass the race condition of onAuthStateChanged
        if (newUserProfile) {
            setCurrentUser(newUserProfile);
            // userType is already set from the selection screen
        }

    } catch (error: any) {
        // Handle both Firebase Auth errors (with a .code) and custom errors (with a .message)
        if (error.code) {
            setAuthError(firebaseService.formatAuthError(error));
        } else {
            setAuthError(error.message || 'An unknown registration error occurred.');
        }
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
    setPresentationError(null);
  };

  const handlePracticeAgain = () => {
    setPracticeView('PRACTICE');
    setFeedbackData(null);
    setRecordingUrl('');
    setSlides(null);
    setSessionId(null);
    setPresentationError(null);
  };

  const handleRecordingComplete = useCallback(async (
    recordingBlob: Blob,
    duration: number,
    userScript?: string,
    presentationSlides?: Slide[],
    isSubmission = false
  ) => {
    if (!currentUser) {
        setPresentationError("User not found. Cannot process recording.");
        return;
    }
    setPracticeView('PROCESSING');
    setLoadingMessage('Analyzing your performance...');
    setPresentationError(null);

    try {
        const mimeType = recordingBlob.type;

        // --- Optimization: Get AI feedback first, as it's what the user is waiting for. ---
        setLoadingMessage('Generating AI feedback...');
        const base64Data = await firebaseService.blobToBase64(recordingBlob);
        setRecordingBase64(base64Data);
        setRecordingMimeType(mimeType);

        const feedback = userScript
            ? await getFreePracticeFeedback(base64Data, mimeType, duration, userScript)
            : await getPresentationFeedback(base64Data, mimeType, duration);

        // --- Show feedback screen immediately ---
        // Create a local URL for instant playback.
        const localRecordingUrl = URL.createObjectURL(recordingBlob);
        
        setFeedbackData(feedback);
        setRecordingUrl(localRecordingUrl); // Pass local URL for immediate playback
        setSlides(presentationSlides || null);
        setPracticeView('FEEDBACK');
        
        // --- Perform upload and save in the background (fire-and-forget) ---
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);

        (async () => {
            try {
                // The user is already viewing feedback, this happens in the background.
                const downloadURL = await firebaseService.uploadRecording(recordingBlob, currentUser.uid, newSessionId);
                
                let sessionData: Omit<PracticeSession, 'id'> = {
                    timestamp: Date.now(),
                    studentUid: currentUser.uid,
                    studentEmail: currentUser.email,
                    feedbackData: feedback,
                    recordingUrl: downloadURL, // The permanent URL
                    recordingMimeType: mimeType,
                    slides: presentationSlides || [],
                    isSubmitted: isSubmission,
                    peerReviews: [],
                    lecturerEmail: '',
                    classCode: '',
                };
                
                if (currentUser.role === 'student') {
                    sessionData.lecturerEmail = (currentUser as Student).lecturerEmail;
                    sessionData.classCode = (currentUser as Student).classCode;
                } else if (currentUser.role === 'lecturer') {
                    sessionData.lecturerEmail = currentUser.email;
                }
        
                await firebaseService.saveSession('practiceSessions', newSessionId, sessionData);

            } catch (backgroundError) {
                console.error("Background task failed: Could not upload recording or save session.", backgroundError);
            }
        })();

    } catch (err: any) {
        console.error("Processing failed:", err);
        setPresentationError(err.message || "An unknown error occurred during analysis.");
        setPracticeView('PRACTICE');
    } finally {
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
    
    switch (activeModule) {
        case 'PRESENTATION':
            switch (presentationMode) {
                case 'SELECTION':
                    return <PresentationModeSelection userType={userType!} />;
                case 'GUIDED':
                    if (practiceView === 'PRACTICE') return <PracticeScreen />;
                    if (practiceView === 'PROCESSING') return <Loader message={loadingMessage} />;
                    if (practiceView === 'FEEDBACK' && feedbackData) return <FeedbackScreen feedback={feedbackData} onPracticeAgain={handlePracticeAgain} onBackToMenu={handleBackToSelection} recordingUrl={recordingUrl} slides={slides} sessionId={sessionId} studentEmail={currentUser!.email} studentUid={currentUser!.uid} />;
                    return <Loader message="Loading..." />;
                case 'FREE':
                    if (practiceView === 'PRACTICE') return <FreePracticeScreen userType={userType!} />;
                    if (practiceView === 'PROCESSING') return <Loader message={loadingMessage} />;
                    if (practiceView === 'FEEDBACK' && feedbackData) return <FeedbackScreen feedback={feedbackData} onPracticeAgain={handlePracticeAgain} onBackToMenu={handleBackToSelection} recordingUrl={recordingUrl} slides={slides} sessionId={sessionId} studentEmail={currentUser!.email} studentUid={currentUser!.uid} />;
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
      if (userType) {
          return <LecturerLoginScreen 
                    userType={userType}
                    onLogin={handleLogin} 
                    onRegister={handleRegister} 
                    onBack={handleBackToUserTypeSelection} 
                    error={authError} 
                    clearError={() => setAuthError(null)} 
                 />;
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
                        {currentUser.role === 'lecturer' && (
                            <button onClick={() => setIsManageClassesModalOpen(true)} className="text-sm bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-600">
                                Manage Classes
                            </button>
                        )}
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
            {currentUser.role === 'lecturer' && (
                <ManageClassesModal
                    isOpen={isManageClassesModalOpen}
                    onClose={() => setIsManageClassesModalOpen(false)}
                    currentClasses={(currentUser as Lecturer).classCodes}
                    onSave={handleUpdateLecturerClasses}
                />
            )}
        </div>
    </PresentationProvider>
  );
};

export default App;
