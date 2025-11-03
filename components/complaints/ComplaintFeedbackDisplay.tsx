import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { ComplaintFeedbackData, ComplaintEmailSession } from '../../types';
import { COMPLAINT_EMAIL_SCENARIO } from '../../services/geminiService';

interface ComplaintFeedbackDisplayProps {
    feedback: ComplaintFeedbackData | null;
    userEmail: string;
    onPracticeAgain: () => void;
    onBack?: () => void;
    sessionId: string | null;
    isStudent: boolean;
    isLecturerView?: boolean;
    sessionData?: ComplaintEmailSession;
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

const ComplaintFeedbackDisplay: React.FC<ComplaintFeedbackDisplayProps> = ({ 
    feedback, 
    userEmail, 
    onPracticeAgain,
    onBack,
    sessionId,
    isStudent,
    isLecturerView = false,
    sessionData
}) => {
    const [isSubmitted, setIsSubmitted] = useState(sessionData?.isSubmitted || false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [messageIsVisible, setMessageIsVisible] = useState(false);

    // State for lecturer feedback
    const [grade, setGrade] = useState<number | ''>(sessionData?.grade ?? '');
    const [lecturerFeedback, setLecturerFeedback] = useState<string>(sessionData?.lecturerFeedback ?? '');
    const [feedbackSaveStatus, setFeedbackSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        if (statusMessage) {
            setMessageIsVisible(true);
            const fadeTimer = setTimeout(() => setMessageIsVisible(false), 2500);
            const removeTimer = setTimeout(() => setStatusMessage(null), 3000);
            return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
        }
    }, [statusMessage]);
    
    useEffect(() => {
        if (sessionData) {
            setIsSubmitted(sessionData.isSubmitted || false);
        }
    }, [sessionData]);


    const handleSubmitToLecturer = async () => {
        if (!sessionId) {
            setStatusMessage("Error: Session ID is missing.");
            return;
        }
        try {
            const sessions: ComplaintEmailSession[] = JSON.parse(localStorage.getItem('complaintEmailSessions') || '[]');
            const sessionIndex = sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex === -1) {
                setStatusMessage("Error: Session not found.");
                return;
            }
            sessions[sessionIndex].isSubmitted = true;
            localStorage.setItem('complaintEmailSessions', JSON.stringify(sessions));
            setIsSubmitted(true);
            setStatusMessage("Successfully submitted to lecturer!");
        } catch (error) {
            console.error("Failed to submit session:", error);
            setStatusMessage("Sorry, there was an error submitting your session.");
        }
    };

    const handleSaveLecturerFeedback = async () => {
        const currentSessionId = sessionData?.id || sessionId;
        if (grade === '' || !lecturerFeedback.trim()) {
            alert("Please provide both a grade and written feedback.");
            return;
        }
        if (!currentSessionId) return;

        setFeedbackSaveStatus('saving');
        try {
            const sessions: ComplaintEmailSession[] = JSON.parse(localStorage.getItem('complaintEmailSessions') || '[]');
            const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
            if (sessionIndex === -1) {
                throw new Error("Session not found");
            }

            const updatedSession = {
                ...sessions[sessionIndex],
                grade: Number(grade),
                lecturerFeedback: lecturerFeedback.trim()
            };
            sessions[sessionIndex] = updatedSession;

            localStorage.setItem('complaintEmailSessions', JSON.stringify(sessions));
            
            setFeedbackSaveStatus('saved');
            setTimeout(() => setFeedbackSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Error saving lecturer feedback:", error);
            setFeedbackSaveStatus('error');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {feedback && (
                <>
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
                </>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
                <Card title="Your Email">
                    <pre className="p-4 text-sm text-slate-300 whitespace-pre-wrap font-sans h-64 overflow-y-auto">{userEmail}</pre>
                </Card>
                <Card title="Original Scenario">
                    <div className="p-4 text-sm text-slate-300 h-64 overflow-y-auto">
                        <p>{sessionData?.scenario || COMPLAINT_EMAIL_SCENARIO}</p>
                    </div>
                </Card>
            </div>

            {feedback && (
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
            )}

            {isLecturerView && (
               <Card title="Lecturer Assessment">
                   <div className="p-4 space-y-4">
                       <div>
                           <label htmlFor="grade" className="block text-sm font-medium text-slate-300">Grade (%)</label>
                           <input
                               type="number"
                               id="grade"
                               value={grade}
                               onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
                               min="0"
                               max="100"
                               placeholder="Enter a score from 0 to 100"
                               className="mt-1 w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-fuchsia-500"
                           />
                       </div>
                       <div>
                           <label htmlFor="lecturerFeedback" className="block text-sm font-medium text-slate-300">Written Feedback</label>
                           <textarea
                               id="lecturerFeedback"
                               value={lecturerFeedback}
                               onChange={(e) => setLecturerFeedback(e.target.value)}
                               rows={4}
                               placeholder="Provide constructive feedback..."
                               className="mt-1 w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-fuchsia-500"
                           />
                       </div>
                       <button
                           onClick={handleSaveLecturerFeedback}
                           disabled={feedbackSaveStatus === 'saving' || feedbackSaveStatus === 'saved'}
                           className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-700/50 disabled:cursor-not-allowed transition-colors"
                       >
                           {feedbackSaveStatus === 'saving' ? 'Saving...' : feedbackSaveStatus === 'saved' ? 'Feedback Saved!' : 'Save Feedback'}
                       </button>
                   </div>
               </Card>
            )}

            {!isLecturerView && (
                <div className="text-center mt-6 space-y-4">
                    {statusMessage && (
                        <p className={`text-center mb-3 text-xs transition-opacity duration-500 ${messageIsVisible ? 'opacity-100' : 'opacity-0'} ${statusMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                            {statusMessage}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <button onClick={onPracticeAgain} className="bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-fuchsia-700 transition-colors focus:outline-none focus:ring-4 focus:ring-fuchsia-500/50 text-sm">
                            Practice Again
                        </button>
                        {isStudent && (
                            <button
                                onClick={handleSubmitToLecturer}
                                disabled={isSubmitted}
                                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/50 text-sm disabled:bg-slate-500 disabled:cursor-not-allowed"
                            >
                                {isSubmitted ? 'Submitted!' : 'Submit to Lecturer'}
                            </button>
                        )}
                    </div>
                    {onBack && (
                        <button onClick={onBack} className="text-sm text-fuchsia-400 hover:text-fuchsia-300 flex items-center mx-auto mt-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            Back to Practice Selection
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
export default ComplaintFeedbackDisplay;