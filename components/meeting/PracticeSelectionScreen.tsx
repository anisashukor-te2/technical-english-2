import React from 'react';

interface PracticeSelectionScreenProps {
  onBack: () => void;
  onSelectPracticeMode: (mode: 'ROLE_PLAY' | 'MINUTE_TAKING') => void;
}

const ModeCard = ({ title, description, onClick, icon }: { title: string; description: string; onClick: () => void; icon: React.ReactNode; }) => (
    <div
        onClick={onClick}
        className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 cursor-pointer hover:bg-slate-800 hover:border-cyan-500 transition-all transform hover:-translate-y-1"
    >
        <div className="flex justify-center items-center mb-4 text-cyan-400">{icon}</div>
        <h3 className="text-xl font-bold text-slate-200 text-center">{title}</h3>
        <p className="mt-2 text-slate-400 text-center">{description}</p>
    </div>
);


const PracticeSelectionScreen: React.FC<PracticeSelectionScreenProps> = ({ onBack, onSelectPracticeMode }) => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Practice: Meeting Skills</h2>
                <p className="mt-2 text-lg text-slate-400">Choose a practice mode to begin.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <ModeCard
                    title="Role-Play Simulation"
                    description="Engage in dynamic conversations with AI participants to practice chairing meetings and contributing effectively."
                    onClick={() => onSelectPracticeMode('ROLE_PLAY')}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5.423a2 2 0 001.996-2.227l-1.07-7.085a2 2 0 00-1.996-1.773H17V5a2 2 0 00-2-2h-3a2 2 0 00-2 2v7h-1.423a2 2 0 00-1.996 1.773l-1.07 7.085A2 2 0 004.577 20H10v-2a2 2 0 012-2h3v2z" />
                        </svg>
                    }
                />
                <ModeCard
                    title="Minute-Taking Practice"
                    description="Listen to a meeting scenario and practice capturing key decisions and action items. Get AI feedback on your notes."
                    onClick={() => onSelectPracticeMode('MINUTE_TAKING')}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    }
                />
            </div>
            <div className="text-center mt-8">
                <button onClick={onBack} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back to Menu Selection
                </button>
            </div>
        </div>
    );
};

export default PracticeSelectionScreen;