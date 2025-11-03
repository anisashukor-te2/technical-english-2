import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from '../Card';
import Loader from '../Loader';
import { MINUTE_TAKING_TRANSCRIPT, getMinuteTakingFeedback } from '../../services/geminiService';
import { MinuteFeedbackData, MinuteTakingSession, Student, Lecturer } from '../../types';
// FIX: Switched to a named import for MinuteFeedbackDisplay to resolve module resolution error.
import { MinuteFeedbackDisplay } from './MinuteFeedbackDisplay';

interface MinuteTakingPracticeScreenProps {
  onBack: () => void;
  user: Student | Lecturer | null;
}

const getCanonicalSpeaker = (speakerStr: string): 'Tuan Ihsan' | 'Iman' | 'Sarah' => {
  const lowerCaseStr = speakerStr.toLowerCase();
  if (lowerCaseStr.includes('ihsan')) {
    return 'Tuan Ihsan';
  }
  if (lowerCaseStr.includes('iman')) {
    return 'Iman';
  }
  if (lowerCaseStr.includes('sarah')) {
    return 'Sarah';
  }
  // This case should not be reached with the current transcript, but it's a safe fallback.
  return 'Tuan Ihsan';
};


const MinuteTakingPracticeScreen: React.FC<MinuteTakingPracticeScreenProps> = ({ onBack, user }) => {
  const [view, setView] = useState<'PRACTICE' | 'FEEDBACK'>('PRACTICE');
  const [userMinutes, setUserMinutes] = useState('');
  const [feedback, setFeedback] = useState<MinuteFeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused' | 'finished'>('idle');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utterancesQueue = useRef<SpeechSynthesisUtterance[]>([]);
  const synthRef = useRef(window.speechSynthesis);

  // Load voices and handle cleanup
  useEffect(() => {
    const synth = synthRef.current;
    const loadVoices = () => {
        setVoices(synth.getVoices().filter(v => v.lang.startsWith('en')));
    };
    
    // Voices may load asynchronously
    synth.onvoiceschanged = loadVoices;
    loadVoices(); // Initial attempt
    
    // Cleanup function to cancel speech if component unmounts
    return () => {
        if (synth.speaking) {
            synth.cancel();
        }
    };
  }, []);
  
  const playNextUtterance = useCallback(() => {
    const synth = synthRef.current;
    if (utterancesQueue.current.length > 0) {
      const utterance = utterancesQueue.current.shift();
      if(utterance) {
        utterance.onend = playNextUtterance; // Chain the next utterance
        synth.speak(utterance);
      }
    } else {
      setPlaybackState('finished');
    }
  }, []);

  const handlePlayPause = () => {
    const synth = synthRef.current;
    if (playbackState === 'playing') {
      synth.pause();
      setPlaybackState('paused');
    } else if (playbackState === 'paused') {
      synth.resume();
      setPlaybackState('playing');
    } else { // 'idle' or 'finished'
      if (voices.length === 0) {
        alert("Speech synthesis voices are still loading. Please wait a moment and try again.");
        return;
      }
      synth.cancel(); // Clear any previous speech
      
      const enVoices = voices.filter(v => v.lang.startsWith('en'));
      if (enVoices.length === 0) {
          alert("No English speech synthesis voices found in your browser.");
          return;
      }
  
      // Heuristics to find gendered voices
      const femaleVoices = enVoices.filter(v => v.name.toLowerCase().includes('female') || ['zira', 'susan', 'eva', 'serena', 'hazel'].some(n => v.name.toLowerCase().includes(n)));
      const maleVoices = enVoices.filter(v => v.name.toLowerCase().includes('male') || ['david', 'mark', 'tom', 'alex', 'george'].some(n => v.name.toLowerCase().includes(n)));
      
      const speakerVoiceMap = new Map<string, SpeechSynthesisVoice>();
      const usedVoices: SpeechSynthesisVoice[] = [];

      const findAndUseVoice = (preferredVoices: SpeechSynthesisVoice[], fallbackPool: SpeechSynthesisVoice[]) => {
        let voice = preferredVoices.find(v => !usedVoices.includes(v));
        if (!voice) {
          voice = fallbackPool.find(v => !usedVoices.includes(v));
        }
        if (voice) {
          usedVoices.push(voice);
        }
        return voice;
      };

      const sarahVoice = findAndUseVoice(femaleVoices, enVoices);
      const ihsanVoice = findAndUseVoice(maleVoices, enVoices);
      const imanVoice = findAndUseVoice(maleVoices, enVoices);
      
      speakerVoiceMap.set('Sarah', sarahVoice || enVoices[0]);
      speakerVoiceMap.set('Tuan Ihsan', ihsanVoice || enVoices[1] || enVoices[0]);
      speakerVoiceMap.set('Iman', imanVoice || enVoices[2] || enVoices[0]);

      const lines = MINUTE_TAKING_TRANSCRIPT.split('\n').filter(line => line.trim() !== '');

      utterancesQueue.current = lines.map(line => {
          const parts = line.split(': ');
          const speakerStr = parts[0];
          const canonicalSpeaker = getCanonicalSpeaker(speakerStr);
          const text = parts.slice(1).join(': ').replace(/"/g, '');
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = speakerVoiceMap.get(canonicalSpeaker) || null;
          utterance.lang = utterance.voice?.lang || 'en-US';
          utterance.rate = 0.95;
          return utterance;
      });
      
      setPlaybackState('playing');
      playNextUtterance();
    }
  };

  const handleStop = () => {
    const synth = synthRef.current;
    synth.cancel();
    utterancesQueue.current = [];
    setPlaybackState('idle');
  };

  const saveSession = async (isSubmitting: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const feedbackData = await getMinuteTakingFeedback(userMinutes);
      
      if (user && user.role === 'student') {
         const studentUser = user as Student;
         const newSessionId = `minute_${Date.now()}`;
         const newSession: MinuteTakingSession = {
             id: newSessionId,
             timestamp: Date.now(),
             studentUid: studentUser.uid,
             studentEmail: studentUser.email,
             lecturerEmail: studentUser.lecturerEmail,
             classCode: studentUser.classCode,
             userMinutes: userMinutes,
             feedbackData: feedbackData,
             isSubmitted: isSubmitting,
         };
         
         const allSessions: MinuteTakingSession[] = JSON.parse(localStorage.getItem('minuteTakingSessions') || '[]');
         allSessions.push(newSession);
         localStorage.setItem('minuteTakingSessions', JSON.stringify(allSessions));
         if (!isSubmitting) {
            setSessionId(newSessionId);
         }
      }

      if (isSubmitting) {
        alert("Your minutes have been successfully submitted to your lecturer.");
        onBack();
      } else {
        setFeedback(feedbackData);
        setView('FEEDBACK');
      }

    } catch (e) {
      setError('An error occurred. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForFeedback = () => {
    saveSession(false);
  };

  const handleSubmitToLecturer = () => {
    if (!userMinutes.trim() || !user || user.role !== 'student') {
        return;
    }
    if (window.confirm("Are you sure you want to submit this to your lecturer for assessment? You will not be able to view AI feedback or edit it later.")) {
        saveSession(true);
    }
  };

  const handlePracticeAgain = () => {
    setView('PRACTICE');
    setUserMinutes('');
    setFeedback(null);
    setError(null);
    setSessionId(null);
  };

  if (isLoading) {
    return <Loader message="Analyzing your minutes..." />;
  }

  if (view === 'FEEDBACK' && feedback) {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <MinuteFeedbackDisplay
                feedback={feedback}
                userMinutes={userMinutes}
                onPracticeAgain={handlePracticeAgain}
                onBack={onBack}
                title="Minute-Taking Feedback Report"
                sessionId={sessionId}
                isStudent={user?.role === 'student'}
            />
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-24">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Practice: Minute-Taking</h2>
        <p className="mt-2 text-lg text-slate-400">Listen to the meeting audio, then write the meeting minutes in your own words.</p>
      </div>
      
      <Card title="Listen to the Meeting">
        <div className="p-4 space-y-4">
            <p className="text-sm text-slate-400">Play the audio below to listen to the meeting recording. You can refer to the transcript if needed.</p>
            <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <button 
                  onClick={handlePlayPause}
                  className="p-3 rounded-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white disabled:bg-slate-600" 
                  aria-label={playbackState === 'playing' ? "Pause" : "Play"}
                  disabled={voices.length === 0}
                >
                    {playbackState === 'playing' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
                <button 
                  onClick={handleStop}
                  className="p-3 rounded-full bg-slate-600 hover:bg-slate-500 text-white" 
                  aria-label="Stop"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="text-sm text-slate-400 capitalize w-24">
                    {voices.length === 0 ? 'Loading...' : playbackState}
                </div>
            </div>
            <details className="text-sm">
                <summary className="cursor-pointer text-fuchsia-400 hover:underline">View Full Transcript</summary>
                <div className="mt-2 p-3 bg-slate-900/50 rounded-lg max-h-48 overflow-y-auto">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">
                        {MINUTE_TAKING_TRANSCRIPT}
                    </pre>
                </div>
            </details>
        </div>
      </Card>
      
      <Card title="Your Minutes">
          <div className="p-4">
              <textarea
                  value={userMinutes}
                  onChange={(e) => setUserMinutes(e.target.value)}
                  placeholder="Start writing your meeting minutes here. Focus on capturing decisions and action items..."
                  className="w-full h-64 p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition"
              />
          </div>
      </Card>
      
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
          {error && <p className="text-red-400 text-center text-sm mb-2">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-4">
              <button
                  onClick={handleSubmitForFeedback}
                  disabled={!userMinutes.trim()}
                  className="flex-1 bg-fuchsia-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-fuchsia-700 transition-colors focus:outline-none focus:ring-4 focus:ring-fuchsia-500/50 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                  Get AI Feedback
              </button>
              {user?.role === 'student' && (
                  <button
                    onClick={handleSubmitToLecturer}
                    disabled={!userMinutes.trim()}
                    className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Submit to Lecturer
                </button>
              )}
          </div>
      </div>

      <div className="text-center pt-4">
        <button onClick={onBack} className="text-sm text-fuchsia-400 hover:text-fuchsia-300 flex items-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Menu Selection
        </button>
      </div>
    </div>
  );
};

export default MinuteTakingPracticeScreen;