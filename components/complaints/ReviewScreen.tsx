import React, { useState, useEffect, useMemo } from 'react';
import Card from '../Card';
import Modal from '../common/Modal';
import { ComplaintSession, Student, Lecturer } from '../../types';

interface ReviewScreenProps {
    onBack: () => void;
    user: Student | Lecturer;
    userType: 'student' | 'lecturer';
    selectedClass: string;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; }> = ({ label, value, icon }) => (
    <div className="bg-slate-900/50 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-fuchsia-400">
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
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
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                )}
                <div className={`max-w-lg p-3 rounded-lg ${item.speaker === 'You' ? 'bg-fuchsia-800/70' : 'bg-slate-700/70'}`}>
                    <p className={`font-bold text-sm mb-1 ${item.speaker === 'You' ? 'text-fuchsia-300' : 'text-slate-300'}`}>{item.speaker === 'You' ? 'You' : 'AI'}</p>
                    <p className="text-white whitespace-pre-wrap text-sm">{item.text}</p>
                </div>
            </div>
        ))}
    </div>
);

const ReviewScreen: React.FC<ReviewScreenProps> = ({ onBack, user, userType, selectedClass }) => {
    const [sessions, setSessions] = useState<ComplaintSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ComplaintSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        try {
            const allSessions: ComplaintSession[] = JSON.parse(localStorage.getItem('complaintSessions') || '[]');
            let userSessions: ComplaintSession[];

            if (userType === 'student') {
                userSessions = allSessions.filter(s => s.studentUid === user.uid);
            } else { // lecturer
                let lecturerSessions = allSessions.filter(s => s.lecturerEmail === user.email);
                if (selectedClass !== 'ALL') {
                    lecturerSessions = lecturerSessions.filter(s => s.classCode === selectedClass);
                }
                userSessions = lecturerSessions;
            }

            userSessions.sort((a, b) => b.timestamp - a.timestamp);
            setSessions(userSessions);
        } catch (error) {
            console.error("Error fetching sessions from local storage:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user.uid, user.email, userType, selectedClass]);


    if (isLoading) {
        return <div className="text-center p-8">Loading sessions...</div>;
    }

    // LECTURER VIEW
    if (userType === 'lecturer') {
        if (sessions.length === 0) {
            return (
                 <div className="max-w-4xl mx-auto text-center animate-fade-in">
                    <div className="text-center bg-slate-800/50 border border-dashed border-slate-600 rounded-lg p-8">
                       <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h3 className="mt-4 text-xl font-semibold text-slate-300">No Student Sessions</h3>
                        <p className="text-slate-500 mt-1">{selectedClass === 'ALL' ? 'When students complete complaint simulations, they will appear here.' : `No sessions found for class "${selectedClass}".`}</p>
                    </div>
                     <div className="text-center mt-8">
                        <button onClick={onBack} className="text-sm text-fuchsia-400 hover:text-fuchsia-300">Back to Menu Selection</button>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-5xl mx-auto animate-fade-in pb-24">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white">Review Complaint Submissions</h2>
                    <p className="mt-2 text-lg text-slate-400">Viewing submissions for: <span className="font-semibold text-fuchsia-400">{selectedClass === 'ALL' ? 'All Classes' : selectedClass}</span></p>
                </div>
                <Card title="Completed Sessions">
                    <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                        {sessions.map(session => (
                            <div key={session.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-300">Student: {session.studentEmail}</p>
                                    <p className="text-xs text-slate-400">Scenario: {session.scenarioTitle}</p>
                                    <p className="text-xs text-slate-400">Completed: {new Date(session.timestamp).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setSelectedSession(session)} className="text-sm bg-slate-700 hover:bg-fuchsia-600 px-3 py-1 rounded">View Transcript</button>
                            </div>
                        ))}
                    </div>
                </Card>
                {selectedSession && (
                    <Modal isOpen={!!selectedSession} onClose={() => setSelectedSession(null)} title={`Transcript: ${selectedSession.scenarioTitle}`}>
                        <ChatTranscript session={selectedSession} />
                    </Modal>
                )}
                 <div className="text-center mt-8">
                    <button onClick={onBack} className="text-sm text-fuchsia-400 hover:text-fuchsia-300">Back to Menu Selection</button>
                </div>
            </div>
        );
    }

    // STUDENT VIEW
    const studentSessions = sessions;
    if (studentSessions.length === 0) {
        return (
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
                <div className="text-center bg-slate-800/50 border border-dashed border-slate-600 rounded-lg p-8">
                     <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="mt-4 text-xl font-semibold text-slate-300">No Complaint Practice History</h3>
                    <p className="text-slate-500 mt-1">Complete a complaint handling simulation to see your performance analytics here.</p>
                </div>
                <div className="text-center mt-8">
                    <button onClick={onBack} className="text-sm text-fuchsia-400 hover:text-fuchsia-300">Back to Menu Selection</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-24">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Review: My Complaint Handling Performance</h2>
                <p className="mt-2 text-lg text-slate-400">Analyze your performance and track your improvement over time.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatCard label="Total Sessions" value={studentSessions.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                <StatCard label="Most Practiced" value={studentSessions[0]?.scenarioTitle || 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>
            <Card title="Practice History">
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    {studentSessions.map(session => (
                        <div key={session.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-slate-300">{session.scenarioTitle}</p>
                                <p className="text-xs text-slate-400">Role: {session.userRole} | Completed: {new Date(session.timestamp).toLocaleString()}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                        Messages: <span className="font-semibold text-slate-200">{session.messages.length}</span>
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSession(session)} className="text-sm bg-slate-700 hover:bg-fuchsia-600 px-3 py-1 rounded">View Transcript</button>
                        </div>
                    ))}
                </div>
            </Card>
            <div className="text-center mt-8">
                <button onClick={onBack} className="text-sm text-fuchsia-400 hover:text-fuchsia-300">Back to Menu Selection</button>
            </div>
            {selectedSession && (
                <Modal isOpen={!!selectedSession} onClose={() => setSelectedSession(null)} title={`Transcript: ${selectedSession.scenarioTitle}`}>
                    <ChatTranscript session={selectedSession} />
                </Modal>
            )}
        </div>
    );
};

export default ReviewScreen;