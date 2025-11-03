
import React from 'react';
import { useState, useEffect } from 'react';
import { FeedbackData, PracticeSession, Slide, PeerFeedback } from '../types';
import Card from './Card';

interface FeedbackScreenProps {
  feedback: FeedbackData;
  onPracticeAgain: () => void;
  onBackToMenu: () => void;
  recordingUrl: string;
  slides?: Slide[] | null;
  sessionId: string | null;
  studentEmail: string;
  isLecturerView?: boolean;
  isStudent?: boolean;
  sessionData?: PracticeSession;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const colorClass = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="relative flex items-center justify-center w-28 h-28">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                <circle className={colorClass} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
            </svg>
            <span className={`absolute text-3xl font-bold ${colorClass}`}>{score}</span>
        </div>
    );
};

const HighlightedTranscription: React.FC<{
  transcription: string;
  keywordsFound: string[];
}> = ({ transcription, keywordsFound }) => {
  // Memoize the regex creation for performance.
  const keywordRegex = React.useMemo(() => {
    if (!keywordsFound || keywordsFound.length === 0) {
      return null;
    }
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Sort by length to match longer phrases first (e.g., "bolted joint assembly" before "bolted joint")
    const sortedKeywords = [...keywordsFound].sort((a, b) => b.length - a.length);
    return new RegExp(`(${sortedKeywords.map(escapeRegExp).join('|')})`, 'gi');
  }, [keywordsFound]);

  // Split the transcription into sentences. The regex uses a positive lookbehind
  // to split after punctuation while keeping the punctuation mark. It also filters out empty strings.
  const sentences = transcription.split(/(?<=[.?!])\s+/).filter(s => s.trim());

  return (
    <div className="space-y-3"> {/* Adds vertical space between each paragraph */}
      {sentences.map((sentence, sentenceIndex) => {
        // If there's no regex, just return the sentence. Otherwise, split it by keywords.
        const parts = keywordRegex ? sentence.split(keywordRegex) : [sentence];
        
        return (
          <p key={sentenceIndex}>
            {parts.map((part, partIndex) =>
              // Odd-indexed parts are the keywords themselves due to the capturing group in split()
              keywordRegex && partIndex % 2 === 1 ? (
                <span key={partIndex} className="bg-green-900/50 text-green-300 font-semibold px-1 py-0.5 rounded">
                  {part}
                </span>
              ) : (
                <React.Fragment key={partIndex}>{part}</React.Fragment>
              )
            )}
          </p>
        );
      })}
    </div>
  );
};

