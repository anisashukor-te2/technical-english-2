import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePresentation } from '../contexts/PresentationContext';
import MicrophoneHelpModal from './common/MicrophoneHelpModal';
import Card from './Card';

const Scenario: React.FC = () => (
    <Card title="Module 1: Guided Practice" color="blue">
        <div className="p-4">
            <p className="text-slate-600 mb-4">
                <span className="font-semibold text-slate-700">Scenario:</span> You are presenting the step-by-step process of designing a robust bolted joint for a structural application to a team of junior engineers. Focus on clarity, logical flow, and using appropriate technical language.
            </p>
            <p className="text-sm text-slate-500">
                Read through the script below, then press "Start Recording" when you are ready to begin your practice presentation.
            </p>
        </div>
    </Card>
);

const Script: React.FC = () => (
    <Card title="Starter Script" color="green">
        <div className="p-4 h-96 overflow-y-auto">
            <div className="space-y-4 text-slate-700">
                <details className="cursor-pointer">
                    <summary className="font-semibold text-green-700">Slide 1: Title Slide & Opening</summary>
                    <p className="mt-2 pl-4 border-l-2 border-slate-200 text-sm">"Good morning, everyone. Today, I'll be walking you through the critical steps involved in designing a robust bolted joint assembly..."</p>
                </details>
                <details className="cursor-pointer">
                    <summary className="font-semibold text-green-700">Slide 2: Introduction</summary>
                    <p className="mt-2 pl-4 border-l-2 border-slate-200 text-sm">"Firstly, let's understand why bolted joints are so prevalent. They offer versatility, ease of assembly and disassembly, and adjustability..."</p>
                </details>
                <details className="cursor-pointer">
                    <summary className="font-semibold text-green-700">Slide 3: Step 1 - Define Requirements</summary>
                    <p className="mt-2 pl-4 border-l-2 border-slate-200 text-sm">"The initial phase involves thoroughly defining the design requirements. We must identify the magnitude and type of applied loads..."</p>
                </details>
                <details className="cursor-pointer">
                    <summary className="font-semibold text-green-700">Slide 4: Step 2 - Select Bolt</summary>
                    <p className="mt-2 pl-4 border-l-2 border-slate-200 text-sm">"Following the requirements, the next step is to select the appropriate bolt material and size. High-strength steel bolts are commonly used..."</p>
                </details>
                 <details className="cursor-pointer">
                    <summary className="font-semibold text-green-700">Slide 5: Step 3 - Determine Geometry</summary>
                    <p className="mt-2 pl-4 border-l-2 border-slate-200 text-sm">"With the bolt chosen, we proceed to determine the optimal joint geometry and configuration. This includes specifying the pitch..."</p>
                </details>
                 <details className="cursor-pointer">
                    <summary className="font-semibold text-green-700">Slide 6: Step 4 - Stress Analysis</summary>
                    <p className="mt-2 pl-4 border-l-2 border-slate-200 text-sm">"The fourth step involves a comprehensive stress analysis. Bearing stress is calculated at the bolt holes, and tensile stress is checked..."</p>
                </details>
                 <details className="cursor-pointer">
                    <summary className="font-semibold text-green-700">Slide 7: Step 5 - Preload and Torque</summary>
                    <p className="mt-2 pl-4 border-l-2 border-slate-200 text-sm">"Crucially, for many applications, the bolts must be preloaded to a specific tension. This preload enhances the joint's resistance to slipping..."</p>
                </details>
                 <details className="cursor-pointer">
                    <summary className="font-semibold text-green-700">Slide 8: Conclusion</summary>
                    <p className="mt-2 pl-4 border-l-2 border-slate-200 text-sm">"In summary, designing a bolted joint is a systematic process... Are there any questions?"</p>
                </details>
            </div>
        </div>
    </Card>
);


