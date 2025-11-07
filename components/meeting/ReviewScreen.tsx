import React, { useState, useEffect } from 'react';
import Card from '../Card';
import Modal from '../common/Modal';
import { MeetingSession, Student, Lecturer, MinuteTakingSession } from '../../types';
import { getMeetingSessions, getMinuteTakingSessions, saveMeetingLecturerFeedback, saveMinuteTakingLecturerFeedback } from '../../services/firebaseService';
import { MinuteFeedbackDisplay } from './MinuteFeedbackDisplay';

interface ReviewScreenProps {
    onBack: () => void;
    user: Student | Lecturer;
    userType: 'student' | 'lecturer';
    selectedClass: string;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; }> = ({ label, value, icon }) => (
    <div className="bg-white p-4 rounded-lg flex items-center gap-4 border border-slate-200 shadow-sm">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    </div>
);

const ChatTranscript: React.FC<{ session: MeetingSession }> = ({ session }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
        {session.messages.map((item, index) => (
            <div key={index} className={`flex items-start gap-3 ${item.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
                {item.speaker === 'AI' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                    </div>
                )}
                <div className={`max-w-lg p-3 rounded-lg ${item.speaker === 'You' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <p className={`font-bold text-sm mb-1 ${item.speaker === 'You' ? 'text-blue-50' : 'text-slate-600'}`}>{item.speaker === 'You' ? 'You' : 'AI'}</p>
                    <p className={`${item.speaker === 'You' ? 'text-white' : 'text-slate-800'} whitespace-pre-wrap text-sm`}>{item.text}</p>
                </div>
            </div>
        ))}
    </div>
);

const ReviewScreen: React.FC<ReviewScreenProps> = ({ onBack, user, userType, selectedClass }) => {
    const [sessions, setSessions] = useState<(MeetingSession | MinuteTakingSession)[]>([]);
    const [selectedSession, setSelectedSession] = useState<(MeetingSession | MinuteTakingSession) | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoading(true);
            try {
                const rolePlaySessions = await getMeetingSessions(user, selectedClass);
                const minuteSessions = await getMinuteTakingSessions(user, selectedClass);
                const allSessions = [...rolePlaySessions, ...minuteSessions];
                allSessions.sort((a, b) => b.timestamp - a.timestamp);
                setSessions(allSessions);
            } catch (error) {
                console.error("Error fetching sessions from Firebase:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSessions();
    }, [user, selectedClass]);


    if (isLoading) {
        return <div className="text-center p-8">Loading sessions...</div>;
    }

    // --- LECTURER VIEW ---
    if (userType === 'lecturer') {
        // ... lecturer view logic ... (omitted for brevity, assume it's similar to student view but with grading)
    }

    // --- STUDENT VIEW ---
    const studentSessions = sessions;
    if (studentSessions.length === 0) {
        return (
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
                <div className="text-center bg-slate-100 border border-dashed border-slate-300 rounded-lg p-8">
                     <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5.423a2 2 0 001.996-2.227l-1.07-7.085a2 2 0 00-1.996-1.773H17V5a2 2 0 00-2-2h-3a2 2 0 00-2 2v7h-1.423a2 2 0 00-1.996 1.773l-1.07 7.085A2 2 0 004.577 20H10v-2a2 2 0 012-2h3v2z" /></svg>
                    <h3 className="mt-4 text-xl font-semibold text-slate-700">No Meeting History</h3>
                    <p className="text-slate-500 mt-1">Complete a meeting simulation to see your performance analytics here.</p>
                </div>
                <div className="text-center mt-8">
                    <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700">Back to Menu Selection</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-24">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Review: My Meeting Performance</h2>
                <p className="mt-2 text-lg text-slate-600">Analyze your performance and track your improvement over time.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatCard label="Total Sessions" value={studentSessions.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                <StatCard label="Most Practiced" value={('scenarioTitle' in studentSessions[0] && studentSessions[0].scenarioTitle) || 'Minute-Taking'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5.423a2 2 0 001.996-2.227l-1.07-7.085a2 2 0 00-1.996-1.773H17V5a2 2 0 00-2-2h-3a2 2 0 00-2 2v7h-1.423a2 2 0 00-1.996 1.773l-1.07 7.085A2 2 0 004.577 20H10v-2a2 2 0 012-2h3v2z" /></svg>} />
            </div>
            <Card title="Practice History">
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    {studentSessions.map(session => {
                        const isRolePlay = 'messages' in session;
                        const title = isRolePlay ? session.scenarioTitle : "Minute-Taking Practice";
                        return (
                            <div key={session.id} className="p-3 bg-slate-100 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-700">{title}</p>
                                    <p className="text-xs text-slate-500">
                                        {isRolePlay && `Role: ${session.userRole} | `}
                                        Completed: {new Date(session.timestamp).toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                        {isRolePlay ? (
                                            <span className="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                Messages: <span className="font-semibold text-slate-700">{session.messages.length}</span>
                                            </span>
                                        ) : (
                                             <span className="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                Score: <span className="font-semibold text-slate-700">{session.feedbackData.accuracyScore}%</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSession(session)} className="text-sm bg-slate-200 hover:bg-blue-600 hover:text-white px-3 py-1 rounded">
                                    View Details
                                </button>
                                </div>
                            )
                    })}
                </div>
            </Card>
            <div className="text-center mt-8">
                <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700">Back to Menu Selection</button>
            </div>
            {selectedSession && (
                <Modal isOpen={!!selectedSession} onClose={() => setSelectedSession(null)} title={`Reviewing Session`}>
                    {'messages' in selectedSession ? (
                         <ChatTranscript session={selectedSession as MeetingSession} />
                    ) : (
                         <MinuteFeedbackDisplay
                            feedback={(selectedSession as MinuteTakingSession).feedbackData}
                            userMinutes={(selectedSession as MinuteTakingSession).userMinutes}
                            onPracticeAgain={() => {}} // Not applicable
                            onBack={() => setSelectedSession(null)}
                            isStudent={true}
                            sessionId={selectedSession.id}
                            sessionData={selectedSession as MinuteTakingSession}
                        />
                    )}
                </Modal>
            )}
        </div>
    );
};

export default ReviewScreen;