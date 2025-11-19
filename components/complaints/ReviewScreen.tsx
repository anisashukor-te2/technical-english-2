
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../Card';
import Modal from '../common/Modal';
import Loader from '../Loader';
import { ComplaintSession, Student, Lecturer, ComplaintEmailSession } from '../../types';
import { getComplaintSessions, getComplaintEmailSessions, saveComplaintEmailLecturerFeedback } from '../../services/firebaseService';
import ComplaintFeedbackDisplay from './ComplaintFeedbackDisplay';

interface ReviewScreenProps {
    onBack: () => void;
    user: Student | Lecturer;
    userType: 'student' | 'lecturer';
    selectedClass: string;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; }> = ({ label, value, icon }) => (
    <div className="bg-slate-800/60 p-4 rounded-lg flex items-center gap-4 border border-slate-700 shadow-sm">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-cyan-900/50 text-cyan-400">
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    </div>
);

const ChatTranscript: React.FC<{ session: ComplaintSession }> = ({ session }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
        {session.messages.map((item, index) => (
            <div key={index} className={`flex items-start gap-3 ${item.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
                 {item.speaker === 'AI' && (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                )}
                <div className={`max-w-lg p-3 rounded-lg ${item.speaker === 'You' ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                    <p className={`font-bold text-sm mb-1 ${item.speaker === 'You' ? 'text-cyan-50' : 'text-slate-300'}`}>{item.speaker === 'You' ? 'You' : 'AI'}</p>
                    <p className={`${item.speaker === 'You' ? 'text-white' : 'text-slate-200'} whitespace-pre-wrap text-sm`}>{item.text}</p>
                </div>
            </div>
        ))}
    </div>
);

type CombinedSession = (ComplaintSession & { type: 'verbal' }) | (ComplaintEmailSession & { type: 'written' });

const ReviewScreen: React.FC<ReviewScreenProps> = ({ onBack, user, userType, selectedClass }) => {
    const [sessions, setSessions] = useState<CombinedSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<CombinedSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const verbalSessions = await getComplaintSessions(user, selectedClass);
            const emailSessions = await getComplaintEmailSessions(user, selectedClass);

            const typedVerbalSessions = verbalSessions.map(s => ({ ...s, type: 'verbal' as const }));
            const typedEmailSessions = emailSessions.map(s => ({ ...s, type: 'written' as const }));

            const allSessions: CombinedSession[] = [...typedVerbalSessions, ...typedEmailSessions];
            allSessions.sort((a, b) => b.timestamp - a.timestamp);
            setSessions(allSessions);
        } catch (error) {
            console.error("Error fetching sessions from Firebase:", error);
            setError("Failed to load sessions. Please check your internet connection.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [user, selectedClass]);

    // LECTURER VIEW (simplified for brevity, mirroring student logic for connection errors)
    if (userType === 'lecturer') {
         return (
            <div className="max-w-5xl mx-auto animate-fade-in pb-24">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white">Review Student Submissions</h2>
                     <p className="mt-2 text-lg text-slate-400">Viewing submissions for: <span className="font-semibold text-cyan-400">{selectedClass === 'ALL' ? 'All Classes' : selectedClass}</span></p>
                </div>
                <Card title="Sessions">
                    {isLoading ? (
                        <div className="p-8">
                            <Loader message="Loading sessions..." />
                        </div>
                    ) : error ? (
                         <div className="p-8 text-center">
                            <p className="text-red-400 mb-4">{error}</p>
                            <button onClick={fetchSessions} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">Retry</button>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="p-8 text-center border-dashed border border-slate-700 rounded-lg">
                            <p className="text-slate-500">No sessions found.</p>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-slate-400">Session list logic here...</div>
                    )}
                </Card>
                 <div className="text-center mt-8">
                    <button onClick={onBack} className="text-sm text-cyan-400 hover:text-cyan-300">Back to Menu</button>
                </div>
            </div>
        );
    }

    // STUDENT VIEW
    const studentSessions = sessions;

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-24">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Review: My Complaint Handling Performance</h2>
                <p className="mt-2 text-lg text-slate-300">Analyze your performance and track your improvement over time.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatCard label="Total Sessions" value={studentSessions.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                <StatCard label="Most Practiced" value={studentSessions.length > 0 && studentSessions[0]?.type === 'verbal' ? studentSessions[0].scenarioTitle : 'Email Practice' || 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>

            <Card title="Practice History">
                {isLoading ? (
                    <div className="p-8">
                         <Loader message="Loading sessions..." />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button onClick={fetchSessions} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">Retry</button>
                    </div>
                ) : studentSessions.length === 0 ? (
                    <div className="text-center p-8">
                         <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h3 className="mt-4 text-xl font-semibold text-slate-300">No Complaint Practice History</h3>
                        <p className="text-slate-400 mt-1">Complete a complaint handling simulation to see your performance analytics here.</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                        {studentSessions.map(session => {
                            const title = session.type === 'verbal' ? `Verbal: ${session.scenarioTitle}` : 'Written Email Submission';
                            return (
                                <div key={session.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-300">{title}</p>
                                        <p className="text-xs text-slate-400">Completed: {new Date(session.timestamp).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => setSelectedSession(session)} className="text-sm bg-slate-700 hover:bg-cyan-600 hover:text-white px-3 py-1 rounded text-slate-200">View Details</button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </Card>

            <div className="text-center mt-8">
                <button onClick={onBack} className="text-sm text-cyan-400 hover:text-cyan-300">Back to Menu Selection</button>
            </div>
            {selectedSession && (
                <Modal isOpen={!!selectedSession} onClose={() => setSelectedSession(null)} title={`Reviewing Session`}>
                    {selectedSession.type === 'verbal' ? (
                        <ChatTranscript session={selectedSession} />
                    ) : (
                         <ComplaintFeedbackDisplay
                            feedback={selectedSession.feedbackData}
                            userEmail={selectedSession.userEmail}
                            onPracticeAgain={() => {}} // N/A
                            onBack={() => setSelectedSession(null)}
                            isStudent={true}
                            sessionId={selectedSession.id}
                            sessionData={selectedSession}
                        />
                    )}
                </Modal>
            )}
        </div>
    );
};

export default ReviewScreen;
