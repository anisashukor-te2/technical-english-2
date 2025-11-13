import React, { useState, useEffect, useMemo } from 'react';
import { PracticeSession, Student, Lecturer } from '../types';
import * as firebaseService from '../services/firebaseService';
import Card from './Card';
import LineChart from './common/LineChart';
import Badge from './common/Badge';
import Modal from './common/Modal';
import FeedbackScreen from './FeedbackScreen';
import { usePresentation } from '../contexts/PresentationContext';
import Loader from './Loader';

interface PresentationReviewScreenProps {
  user: Student | Lecturer;
  userType: 'student' | 'lecturer';
  selectedClass: string;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; }> = ({ label, value, icon }) => (
    <div className="bg-slate-900/50 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-cyan-600">
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    </div>
);

export const PresentationReviewScreen: React.FC<PresentationReviewScreenProps> = ({ user, userType, selectedClass }) => {
  const { handleBackToSelection } = usePresentation();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const userSessions = await firebaseService.getSessions<PracticeSession>('practiceSessions', user, selectedClass);
            setSessions(userSessions);
        } catch (error) {
            console.error("Error fetching sessions from Firestore:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchSessions();
  }, [user, userType, selectedClass]);


  const handleCloseModal = () => {
    setSelectedSession(null);
  };

  if (isLoading) {
    return <Loader message="Loading sessions..." />;
  }

  // LECTURER VIEW
  if (userType === 'lecturer') {
    if (sessions.length === 0) {
        return (
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
                <div className="text-center bg-slate-800/50 border border-dashed border-slate-600 rounded-lg p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                    <h3 className="mt-4 text-xl font-semibold text-slate-300">No Student Sessions</h3>
                    <p className="text-slate-500 mt-1">{selectedClass === 'ALL' ? 'When students submit sessions, they will appear here.' : `No sessions found for class "${selectedClass}".`}</p>
                </div>
                <div className="text-center mt-8">
                    <button onClick={handleBackToSelection} className="text-sm text-cyan-600 hover:text-cyan-500 flex items-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Back to Menu Selection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-24">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Review Student Submissions</h2>
                <p className="mt-2 text-lg text-slate-400">Viewing submissions for: <span className="font-semibold text-cyan-600">{selectedClass === 'ALL' ? 'All Classes' : selectedClass}</span></p>
            </div>
            <Card title="Completed Sessions">
                <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                   {sessions.map(session => (
                       <div key={session.id} className={`p-3 bg-slate-900/50 rounded-lg flex items-center justify-between ${session.isSubmitted && !session.grade ? 'animate-highlight-fade border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}>
                           <div>
                               <p className="font-semibold text-slate-300">Student: {session.studentEmail}</p>
                               <p className="text-xs text-slate-400">Completed: {new Date(session.timestamp).toLocaleString()}</p>
                               <div className="flex items-center gap-4 mt-1">
                                <p className="text-xs text-slate-400">Score: {session.feedbackData.overallScore}%</p>
                                {session.isSubmitted && !session.grade && <span className="text-xs font-semibold bg-blue-600/20 text-blue-500 px-2 py-0.5 rounded-full">Submitted for Grading</span>}
                                {session.grade !== undefined && <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Graded: {session.grade}%</span>}
                               </div>

                           </div>
                           <button onClick={() => setSelectedSession(session)} className="text-sm bg-slate-700 hover:bg-cyan-800 px-3 py-1 rounded">View Details</button>
                       </div>
                   ))}
                </div>
            </Card>
            <div className="text-center mt-8">
                <button onClick={handleBackToSelection} className="text-sm text-cyan-600 hover:text-cyan-500 flex items-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back to Menu Selection
                </button>
            </div>
            {selectedSession && (
                <Modal isOpen={!!selectedSession} onClose={handleCloseModal} title={`Reviewing Submission from ${selectedSession.studentEmail}`}>
                    <FeedbackScreen
                        feedback={selectedSession.feedbackData}
                        onPracticeAgain={() => {}}
                        onBackToMenu={handleCloseModal}
                        recordingUrl=""
                        slides={selectedSession.slides}
                        sessionId={selectedSession.id}
                        studentEmail={selectedSession.studentEmail}
                        isLecturerView={true}
                        isStudent={false}
                        sessionData={selectedSession}
                    />
                </Modal>
            )}
        </div>
    );
  }

  // STUDENT VIEW
  const studentSessions = sessions;
  const stats = useMemo(() => {
    if (studentSessions.length === 0) return { avgScore: 0, avgWpm: 0, totalFillerWords: 0, sessionCount: 0 };
    const totalScore = studentSessions.reduce((sum, s) => sum + s.feedbackData.overallScore, 0);
    const totalWpm = studentSessions.reduce((sum, s) => sum + s.feedbackData.pacing.wpm, 0);
    const totalFillerWords = studentSessions.reduce((sum, s) => sum + s.feedbackData.fillerWords.reduce((acc, fw) => acc + fw.count, 0), 0);
    return {
        avgScore: Math.round(totalScore / studentSessions.length),
        avgWpm: Math.round(totalWpm / studentSessions.length),
        totalFillerWords,
        sessionCount: studentSessions.length
    };
  }, [studentSessions]);

  const chartData = useMemo(() => {
      const reversedSessions = [...studentSessions].reverse(); // Oldest first for chart
      const labels = reversedSessions.map((_, i) => `S${i + 1}`);
      const scoreData = reversedSessions.map(s => s.feedbackData.overallScore);
      const wpmData = reversedSessions.map(s => s.feedbackData.pacing.wpm);
      return { labels, scoreData, wpmData };
  }, [studentSessions]);

  const unlockedBadges = useMemo(() => {
    return {
        firstPractice: studentSessions.length > 0,
        highScorer: studentSessions.some(s => s.feedbackData.overallScore >= 90),
        perfectPacing: studentSessions.some(s => s.feedbackData.pacing.wpm >= 140 && s.feedbackData.pacing.wpm <= 160),
        fillerFree: studentSessions.some(s => s.feedbackData.fillerWords.length === 0),
        keywordKing: studentSessions.some(s => s.feedbackData.keywordAnalysis.keywordsMissed.length === 0 && s.feedbackData.keywordAnalysis.keywordsFound.length > 5),
        consistent: studentSessions.length >= 5,
    };
  }, [studentSessions]);

  if (studentSessions.length === 0) {
    return (
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
             <div className="text-center bg-slate-800/50 border border-dashed border-slate-600 rounded-lg p-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                <h3 className="mt-4 text-xl font-semibold text-slate-300">No Presentation History</h3>
                <p className="text-slate-500 mt-1">Complete a practice session to see your performance analytics here.</p>
            </div>
             <div className="text-center mt-8">
                <button onClick={handleBackToSelection} className="text-sm text-cyan-600 hover:text-cyan-500 flex items-center mx-auto">
                    Back to Menu Selection
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-24">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Review: My Presentation Performance</h2>
            <p className="mt-2 text-lg text-slate-400">Analyze your performance and track your improvement over time.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Average Score" value={`${stats.avgScore}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <StatCard label="Average Pace" value={`${stats.avgWpm} WPM`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
            <StatCard label="Total Sessions" value={stats.sessionCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
            <StatCard label="Total Filler Words" value={stats.totalFillerWords} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>} />
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
             <Card title="Performance Over Time">
                <div className="p-4 space-y-4">
                    <LineChart data={chartData.scoreData} labels={chartData.labels} title="Overall Score" color="#0e7490" yAxisLabel="Score %" />
                    <LineChart data={chartData.wpmData} labels={chartData.labels} title="Words Per Minute (WPM)" color="#EC4899" yAxisLabel="WPM" />
                </div>
            </Card>
             <Card title="Practice History">
                <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                   {studentSessions.map(session => (
                       <div key={session.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                           <div>
                               <p className="font-semibold text-slate-300">Session from {new Date(session.timestamp).toLocaleString()}</p>
                               <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Score: <span className="font-semibold text-slate-200">{session.feedbackData.overallScore}%</span>
                                    </span>
                                    {session.grade !== undefined && (
                                        <span className="font-semibold bg-blue-600/20 text-blue-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            Graded
                                        </span>
                                    )}
                                </div>
                           </div>
                           <button onClick={() => setSelectedSession(session)} className="text-sm bg-slate-700 hover:bg-cyan-800 px-3 py-1 rounded">View Details</button>
                       </div>
                   ))}
                </div>
            </Card>
        </div>
        <div className="mt-6">
            <Card title="Achievements">
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    <Badge title="First Step" description="Complete your first practice." icon="🎉" unlocked={unlockedBadges.firstPractice} />
                    <Badge title="High Scorer" description="Get a score of 90% or higher." icon="🏆" unlocked={unlockedBadges.highScorer} />
                    <Badge title="Perfect Pacing" description="Achieve a pace between 140-160 WPM." icon="⏱️" unlocked={unlockedBadges.perfectPacing} />
                    <Badge title="Fluent Speaker" description="Deliver a speech with zero filler words." icon="💬" unlocked={unlockedBadges.fillerFree} />
                    <Badge title="Subject Expert" description="Use all keywords and miss none." icon="🔑" unlocked={unlockedBadges.keywordKing} />
                    <Badge title="Consistent Performer" description="Complete 5 practice sessions." icon="🏅" unlocked={unlockedBadges.consistent} />
                </div>
            </Card>
        </div>
        <div className="text-center mt-8">
            <button onClick={handleBackToSelection} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-slate-500">
                Back to Menu Selection
            </button>
        </div>
        {selectedSession && (
            <Modal isOpen={!!selectedSession} onClose={handleCloseModal} title={`Reviewing Session from ${selectedSession.studentEmail}`}>
                <FeedbackScreen
                    feedback={selectedSession.feedbackData}
                    onPracticeAgain={() => {}}
                    onBackToMenu={handleCloseModal}
                    recordingUrl=""
                    slides={selectedSession.slides}
                    sessionId={selectedSession.id}
                    studentEmail={selectedSession.studentEmail}
                    isStudent={true}
                    sessionData={selectedSession}
                />
            </Modal>
        )}
    </div>
  );
};
