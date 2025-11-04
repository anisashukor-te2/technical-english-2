import React from 'react';
import { MeetingScenario } from '../../types';

interface PracticeScenarioSelectionProps {
  onBack: () => void;
  onSelectScenario: (scenario: MeetingScenario) => void;
}

const scenarios: MeetingScenario[] = [
    {
        title: 'Project Kick-off',
        description: 'Launch a new project by aligning the team on goals, scope, timeline, and individual roles.',
        roles: ['Project Manager', 'Lead Mechanical Engineer', 'Design Engineer', 'Testing & QA Engineer', 'Research & Documentation Officer', 'Graphic Designer', 'Prototype/Fabrication Technician', 'Custom Participant'],
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a16.953 16.953 0 01-2.32 3.02A12.017 12.017 0 018.63 21a12.017 12.017 0 01-2.32-3.02 16.953 16.953 0 01-2.32-3.02 12.017 12.017 0 012.32-3.02 16.953 16.953 0 012.32-3.02 12.017 12.017 0 012.32 3.02 16.953 16.953 0 012.32 3.02z" /></svg>
    },
    {
        title: 'Problem-Solving Session',
        description: 'Facilitate a discussion to find the root cause of a critical bug and brainstorm effective solutions.',
        roles: ['Engineering Lead', 'Senior Developer', 'DevOps Engineer', 'Product Manager'],
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
    },
    {
        title: 'Performance Feedback',
        description: 'Conduct a one-on-one meeting to provide constructive feedback to a team member on their recent work.',
        roles: ['Team Lead', 'Team Member (AI)'],
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h6l2-2h2V3a1 1 0 011-1z" /></svg>
    },
];

const ScenarioCard: React.FC<{ scenario: MeetingScenario; onSelect: () => void; }> = ({ scenario, onSelect }) => (
    <div
        onClick={onSelect}
        className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 cursor-pointer hover:bg-slate-800 hover:border-cyan-500 transition-all transform hover:-translate-y-1 flex flex-col h-full"
    >
        <div className="flex justify-center items-center mb-4 text-cyan-400">{scenario.icon}</div>
        <h3 className="text-xl font-bold text-slate-200 text-center">{scenario.title}</h3>
        <p className="mt-2 text-slate-400 flex-grow text-center">{scenario.description}</p>
        <div className="mt-4 pt-4 border-t border-slate-700/50 text-left text-sm space-y-2">
            <p className="text-slate-400"><span className="font-semibold text-cyan-400 block">Available Roles:</span> {scenario.roles.join(', ')}</p>
        </div>
    </div>
);

const PracticeScenarioSelectionScreen: React.FC<PracticeScenarioSelectionProps> = ({ onBack, onSelectScenario }) => {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Practice: Meeting Simulations</h2>
                <p className="mt-2 text-lg text-slate-400">Select a scenario to start your practice session.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {scenarios.map((scenario) => (
                    <ScenarioCard key={scenario.title} scenario={scenario} onSelect={() => onSelectScenario(scenario)} />
                ))}
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

export default PracticeScenarioSelectionScreen;