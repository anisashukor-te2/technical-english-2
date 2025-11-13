import React from 'react';
import { MeetingScenario } from '../../types';

interface RoleSelectionScreenProps {
  scenario: MeetingScenario;
  onBack: () => void;
  onSelectRole: (role: string) => void;
}

const RoleCard: React.FC<{ role: string; onSelect: () => void }> = ({ role, onSelect }) => (
    <div
        onClick={onSelect}
        className="w-64 bg-slate-800/60 border border-slate-700 rounded-lg p-6 cursor-pointer hover:bg-slate-700/80 hover:border-cyan-400 transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center text-center shadow-lg"
    >
        <div className="flex justify-center items-center mb-4 text-cyan-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        </div>
        <h3 className="text-xl font-bold text-white">{role}</h3>
        <p className="mt-2 text-slate-300 text-sm">Practice as the {role}. The AI will play all other roles.</p>
    </div>
);

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ scenario, onBack, onSelectRole }) => {
    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Select Your Role</h2>
                <p className="mt-2 text-lg text-slate-300">Scenario: <span className="text-cyan-400 font-semibold">{scenario.title}</span></p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
                {scenario.roles.map((role) => (
                    <RoleCard key={role} role={role} onSelect={() => onSelectRole(role)} />
                ))}
            </div>
            <div className="text-center mt-8">
                <button onClick={onBack} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back to Scenarios
                </button>
            </div>
        </div>
    );
};

export default RoleSelectionScreen;
