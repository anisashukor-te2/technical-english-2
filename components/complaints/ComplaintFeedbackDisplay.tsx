import React from 'react';
import Card from '../Card';
import { ComplaintFeedbackData } from '../../types';
import { COMPLAINT_EMAIL_SCENARIO } from '../../services/geminiService';

interface ComplaintFeedbackDisplayProps {
    feedback: ComplaintFeedbackData;
    userEmail: string;
    onPracticeAgain: () => void;
}

const ScoreCircle: React.FC<{ score: number, label: string }> = ({ score, label }) => {
    const colorClass = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
    return (
        <div className="text-center">
            <p className={`text-5xl font-bold ${colorClass}`}>{score}<span className="text-2xl">%</span></p>
            <p className="text-slate-400 mt-1">{label}</p>
        </div>
    );
};

const ComplaintFeedbackDisplay: React.FC<ComplaintFeedbackDisplayProps> = ({ feedback, userEmail, onPracticeAgain }) => (
    <div className="space-y-6 animate-fade-in">
        <Card title="Email Feedback Report">
            <div className="p-4 grid grid-cols-2 gap-4">
                <ScoreCircle score={feedback.toneScore} label="Tone & Empathy" />
                <ScoreCircle score={feedback.clarityScore} label="Clarity & Solution" />
            </div>
        </Card>

        {feedback.summary && (
            <Card title="Feedback Summary">
                <div className="p-4">
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        {feedback.summary.split('-').filter(s => s.trim()).map((point, index) => (
                            <li key={index}>{point.trim()}</li>
                        ))}
                    </ul>
                </div>
            </Card>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
            <Card title="Your Email">
                <pre className="p-4 text-sm text-slate-300 whitespace-pre-wrap font-sans h-64 overflow-y-auto">{userEmail}</pre>
            </Card>
            <Card title="Original Scenario">
                <div className="p-4 text-sm text-slate-300 h-64 overflow-y-auto">
                    <p>{COMPLAINT_EMAIL_SCENARIO}</p>
                </div>
            </Card>
        </div>

        <Card title="AI Analysis & Suggestions">
            <div className="p-4 space-y-4">
                <div>
                    <h4 className="font-semibold text-fuchsia-400 mb-2">L.A.S.T. Method Adherence</h4>
                    <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                        {feedback.lastMethodAdherence.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-fuchsia-400 mb-2">Suggestions for Improvement</h4>
                    <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                        {feedback.suggestions.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            </div>
        </Card>

        <div className="text-center mt-4">
            <button onClick={onPracticeAgain} className="bg-fuchsia-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-fuchsia-700 transition-colors">
                Practice Again
            </button>
        </div>
    </div>
);

export default ComplaintFeedbackDisplay;