

import React, { useState } from 'react';
import LearnScreen from '../complaints/LearnScreen';
import PracticeScenarioSelectionScreen from '../complaints/PracticeScenarioSelectionScreen';
import ReviewScreen from '../complaints/ReviewScreen';
import ComplaintSimulationScreen from '../complaints/ComplaintSimulationScreen';
import { Lecturer, Student, ComplaintScenario, ComplaintFeedbackData, ComplaintEmailSession } from '../../types';
import Loader from '../Loader';
import Card from '../Card';
import ComplaintFeedbackDisplay from '../complaints/ComplaintFeedbackDisplay';
import { getComplaintEmailFeedback, COMPLAINT_EMAIL_SCENARIO } from '../../services/geminiService';
import * as firebaseService from '../../services/firebaseService';


type ComplaintView = 'MENU' | 'LEARN' | 'PRACTICE' | 'REVIEW';

interface HandlingComplaintsModuleProps {
  user: Student | Lecturer | null;
  userType: 'student' | 'lecturer' | null;
  // FIX: Add selectedClass to props to be passed to ReviewScreen.
  selectedClass: string;
}

const MenuCard = ({ title, description, onClick, icon, color, comingSoon = false }: { title: string, description: string, onClick: () => void, icon: React.ReactNode, color: 'blue' | 'green' | 'purple', comingSoon?: boolean }) => {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-100/70',
            hoverBg: 'hover:bg-blue-200/80',
            hoverBorder: 'hover:border-blue-400',
            icon: 'text-blue-700',
            text: 'text-slate-800',
            subtext: 'text-slate-600',
        },
        green: {
            bg: 'bg-green-100/70',
            hoverBg: 'hover:bg-green-200/80',
            hoverBorder: 'hover:border-green-400',
            icon: 'text-green-700',
            text: 'text-slate-800',
            subtext: 'text-slate-600',
        },
        purple: {
            bg: 'bg-purple-100/70',
            hoverBg: 'hover:bg-purple-200/80',
            hoverBorder: 'hover:border-purple-400',
            icon: 'text-purple-700',
            text: 'text-slate-800',
            subtext: 'text-slate-600',
        },
    };

    const classes = colorClasses[color];
    
    return (
        <div 
            onClick={!comingSoon ? onClick : undefined}
            className={`relative border border-white/30 backdrop-blur-md rounded-lg p-6 text-center transition-all transform ${comingSoon ? 'opacity-50 cursor-not-allowed' : `cursor-pointer hover:-translate-y-1 shadow-md hover:shadow-xl ${classes.hoverBg} ${classes.hoverBorder}`} ${classes.bg}`}
        >
            {comingSoon && <span className="absolute top-2 right-2 bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">Coming Soon</span>}
            <div className={`flex justify-center items-center mb-4 ${classes.icon}`}>
                {icon}
            </div>
            <h3 className={`text-xl font-bold ${classes.text}`}>{title}</h3>
            <p className={`mt-2 ${classes.subtext}`}>{description}</p>
        </div>
    );
};

