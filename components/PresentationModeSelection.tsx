import React from 'react';
import { PresentationMode } from '../types';
import { usePresentation } from '../contexts/PresentationContext';

interface PresentationModeSelectionProps {
    userType: 'student' | 'lecturer';
}

const ModeCard = ({ title, description, onClick, icon, color }: { title: string, description: string, onClick: () => void, icon: React.ReactNode, color: 'blue' | 'green' | 'purple' }) => {
    const colorClasses = {
        blue: {
            bg: 'bg-slate-800/60',
            hoverBg: 'hover:bg-slate-700/80',
            hoverBorder: 'hover:border-blue-400',
            icon: 'text-blue-400',
        },
        green: {
            bg: 'bg-slate-800/60',
            hoverBg: 'hover:bg-slate-700/80',
            hoverBorder: 'hover:border-green-400',
            icon: 'text-green-400',
        },
        purple: {
            bg: 'bg-slate-800/60',
            hoverBg: 'hover:bg-slate-700/80',
            hoverBorder: 'hover:border-purple-400',
            icon: 'text-purple-400',
        },
    };

    const classes = colorClasses[color];

    return (
        <div 
            onClick={onClick}
            className={`border border-slate-700 rounded-lg p-6 text-center cursor-pointer transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/10 ${classes.bg} ${classes.hoverBg} ${classes.hoverBorder}`}
        >
            <div className={`flex justify-center items-center mb-4 ${classes.icon}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-200">{title}</h3>
            <p className="mt-2 text-slate-400">{description}</p>
        </div>
    );
};

const PresentationModeSelection: React.FC<PresentationModeSelectionProps> = ({ userType }) => {
    const { handleSelectPresentationMode } = usePresentation();
    const isLecturer = userType === 'lecturer';
    
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-100">Presentation Skills Practice</h2>
                <p className="mt-2 text-lg text-slate-400">Select a practice mode to begin.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <ModeCard 
                    title="Guided Practice"
                    description="Follow a provided script for a common technical scenario to hone your fundamental skills."
                    onClick={() => handleSelectPresentationMode('GUIDED')}
                    color="blue"
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                />
                <ModeCard 
                    title="Free Practice"
                    description="Bring your own presentation and script to get personalized feedback."
                    onClick={() => handleSelectPresentationMode('FREE')}
                    color="green"
                    icon={
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    }
                />
                 <ModeCard 
                    title={isLecturer ? "Review Submissions" : "Review Performance"}
                    description={isLecturer ? "Evaluate student submissions and provide grades and feedback." : "View your past performance, track progress, and see feedback."}
                    onClick={() => handleSelectPresentationMode('REVIEW')}
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
};

export default PresentationModeSelection;