const PracticeScreen: React.FC = () => {
    const { handleRecordingComplete, error, handleBackToSelection } = usePresentation();
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'finished'>('idle');
    const [audioData, setAudioData] = useState<{ blob: Blob; duration: number } | null>(null);
    const [micError, setMicError] = useState<string | null>(null);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [timer, setTimer] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);


    const startRecording = useCallback(async () => {
        setMicError(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const duration = (Date.now() - startTimeRef.current) / 1000;
                    setAudioData({ blob: audioBlob, duration });
                    setRecordingStatus('finished');
                    stream.getTracks().forEach(track => track.stop());
                     if (timerIntervalRef.current) {
                        clearInterval(timerIntervalRef.current);
                    }
                };
                
                mediaRecorder.start();
                setRecordingStatus('recording');
                startTimeRef.current = Date.now();
                timerIntervalRef.current = window.setInterval(() => {
                    setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
                }, 1000);

            } catch (err) {
                console.error("Error accessing microphone:", err);
                setMicError("Microphone access was denied. Please allow it in your browser settings (often via a lock icon in the address bar).");
            }
        } else {
            setMicError("Your browser does not support audio recording.");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    }, []);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
                 mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCheckScore = () => {
        if (audioData) {
            handleRecordingComplete(audioData.blob, audioData.duration);
        }
    };

    const handleRecordAgain = () => {
        setRecordingStatus('idle');
        setAudioData(null);
        setTimer(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const renderControls = () => {
        if (recordingStatus === 'finished') {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full text-center animate-fade-in">
                    <p className="text-lg text-slate-600">Recording Complete!</p>
                    <p className="text-5xl font-mono font-bold text-blue-600 my-4">
                        {formatTime(audioData?.duration || 0)}
                    </p>
                    <div className="flex w-full max-w-xs gap-4 mt-4">
                        <button
                            onClick={handleRecordAgain}
                            className="flex-1 bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            Try Again
                        </button>
                        <button
                            onClick={handleCheckScore}
                            className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/50 flex items-center justify-center gap-2"
                        >
                            Analyze
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            );
        }

        const isRecording = recordingStatus === 'recording';
        const timerColor = isRecording ? 'text-red-500 animate-pulse' : 'text-blue-600';

        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-center">
                <p className={`text-5xl font-mono font-bold mb-6 transition-colors ${timerColor}`}>
                    {formatTime(timer)}
                </p>
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    className={`relative flex items-center justify-center w-20 h-20 rounded-full text-white shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 ${
                        isRecording ? 'bg-red-700 focus:ring-red-500/50' : 'bg-red-600 focus:ring-red-500/50'
                    }`}
                >
                    {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-pulse"></div>}
                    {isRecording ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                            <path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 9v1a4 4 0 004 4h.01a4 4 0 004-4V9a.5.5 0 011 0v1a5 5 0 01-4.5 4.975V17h3a.5.5 0 010 1h-7a.5.5 0 010-1h3v-2.025A5 5 0 015 10V9a.5.5 0 01.5-.5z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
                <p className="mt-4 text-sm text-slate-500">{isRecording ? 'Recording...' : 'Tap to start'}</p>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Scenario />
            <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Script />
                <Card title="Recording Controls" color="purple">
                    <div className="p-6 h-96 flex flex-col items-center justify-center">
                        {micError ? (
                            <>
                                <div className="text-center p-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3zM3 3l18 18" />
                                    </svg>
                                    <h3 className="mt-2 text-lg font-semibold text-red-600">Microphone Error</h3>
                                    <p className="mt-2 text-sm text-slate-500">{micError}</p>
                                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                        <button onClick={() => setIsHelpModalOpen(true)} className="w-full bg-slate-200 text-slate-800 font-bold py-2 px-5 rounded-lg hover:bg-slate-300 transition-colors">
                                            Show Help
                                        </button>
                                        <button onClick={() => setMicError(null)} className="w-full bg-blue-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors">
                                            Retry
                                        </button>
                                    </div>
                                </div>
                                <MicrophoneHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
                            </>
                        ) : (
                            renderControls()
                        )}
                    </div>
                </Card>
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            <div className="text-center mt-8">
                <button onClick={handleBackToSelection} className="text-sm text-blue-600 hover:text-blue-700 flex items-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back to Menu Selection
                </button>
            </div>
        </div>
    );
};

export default PracticeScreen;