const HandlingComplaintsModule: React.FC<HandlingComplaintsModuleProps> = ({ user, userType, selectedClass }) => {
    const [view, setView] = useState<ComplaintView>('MENU');
    const [selectedScenario, setSelectedScenario] = useState<ComplaintScenario | null>(null);
    const [isEmailPractice, setIsEmailPractice] = useState(false);
    
    // State for Email Practice
    const [userEmail, setUserEmail] = useState('');
    const [emailFeedback, setEmailFeedback] = useState<ComplaintFeedbackData | null>(null);
    const [isLoadingEmail, setIsLoadingEmail] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    // FIX: Add state to hold the session ID for the email practice.
    const [emailSessionId, setEmailSessionId] = useState<string | null>(null);


    const handleBackToMenu = () => {
        setView('MENU');
        setSelectedScenario(null);
        setIsEmailPractice(false);
    };
    
    const handleSelectScenario = (scenario: ComplaintScenario) => {
        setSelectedScenario(scenario);
    };
    
    const handleEndSimulation = () => {
        setSelectedScenario(null);
    };

    const handleSelectEmailPractice = () => {
        setIsEmailPractice(true);
    };

    const handleBackToPracticeSelection = () => {
        setIsEmailPractice(false);
        setSelectedScenario(null);
        handlePracticeEmailAgain();
    };

    const handleSubmitEmail = async () => {
        if (!userEmail.trim() || !user || user.role !== 'student') {
            setEmailError("Please write an email before submitting.");
            return;
        }
        setIsLoadingEmail(true);
        setEmailError(null);
        try {
          const feedbackData = await getComplaintEmailFeedback(userEmail);

          // FIX: Add logic to save the session to get a session ID.
          const studentUser = user as Student;
          const newSession: Omit<ComplaintEmailSession, 'id'> = {
              timestamp: Date.now(),
              studentUid: studentUser.uid,
              studentEmail: studentUser.email,
              lecturerEmail: studentUser.lecturerEmail,
              classCode: studentUser.classCode,
              scenario: COMPLAINT_EMAIL_SCENARIO,
              userEmail: userEmail,
              feedbackData: feedbackData,
              isSubmitted: false,
          };
          
          const savedId = await firebaseService.addSession('complaintEmailSessions', newSession);

          setEmailSessionId(savedId);
          setEmailFeedback(feedbackData);
        } catch (e: any) {
          setEmailError(e.message || 'Failed to get feedback from the AI. Please try again.');
          console.error(e);
        } finally {
          setIsLoadingEmail(false);
        }
    };
    
    const handlePracticeEmailAgain = () => {
        setUserEmail('');
        setEmailFeedback(null);
        setEmailError(null);
        // FIX: Reset session ID on practice again.
        setEmailSessionId(null);
    };


    const renderContent = () => {
        if (!user || !userType) return <p>Loading...</p>;
        switch(view) {
            case 'LEARN':
                return <LearnScreen onBack={handleBackToMenu} />;
            case 'PRACTICE':
                if (isEmailPractice) {
                    if (isLoadingEmail) {
                        return <Loader message="Analyzing your email..." />;
                    }
                    if (emailFeedback) {
                        return (
                            <div className="max-w-4xl mx-auto">
                                {/* FIX: Add missing sessionId and isStudent props. Also pass onBack to handle navigation from within the component. */}
                                <ComplaintFeedbackDisplay
                                    feedback={emailFeedback}
                                    userEmail={userEmail}
                                    onPracticeAgain={handlePracticeEmailAgain}
                                    sessionId={emailSessionId}
                                    isStudent={user?.role === 'student'}
                                    onBack={handleBackToPracticeSelection}
                                />
                            </div>
                        );
                    }
                    return (
                        <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-24">
                          <div className="text-center">
                            <h2 className="text-3xl font-bold text-slate-900">Practice: Written Email Response</h2>
                            <p className="mt-2 text-lg text-slate-600">Read the scenario, then write a professional email to resolve the complaint.</p>
                          </div>
                          
                          <div className="grid lg:grid-cols-2 gap-6">
                            <Card title="Complaint Scenario">
                                <div className="p-4 h-[60vh] overflow-y-auto">
                                    <p className="text-sm text-slate-300">
                                        {COMPLAINT_EMAIL_SCENARIO}
                                    </p>
                                </div>
                            </Card>
                            <div className="flex flex-col gap-6">
                                <Card title="Your Email Response">
                                    <div className="p-4">
                                        <textarea
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            placeholder="Dear [Client Name], ..."
                                            className="w-full h-[calc(60vh-80px)] p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition"
                                        />
                                    </div>
                                </Card>
                                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
                                    {emailError && <p className="text-red-400 text-center text-sm mb-2">{emailError}</p>}
                                    <button
                                        onClick={handleSubmitEmail}
                                        disabled={!userEmail.trim()}
                                        className="w-full bg-fuchsia-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-fuchsia-700 transition-colors focus:outline-none focus:ring-4 focus:ring-fuchsia-500/50 disabled:bg-slate-600 disabled:cursor-not-allowed"
                                    >
                                        Submit for Feedback
                                    </button>
                                </div>
                            </div>
                          </div>
                          <div className="text-center pt-4">
                            <button onClick={handleBackToPracticeSelection} className="text-sm text-fuchsia-400 hover:text-fuchsia-300 flex items-center mx-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                </svg>
                                Back to Practice Selection
                            </button>
                          </div>
                        </div>
                    );
                }

                if (selectedScenario) {
                     return (
                        <ComplaintSimulationScreen 
                            scenario={selectedScenario} 
                            onEndSession={handleBackToPracticeSelection} 
                            user={user}
                        />
                    );
                }
                return <PracticeScenarioSelectionScreen 
                    onBack={handleBackToMenu} 
                    onSelectScenario={handleSelectScenario}
                    onSelectEmailPractice={handleSelectEmailPractice}
                 />;
            case 'REVIEW':
                // FIX: Add missing selectedClass prop required by ReviewScreen.
                return <ReviewScreen onBack={handleBackToMenu} user={user} userType={userType} selectedClass={selectedClass} />;
            case 'MENU':
            default:
                const menuTitle = userType === 'student' ? "Module 3: Handling Complaints" : "Handling Complaints - Lecturer View";
                const menuDescription = userType === 'student'
                    ? "Learn to propose appropriate responses to workplace complaints, both verbally and in writing."
                    : "Review learning materials, try practice modules, or evaluate student submissions.";
                return (
                     <div className="max-w-4xl mx-auto animate-fade-in">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-slate-900">{menuTitle}</h2>
                            <p className="mt-2 text-lg text-slate-600">{menuDescription}</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <MenuCard 
                                title="Learn"
                                description="Study frameworks, case studies, and templates for handling complaints."
                                onClick={() => setView('LEARN')}
                                color="blue"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                    </svg>
                                }
                            />
                            <MenuCard 
                                title="Practice"
                                description="Engage in AI-driven simulations of difficult conversations."
                                onClick={() => setView('PRACTICE')}
                                color="green"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                            />
                             <MenuCard 
                                title={userType === 'student' ? "Review" : "Review Submissions"}
                                description={userType === 'student' ? "Analyze your performance and track your progress over time." : "Evaluate student submissions and grade assessments."}
                                onClick={() => setView('REVIEW')}
                                color="purple"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                    </svg>
                                }
                            />
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="animate-fade-in">
            {renderContent()}
        </div>
    );
};

export default HandlingComplaintsModule;