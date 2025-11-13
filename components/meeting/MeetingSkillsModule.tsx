import React, { useState } from 'react';
import LearnScreen from './LearnScreen';
import PracticePlaceholder from './PracticePlaceholder';
import ReviewScreen from './ReviewScreen';
import MeetingSimulationScreen from './MeetingSimulationScreen';
import PracticeSelectionScreen from './PracticeSelectionScreen';
import MinuteTakingPracticeScreen from './MinuteTakingPracticeScreen';
import QuizScreen from './QuizScreen'; // Import the new QuizScreen component
import RoleSelectionScreen from './RoleSelectionScreen';
import { Lecturer, Student, MeetingScenario } from '../../types';


type MeetingView = 'MENU' | 'LEARN' | 'PRACTICE' | 'REVIEW' | 'QUIZ';
type PracticeView = 'SELECTION' | 'ROLE_PLAY_SCENARIOS' | 'ROLE_SELECTION' | 'ROLE_PLAY_SIMULATION' | 'MINUTE_TAKING';

interface MeetingSkillsModuleProps {
  user: Student | Lecturer | null;
  userType: 'student' | 'lecturer' | null;
  selectedClass: string;
}

const MenuCard = ({ title, description, onClick, icon, color, comingSoon = false }: { title: string, description: string, onClick: () => void, icon: React.ReactNode, color: 'blue' | 'green' | 'orange' | 'purple', comingSoon?: boolean }) => {
    const colorClasses = {
        blue: { hoverBorder: 'hover:border-blue-400', icon: 'text-blue-400' },
        green: { hoverBorder: 'hover:border-green-400', icon: 'text-green-400' },
        orange: { hoverBorder: 'hover:border-orange-400', icon: 'text-orange-400' },
        purple: { hoverBorder: 'hover:border-purple-400', icon: 'text-purple-400' },
    };

    const classes = colorClasses[color];

    return (
        <div 
            onClick={!comingSoon ? onClick : undefined}
            className={`relative bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center transition-all transform ${comingSoon ? 'opacity-50 cursor-not-allowed' : `cursor-pointer hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/10 hover:bg-slate-700/80 ${classes.hoverBorder}`}`}
        >
            {comingSoon && <span className="absolute top-2 right-2 bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">Coming Soon</span>}
            <div className={`flex justify-center items-center mb-4 ${classes.icon}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-200">{title}</h3>
            <p className="mt-2 text-slate-400">{description}</p>
        </div>
    );
};

const MeetingSkillsModule: React.FC<MeetingSkillsModuleProps> = ({ user, userType, selectedClass }) => {
    const [view, setView] = useState<MeetingView>('MENU');
    const [practiceView, setPracticeView] = useState<PracticeView>('SELECTION');
    const [selectedScenario, setSelectedScenario] = useState<MeetingScenario | null>(null);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const handleBackToMenu = () => {
        setView('MENU');
        // Reset practice state when going back to main menu
        setPracticeView('SELECTION');
        setSelectedScenario(null);
        setSelectedRole(null);
    };
    
    const handleBackToPracticeSelection = () => {
        setPracticeView('SELECTION');
        setSelectedScenario(null);
        setSelectedRole(null);
    }

    const handleBackToScenarioSelection = () => {
        setPracticeView('ROLE_PLAY_SCENARIOS');
        setSelectedRole(null);
    };

    const handleSelectScenario = (scenario: MeetingScenario) => {
        setSelectedScenario(scenario);
        setPracticeView('ROLE_SELECTION');
    };

    const handleRoleSelect = (role: string) => {
        setSelectedRole(role);
        setPracticeView('ROLE_PLAY_SIMULATION');
    };
    
    const handleSelectPracticeMode = (mode: 'ROLE_PLAY' | 'MINUTE_TAKING') => {
        if (mode === 'ROLE_PLAY') {
            setPracticeView('ROLE_PLAY_SCENARIOS');
        } else {
            setPracticeView('MINUTE_TAKING');
        }
    };
    
    const renderPracticeContent = () => {
        switch (practiceView) {
            case 'SELECTION':
                return <PracticeSelectionScreen onBack={handleBackToMenu} onSelectPracticeMode={handleSelectPracticeMode} />;
            case 'ROLE_PLAY_SCENARIOS':
                return <PracticePlaceholder onBack={handleBackToPracticeSelection} onSelectScenario={handleSelectScenario} />;
            case 'ROLE_SELECTION':
                if (selectedScenario) {
                    return <RoleSelectionScreen scenario={selectedScenario} onBack={handleBackToScenarioSelection} onSelectRole={handleRoleSelect} />;
                }
                 return <PracticePlaceholder onBack={handleBackToPracticeSelection} onSelectScenario={handleSelectScenario} />; // Fallback
            case 'ROLE_PLAY_SIMULATION':
                 if (selectedScenario && selectedRole) {
                     return (
                        <MeetingSimulationScreen 
                            scenario={selectedScenario} 
                            userRole={selectedRole}
                            onEndSession={handleBackToPracticeSelection}
                            user={user}
                        />
                    );
                }
                // Fallback if state is incorrect
                return <PracticePlaceholder onBack={handleBackToPracticeSelection} onSelectScenario={handleSelectScenario} />;
            case 'MINUTE_TAKING':
                return <MinuteTakingPracticeScreen onBack={handleBackToPracticeSelection} user={user} />;
            default:
                 return <PracticeSelectionScreen onBack={handleBackToMenu} onSelectPracticeMode={handleSelectPracticeMode} />;
        }
    }


    const renderContent = () => {
        if (!user || !userType) return <p>Loading...</p>;
        switch(view) {
            case 'LEARN':
                return <LearnScreen onBack={handleBackToMenu} />;
            case 'PRACTICE':
                // For both students and lecturers, show the practice content.
                return renderPracticeContent();
            case 'REVIEW':
                return <ReviewScreen onBack={handleBackToMenu} user={user} userType={userType} selectedClass={selectedClass} />;
            case 'QUIZ':
                return <QuizScreen onBack={handleBackToMenu} />;
            case 'MENU':
            default:
                const menuTitle = userType === 'student' ? "Module 2: Meeting & Social Skills" : "Meeting & Social Skills - Lecturer View";
                const menuDescription = userType === 'student'
                    ? "Develop your ability to effectively conduct and participate in professional meetings."
                    : "Review learning materials, try practice modules, or evaluate student submissions.";
                return (
                     <div className="max-w-5xl mx-auto animate-fade-in">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white">{menuTitle}</h2>
                            <p className="mt-2 text-lg text-slate-300">{menuDescription}</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MenuCard 
                                title="Learn"
                                description="Understand meeting essentials, roles, and best practices."
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
                                description="Apply your skills in realistic, AI-driven meeting simulations."
                                onClick={() => setView('PRACTICE')}
                                color="green"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                                    </svg>
                                }
                            />
                             <MenuCard 
                                title="Knowledge Quiz"
                                description="Test your understanding of meeting essentials with a short quiz."
                                onClick={() => setView('QUIZ')}
                                color="orange"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

export default MeetingSkillsModule;