const SlidesViewer: React.FC<{ slides: Slide[] }> = ({ slides }) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const currentSlide = slides[currentSlideIndex];

    if (!slides || slides.length === 0) {
        return <p className="text-slate-500">No slides were provided for this session.</p>;
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[40vh] max-h-[500px]">
            {/* Slide list */}
            <div className="w-full md:w-1/3 md:border-r md:border-slate-700 md:pr-4 overflow-y-auto">
                <h4 className="text-md font-semibold text-slate-300 mb-3 sticky top-0 bg-slate-800 pb-2">Slide Deck</h4>
                <ul className="space-y-2">
                    {slides.map((slide, index) => (
                        <li 
                            key={slide.id} 
                            onClick={() => setCurrentSlideIndex(index)}
                            className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${currentSlideIndex === index ? 'border-fuchsia-500 bg-slate-700/50' : 'border-transparent bg-slate-900/50 hover:bg-slate-700'}`}
                        >
                            <p className="text-sm font-semibold text-slate-200 truncate">{slide.title || `Slide ${index + 1}`}</p>
                            <p className="text-xs text-slate-400">Slide {index + 1}</p>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Current slide content */}
            <div className="w-full md:w-2/3 overflow-y-auto">
                {currentSlide ? (
                    <div>
                        <h4 className="text-lg font-bold text-fuchsia-400 mb-2 sticky top-0 bg-slate-800 pb-2">{currentSlide.title}</h4>
                        <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                            <p>{currentSlide.script || <span className="italic text-slate-500">No script provided for this slide.</span>}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-slate-500">Select a slide to view its content.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ feedback, onPracticeAgain, onBackToMenu, recordingUrl, slides, sessionId, studentEmail, isLecturerView = false, isStudent = true, sessionData }) => {
    const [selfReflection, setSelfReflection] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(isLecturerView ? null : 'Session auto-saved! Add your reflections below.');
    const [messageIsVisible, setMessageIsVisible] = useState(false);
    const [statusMessageType, setStatusMessageType] = useState<'success' | 'error'>('success');
    const [isNotesSaved, setIsNotesSaved] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(sessionData?.isSubmitted || false);
    const [mediaSrc, setMediaSrc] = useState<string>(recordingUrl); // Initial src is the blob URL for immediate playback
    
    // State for lecturer feedback
    const [grade, setGrade] = useState<number | ''>(sessionData?.grade ?? '');
    const [lecturerFeedback, setLecturerFeedback] = useState<string>(sessionData?.lecturerFeedback ?? '');
    const [feedbackSaveStatus, setFeedbackSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        // If this is a review of a past session, construct a data URL from base64 data
        if (sessionData?.recordingData) {
            setMediaSrc(`data:${sessionData.recordingMimeType};base64,${sessionData.recordingData}`);
        } else {
            setMediaSrc(recordingUrl); // Otherwise, use the blob URL passed in props
        }
    }, [sessionData, recordingUrl]);

    useEffect(() => {
        if (sessionData) {
            setSelfReflection(sessionData.selfReflection || '');
            setIsSubmitted(sessionData.isSubmitted || false);
        } else if (sessionId) {
            // Fetch initial state if sessionData is not provided from local storage
            try {
                const allSessions: PracticeSession[] = JSON.parse(localStorage.getItem('practiceSessions') || '[]');
                const currentSession = allSessions.find(s => s.id === sessionId);
                if (currentSession) {
                    setSelfReflection(currentSession.selfReflection || '');
                    setIsSubmitted(currentSession.isSubmitted || false);
                }
            } catch (error) {
                console.error("Failed to load session from local storage", error);
            }
        }
    }, [sessionId, sessionData]);


    useEffect(() => {
        if (saveStatusMessage) {
            setMessageIsVisible(true);
            const fadeTimer = setTimeout(() => setMessageIsVisible(false), 2500);
            const removeTimer = setTimeout(() => setSaveStatusMessage(null), 3000);
            return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
        }
    }, [saveStatusMessage]);
    
    const handleShareForReview = async () => {
        if (!sessionId) {
            setSaveStatusMessage("Cannot share: session data not found.");
            setStatusMessageType('error');
            return;
        }

        try {
            const allPracticeSessions: PracticeSession[] = JSON.parse(localStorage.getItem('practiceSessions') || '[]');
            const sessionToShare = allPracticeSessions.find(s => s.id === sessionId);

            if (!sessionToShare) {
                throw new Error("Original session not found in local storage.");
            }
            
            const peerReviewSessions: PracticeSession[] = JSON.parse(localStorage.getItem('peerReviewSessions') || '[]');
            peerReviewSessions.push({
                ...sessionToShare,
                id: `peer_${sessionId}`, // Make a unique ID for the peer copy
                // originalSessionId: sessionId, // Not in type, but good for tracking
                // sharedTimestamp: Date.now(), // Not in type
            });
            localStorage.setItem('peerReviewSessions', JSON.stringify(peerReviewSessions));

            setIsShared(true);
            setSaveStatusMessage("Session shared for peer review!");
            setStatusMessageType('success');
        } catch (error) {
            console.error("Failed to share session for peer review:", error);
            setSaveStatusMessage("Sorry, there was an error sharing your session.");
            setStatusMessageType('error');
        }
    };

    const updateSessionField = async (field: keyof PracticeSession, value: any) => {
        if (!sessionId) {
            setSaveStatusMessage("Error: Session ID is missing. Cannot save.");
            setStatusMessageType('error');
            return false;
        }
        try {
            const sessions: PracticeSession[] = JSON.parse(localStorage.getItem('practiceSessions') || '[]');
            const sessionIndex = sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex === -1) {
                setSaveStatusMessage("Error: Session not found.");
                setStatusMessageType('error');
                return false;
            }
            
            // Create a new object for the updated session to ensure state updates properly
            const updatedSession = { ...sessions[sessionIndex], [field]: value };
            sessions[sessionIndex] = updatedSession;
            
            localStorage.setItem('practiceSessions', JSON.stringify(sessions));
            return true;
        } catch (error) {
            console.error("Failed to update session:", error);
            setSaveStatusMessage("Sorry, there was an error saving your changes.");
            setStatusMessageType('error');
            return false;
        }
    };

    const handleSaveNotes = async () => {
        if (isNotesSaved) return;
        const success = await updateSessionField('selfReflection', selfReflection.trim() || '');
        if (success) {
            setSaveStatusMessage("Notes updated!");
            setStatusMessageType('success');
            setIsNotesSaved(true);
            setTimeout(() => setIsNotesSaved(false), 2500);
        }
    };

    const handleSubmitToLecturer = async () => {
        const success = await updateSessionField('isSubmitted', true);
        if (success) {
            setIsSubmitted(true);
            setSaveStatusMessage("Successfully submitted to lecturer!");
            setStatusMessageType('success');
        }
    };
    
    const handleSaveLecturerFeedback = async () => {
        if (grade === '' || !lecturerFeedback.trim()) {
            alert("Please provide both a grade and written feedback.");
            return;
        }
        if (!sessionId) return;

        setFeedbackSaveStatus('saving');
        try {
            const sessions: PracticeSession[] = JSON.parse(localStorage.getItem('practiceSessions') || '[]');
            const sessionIndex = sessions.findIndex(s => s.id === sessionId);
            if (sessionIndex === -1) {
                throw new Error("Session not found");
            }

            const updatedSession = {
                ...sessions[sessionIndex],
                grade: Number(grade),
                lecturerFeedback: lecturerFeedback.trim()
            };
            sessions[sessionIndex] = updatedSession;

            localStorage.setItem('practiceSessions', JSON.stringify(sessions));
            
            setFeedbackSaveStatus('saved');
            setTimeout(() => setFeedbackSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Error saving lecturer feedback:", error);
            setFeedbackSaveStatus('error');
        }
    };


    return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-6 pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <Card title="Overall Score">
                    <div className="flex flex-col items-center justify-center p-2">
                        <ScoreCircle score={feedback.overallScore} />
                        <p className="text-center text-slate-400 text-sm mt-2">An aggregated score based on pacing, keyword usage, language, and clarity.</p>
                    </div>
                </Card>
                <Card title="Pacing">
                    <div className="flex flex-col items-center justify-center p-3 h-full">
                        <p className="text-5xl font-bold text-fuchsia-400">{feedback.pacing.wpm}<span className="text-xl font-normal text-slate-400"> WPM</span></p>
                        <p className="mt-1 text-center text-slate-400 text-sm">{feedback.pacing.feedback}</p>
                        <p className="text-xs text-slate-500 mt-1">(Aim for 140-160 WPM)</p>
                    </div>
                </Card>
                <Card title="Filler Words">
                    <div className="p-3">
                        {feedback.fillerWords.length > 0 ? (
                            <ul className="space-y-2">
                                {feedback.fillerWords.map(fw => (
                                    <li key={fw.word} className="flex justify-between items-center text-slate-300">
                                        <span className="font-mono bg-slate-700 px-2 py-1 rounded text-fuchsia-400 text-sm">"{fw.word}"</span>
                                        <span className="font-semibold">{fw.count} time(s)</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-slate-400">No filler words detected. Great job!</p>
                        )}
                    </div>
                </Card>
            </div>

            {feedback.sessionSummary && (
                <Card title="Session Summary">
                    <div className="p-4">
                        <ul className="list-disc list-inside space-y-2 text-slate-300">
                            {feedback.sessionSummary.split('-').filter(s => s.trim()).map((point, index) => (
                                <li key={index}>{point.trim()}</li>
                            ))}
                        </ul>
                    </div>
                </Card>
            )}

            <Card title="Recording & Transcription">
                <div className="p-4">
                   {mediaSrc && (sessionData?.recordingMimeType?.startsWith('video/') || (slides && slides.length > 0)) ? (
                        <video controls src={mediaSrc} className="w-full mb-3 rounded-md bg-black">
                            Your browser does not support the video element.
                        </video>
                    ) : mediaSrc ? (
                        <audio controls src={mediaSrc} className="w-full mb-3 rounded-md">
                            Your browser does not support the audio element.
                        </audio>
                    ) : (
                        <div className="w-full h-14 flex items-center justify-center bg-slate-900 rounded-md mb-3">
                            <p className="text-slate-500 text-sm">Loading recording...</p>
                        </div>
                    )}
                    <div className="max-h-96 overflow-y-auto text-slate-300 leading-relaxed border-t border-slate-700 pt-3 text-sm">
                        <HighlightedTranscription
                            transcription={feedback.transcription}
                            keywordsFound={feedback.keywordAnalysis.keywordsFound}
                        />
                    </div>
                </div>
            </Card>

            {slides && slides.length > 0 && (
                <Card title="Presentation Slides & Script">
                    <div className="p-4">
                        <SlidesViewer slides={slides} />
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6">
                <Card title="Delivery & Content Analysis">
                    <div className="p-4 space-y-6">
                        <div>
                            <h4 className="font-semibold text-fuchsia-400 mb-2 text-md">Technical Keyword Usage</h4>
                            <div className="space-y-2">
                                <div>
                                    <h5 className="font-semibold text-green-400 mb-1 text-sm">Found ({feedback.keywordAnalysis.keywordsFound.length})</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {feedback.keywordAnalysis.keywordsFound.length > 0 ? feedback.keywordAnalysis.keywordsFound.map(k => <span key={k} className="bg-green-900/50 text-green-300 text-xs font-medium px-2 py-0.5 rounded">{k}</span>) : <p className="text-xs text-slate-400 italic">None found.</p>}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-yellow-400 mb-1 text-sm">Missed ({feedback.keywordAnalysis.keywordsMissed.length})</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {feedback.keywordAnalysis.keywordsMissed.length > 0 ? feedback.keywordAnalysis.keywordsMissed.map(k => <span key={k} className="bg-yellow-900/50 text-yellow-300 text-xs font-medium px-2 py-0.5 rounded">{k}</span>) : <p className="text-xs text-slate-400 italic">None missed. Well done!</p>}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 pt-2 border-t border-slate-700/50">{feedback.keywordAnalysis.feedback}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-fuchsia-400 mb-2 text-md">Language & Clarity</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">{feedback.languageFeedback}</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-fuchsia-400 mb-2 text-md">Voice Modulation</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">{feedback.voiceModulation.feedback}</p>
                        </div>
                    </div>
                </Card>
                
                {sessionData?.grade !== undefined && sessionData?.lecturerFeedback && !isLecturerView && (
                    <Card title="Lecturer's Feedback">
                        <div className="p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-fuchsia-400 mb-1">Grade</h4>
                                <p className="text-2xl font-bold text-slate-200">{sessionData.grade}%</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-fuchsia-400 mb-1">Comments</h4>
                                <blockquote className="p-3 bg-slate-900 border-l-4 border-fuchsia-500 text-slate-300 italic text-sm">
                                    {sessionData.lecturerFeedback}
                                </blockquote>
                            </div>
                        </div>
                    </Card>
                )}

                <Card title={isLecturerView ? "Student's Self-Reflection" : "Actions & Self-Reflection"}>
                    {!isLecturerView ? (
                        <>
                             {isStudent && (
                                <div className="p-4">
                                    {saveStatusMessage && (
                                        <p className={`text-center mb-3 text-xs transition-opacity duration-500 ${messageIsVisible ? 'opacity-100' : 'opacity-0'} ${statusMessageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                            {saveStatusMessage}
                                        </p>
                                    )}
                                    <textarea
                                        value={selfReflection}
                                        onChange={(e) => setSelfReflection(e.target.value)}
                                        placeholder="What went well? What could be improved? Add your self-reflection notes here..."
                                        className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition text-sm"
                                        rows={2}
                                    ></textarea>
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={isNotesSaved}
                                        className="w-full mt-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/50 flex items-center justify-center gap-2 text-sm disabled:bg-green-700 disabled:cursor-not-allowed"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12l-5-3-5 3V4z" /></svg>
                                        {isNotesSaved ? 'Notes Saved!' : 'Save Notes'}
                                    </button>
                                </div>
                             )}
                            <div className="p-4 border-t border-slate-700">
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <button
                                        onClick={onPracticeAgain}
                                        className="bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-fuchsia-700 transition-colors focus:outline-none focus:ring-4 focus:ring-fuchsia-500/50 text-sm"
                                    >
                                        Practice Again
                                    </button>
                                    {isStudent && (
                                        <>
                                            <button
                                                onClick={handleSubmitToLecturer}
                                                disabled={isSubmitted}
                                                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/50 text-sm disabled:bg-slate-500 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitted ? 'Submitted!' : 'Submit to Lecturer'}
                                            </button>
                                            <button
                                                onClick={handleShareForReview}
                                                disabled={isShared}
                                                className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-4 focus:ring-purple-500/50 flex items-center justify-center gap-2 disabled:bg-slate-500 disabled:cursor-not-allowed text-sm"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                                                {isShared ? 'Shared!' : 'Share for Peer Review'}
                                            </button>
                                        </>
                                    )}
                                     <button
                                        onClick={onBackToMenu}
                                        className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-500/50 text-sm flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                        </svg>
                                        Back to Menu Selection
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-4">
                            {selfReflection ? (
                                <blockquote className="p-3 bg-slate-900 border-l-4 border-fuchsia-500 text-slate-300 italic text-sm">
                                    {selfReflection}
                                </blockquote>
                            ) : (
                                <p className="text-sm text-slate-500 text-center">The student did not add any self-reflection notes.</p>
                            )}
                        </div>
                    )}
                </Card>

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
            </div>
        </div>
    );
};

export default FeedbackScreen;