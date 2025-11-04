import React, { useState } from 'react';
import { ComplaintScenario } from '../../types';
import { generateComplaintStarterScript } from '../../services/geminiService';

interface PracticeScenarioSelectionProps {
  onBack: () => void;
  onSelectScenario: (scenario: ComplaintScenario) => void;
  onSelectEmailPractice: () => void;
}

const scenarios: ComplaintScenario[] = [
    {
        title: 'Angry Customer Call',
        description: 'A long-time customer is very upset about a recent product failure and is demanding a full refund and compensation.',
        userRole: 'Customer Support Lead',
        aiRole: 'Frustrated Customer',
        aiPersona: 'You are a loyal customer who feels let down. You are angry and want a quick, decisive solution. You are initially unwilling to listen to excuses, but can be calmed down by a sincere apology and a fair offer.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
    },
    {
        title: 'Project Team Conflict',
        description: 'A team member complains that another is not contributing fairly to a critical group design project, jeopardizing the deadline.',
        userRole: 'Team Leader',
        aiRole: 'Frustrated Team Member',
        aiPersona: 'You are a diligent student who feels you are doing most of the work in a group project. You are stressed and worried about your grade. You want the team leader to intervene and ensure the workload is distributed fairly.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5.423a2 2 0 001.996-2.227l-1.07-7.085a2 2 0 00-1.996-1.773H17V5a2 2 0 00-2-2h-3a2 2 0 00-2 2v7h-1.423a2 2 0 00-1.996 1.773l-1.07 7.085A2 2 0 004.577 20H10v-2a2 2 0 012-2h3v2z" /></svg>
    },
    {
        title: 'Safety Concern Dismissed',
        description: 'A junior engineer feels their valid safety concerns about a new design are being ignored by a senior engineer focused on deadlines.',
        userRole: 'Engineering Manager',
        aiRole: 'Concerned Junior Engineer',
        aiPersona: 'You are a junior engineer who has identified a potential safety flaw in a design. You feel your concerns were brushed aside by a senior colleague. You are anxious but resolute, believing it is your ethical duty to ensure the design is safe, even if it causes delays.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    },
     {
        title: 'Prototype Performance Issues',
        description: 'A client is disappointed with a delivered prototype, claiming it does not meet the agreed-upon performance specs and feels fragile.',
        userRole: 'Project Engineer',
        aiRole: 'Disappointed Client',
        aiPersona: 'You are a client who has invested significantly in a prototype. You are not angry, but you are very disappointed and worried the project is off track. You want a clear explanation and a concrete plan to fix the issues.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    },
];

const ScenarioCard: React.FC<{ scenario: ComplaintScenario; onSelect: () => void; }> = ({ scenario, onSelect }) => (
    <div
        onClick={onSelect}
        className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 cursor-pointer hover:bg-slate-800 hover:border-cyan-500 transition-all transform hover:-translate-y-1 flex flex-col h-full"
    >
        <div className="flex justify-center items-center mb-4 text-cyan-400">{scenario.icon}</div>
        <h3 className="text-xl font-bold text-slate-200 text-center">{scenario.title}</h3>
        <p className="mt-2 text-slate-400 flex-grow text-center">{scenario.description}</p>
        <div className="mt-4 pt-4 border-t border-slate-700/50 text-center text-sm space-y-2">
            <p className="text-slate-400"><span className="font-semibold text-cyan-400 block">Your Role:</span> {scenario.userRole}</p>
            <p className="text-slate-400"><span className="font-semibold text-cyan-400 block">AI's Role:</span> {scenario.aiRole}</p>
        </div>
    </div>
);

const PracticeScenarioSelectionScreen: React.FC<PracticeScenarioSelectionProps> = ({ onBack, onSelectScenario, onSelectEmailPractice }) => {
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [customScenario, setCustomScenario] = useState('');
    const [generatedData, setGeneratedData] = useState<{ starterScript: string; aiRole: string; aiPersona: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [customError, setCustomError] = useState<string | null>(null);

    const handleGenerateScript = async () => {
        if (!customScenario.trim()) {
            setCustomError("Please describe a scenario.");
            return;
        }
        setIsLoading(true);
        setCustomError(null);
        setGeneratedData(null);
        try {
            const result = await generateComplaintStarterScript(customScenario);
            setGeneratedData(result);
        } catch (error) {
            setCustomError("Failed to generate a script. Please try again.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartCustomSimulation = () => {
        if (!generatedData) return;
        const customScenarioObj: ComplaintScenario = {
            title: 'Custom Scenario',
            description: customScenario,
            userRole: 'Me (Handler)',
            aiRole: generatedData.aiRole,
            aiPersona: generatedData.aiPersona,
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        };
        onSelectScenario(customScenarioObj);
    };
    
    const resetCustomizer = () => {
        setIsCustomizing(false);
        setCustomScenario('');
        setGeneratedData(null);
        setCustomError(null);
        setIsLoading(false);
    }

    if (isCustomizing) {
        return (
            <div className="max-w-2xl mx-auto animate-fade-in">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-white text-center mb-2">Create Your Own Scenario</h2>
                    <p className="text-center text-slate-400 mb-6">Describe a complaint situation you want to practice handling. The AI will generate a starting point for the simulation.</p>
                    
                    <textarea
                        value={customScenario}
                        onChange={(e) => setCustomScenario(e.target.value)}
                        placeholder="e.g., A client is unhappy because the CAD model I delivered has incorrect dimensions and they missed a deadline."
                        className="w-full h-32 p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        disabled={isLoading}
                    />
                    
                    {customError && <p className="text-red-400 text-sm mt-2 text-center">{customError}</p>}
                    
                    <div className="mt-4 flex justify-center">
                        <button onClick={handleGenerateScript} disabled={isLoading || !!generatedData} className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Generating...' : 'Generate Starter Script'}
                        </button>
                    </div>

                    {generatedData && (
                        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-600 animate-fade-in">
                             <h3 className="text-lg font-semibold text-cyan-400 mb-2">Suggested Starter Script:</h3>
                             <p className="text-sm text-slate-400 mb-2">The AI will play the role of <strong className="text-slate-300">"{generatedData.aiRole}"</strong> and will start the conversation by saying:</p>
                             <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 bg-slate-800 rounded-r-lg">
                                <p className="text-slate-300 italic">"{generatedData.starterScript}"</p>
                             </blockquote>
                             <div className="mt-4 flex justify-center">
                                 <button onClick={handleStartCustomSimulation} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
                                     Start Simulation
                                </button>
                             </div>
                        </div>
                    )}
                </div>
                 <div className="text-center mt-4">
                    <button onClick={resetCustomizer} className="text-sm text-slate-500 hover:text-cyan-400">
                        Back to Scenarios
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Practice: Complaint Simulations</h2>
                <p className="mt-2 text-lg text-slate-400">Select a scenario or create your own to start your practice session.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {scenarios.map((scenario) => (
                    <ScenarioCard key={scenario.title} scenario={scenario} onSelect={() => onSelectScenario(scenario)} />
                ))}

                <div
                    onClick={() => setIsCustomizing(true)}
                    className="bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg p-6 cursor-pointer hover:border-cyan-500 hover:bg-slate-800 transition-all flex flex-col justify-center items-center h-full text-center"
                >
                    <div className="flex justify-center items-center mb-4 text-slate-500">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-200">Create Your Own Scenario</h3>
                    <p className="mt-2 text-slate-400">Describe a custom situation to practice a real-life challenge you're facing.</p>
                </div>

                <div
                    onClick={onSelectEmailPractice}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 cursor-pointer hover:bg-slate-800 hover:border-cyan-500 transition-all transform hover:-translate-y-1 flex flex-col h-full"
                >
                    <div className="flex justify-center items-center mb-4 text-cyan-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 text-center">Written Email Response</h3>
                    <p className="mt-2 text-slate-400 flex-grow text-center">Practice writing a professional email to resolve a complaint and get AI feedback.</p>
                </div>
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