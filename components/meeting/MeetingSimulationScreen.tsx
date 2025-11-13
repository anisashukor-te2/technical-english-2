import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { MeetingScenario, Student, Lecturer, MeetingSession } from '../../types';
import { saveMeetingSession } from '../../services/firebaseService';
import MicrophoneHelpModal from '../common/MicrophoneHelpModal';

// Web Speech API types to prevent TypeScript errors
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}
declare var SpeechRecognition: { new (): SpeechRecognition };
declare var webkitSpeechRecognition: { new (): SpeechRecognition };
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof webkitSpeechRecognition;
  }
}

interface MeetingSimulationScreenProps {
  scenario: MeetingScenario;
  userRole: string;
  onEndSession: () => void;
  user: Student | Lecturer | null;
}
type ChatMessage = { speaker: 'You' | 'AI'; text: string; }

const MeetingSimulationScreen: React.FC<MeetingSimulationScreenProps> = ({ scenario, userRole, onEndSession, user }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUserTurn, setIsUserTurn] = useState(false); // Start with AI's turn
    
    const [isRecording, setIsRecording] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [micError, setMicError] = useState<string | null>(null);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef<string>('');
    
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const synthRef = useRef(window.speechSynthesis);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const sendMessageToAIRef = useRef(sendMessageToAI);

    useEffect(() => { sendMessageToAIRef.current = sendMessageToAI; });
    
    const speakText = useCallback((text: string) => {
        const synth = synthRef.current;
        if (!synth) {
            setIsUserTurn(true);
            return;
        }
        if (synth.speaking) synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.onstart = () => setIsAISpeaking(true);
        utterance.onend = () => { setIsAISpeaking(false); setIsUserTurn(true); };
        utterance.onerror = () => { setIsAISpeaking(false); setIsUserTurn(true); };
        synth.speak(utterance);
    }, []);
    
    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const aiRoles = scenario.roles.filter(role => role !== userRole);

            const systemInstruction = `You are an AI role-playing assistant simulating multiple participants in a professional meeting.
The meeting is a "${scenario.title}".
Scenario Description: "${scenario.description}".

The user is playing the role of the "${userRole}".

You must realistically role-play ALL of the following participants: ${aiRoles.join(', ')}.
When you respond, you MUST speak as one or more of these participants.
Prefix each part of your response with the role you are playing, like "[Role Name]:". For example: "[Lead Engineer]: I have some initial thoughts on the materials."
Your goal is to contribute to the meeting's objectives from the perspective of your assigned roles. Be collaborative, but also raise realistic questions or concerns relevant to each role.
Keep your responses concise and conversational.
Do not act as a generic assistant. Only speak as the characters you are assigned.
Start the conversation with a brief opening statement to set the scene and prompt the user to begin. For example: "Okay everyone, thanks for joining. The floor is yours, ${userRole}."`;

            const chatSession = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
            setChat(chatSession);

            setIsLoading(true);
            chatSession.sendMessage({ message: "Please begin the conversation now." }).then(response => {
                const initialText = response.text;
                const aiMessage: ChatMessage = { speaker: 'AI', text: initialText };
                setMessages([aiMessage]);
                speakText(initialText);
            }).catch(e => {
                console.error(e);
                setError("Failed to start the simulation.");
            }).finally(() => setIsLoading(false));

        } catch (e) {
            console.error("Failed to initialize chat:", e);
            setError("Could not start the chat session.");
        }
    }, [scenario, userRole, speakText]);

    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setMicError("Speech recognition is not supported in your browser.");
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interim = '', final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
                else interim += event.results[i][0].transcript;
            }
            finalTranscriptRef.current += final;
            setCurrentTranscript(finalTranscriptRef.current + interim);
        };
        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                setMicError("Microphone access was denied. Click the mic icon for help.");
            } else if (event.error !== 'aborted') {
                setMicError(`Microphone error: ${event.error}. Click the mic icon for help.`);
            }
            setIsRecording(false);
        };
        recognition.onend = () => {
            setIsRecording(false);
            const final = finalTranscriptRef.current.trim();
            if (final) sendMessageToAIRef.current(final);
        };
        recognitionRef.current = recognition;

        return () => {
            recognitionRef.current?.stop();
            synthRef.current?.cancel();
        };
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    async function sendMessageToAI(messageText: string) {
        if (!messageText.trim() || isLoading || !chat || !isUserTurn) return;

        setIsUserTurn(false);
        const userMessage: ChatMessage = { speaker: 'You', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const response = await chat.sendMessage({ message: messageText });
            const aiMessage: ChatMessage = { speaker: 'AI', text: response.text };
            setMessages(prev => [...prev, aiMessage]);
            speakText(response.text);
        } catch (e) {
            console.error("Error sending message:", e);
            setError("Sorry, I couldn't get a response.");
            setMessages(prev => prev.slice(0, -1));
            setIsUserTurn(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEndSessionAndSave = async () => {
        if (user?.role === 'student') {
            const studentUser = user as Student;
            const newSessionData: Omit<MeetingSession, 'id'> = {
                timestamp: Date.now(),
                studentUid: studentUser.uid,
                studentEmail: studentUser.email,
                lecturerEmail: studentUser.lecturerEmail,
                classCode: studentUser.classCode,
                scenarioTitle: scenario.title,
                userRole: userRole,
                messages: messages,
            };

            try {
                await saveMeetingSession(newSessionData);
            } catch (e) {
                console.error("Failed to save meeting session:", e);
            }
        }
        onEndSession();
    };
    
    const handleMicClick = () => {
        if (micError) {
            setIsHelpModalOpen(true);
            return;
        }
        
        const recognition = recognitionRef.current;
        if (!recognition) return;
        
        if (isRecording) {
            recognition.stop();
        } else {
            setCurrentTranscript('');
            finalTranscriptRef.current = '';
            recognition.start();
            setIsRecording(true);
        }
    };
    
    const getPlaceholderText = () => {
        if (micError) return <span className="text-yellow-400 text-sm">{micError}</span>;
        if (isRecording) return currentTranscript || <span className="italic text-slate-400">Listening...</span>;
        if (isAISpeaking) return <span className="italic text-slate-400">AI is speaking...</span>;
        if (isLoading) return <span className="italic text-slate-400">AI is thinking...</span>;
        return <span className="italic text-slate-400">Press the mic to speak...</span>;
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-200px)] animate-fade-in">
            <MicrophoneHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            
            <div className="bg-slate-800/60 border border-slate-700 rounded-t-lg p-4 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-cyan-400">{scenario.title}</h2>
                    <p className="text-sm text-slate-300">Your Role: <span className="font-semibold text-white">{userRole}</span></p>
                </div>
                 <button onClick={handleEndSessionAndSave} className="text-sm text-cyan-400 hover:text-cyan-300 inline-flex items-center p-2 bg-slate-700 rounded-lg hover:bg-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    End & Save Session
                </button>
            </div>
            
            <div ref={chatContainerRef} className="flex-grow bg-slate-900 p-4 overflow-y-auto border-x border-slate-700">
                 <div className="space-y-4">
                    {messages.map((item, index) => (
                        <div key={index} className={`flex items-end gap-2 ${item.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`p-3 rounded-lg max-w-lg ${item.speaker === 'You' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                {item.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length-1]?.speaker === 'You' && (
                         <div className="flex items-end gap-2 justify-start">
                             <div className="max-w-lg p-3 rounded-lg bg-slate-700">
                                 <div className="flex items-center space-x-2">
                                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></div>
                                 </div>
                             </div>
                         </div>
                    )}
                </div>
            </div>
            
             <div className="bg-slate-800/60 border border-t-0 border-slate-700 rounded-b-lg p-4 shadow-sm">
                {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
                <div className="flex items-center space-x-4">
                    <div className={`flex-grow bg-slate-900 border rounded-lg p-3 h-14 flex items-center overflow-y-auto ${isRecording ? 'border-cyan-500' : 'border-slate-600'}`}>
                       <p className="text-slate-300 w-full">{getPlaceholderText()}</p>
                    </div>
                    <button 
                        onClick={handleMicClick} 
                        disabled={isLoading || isAISpeaking || !isUserTurn}
                        className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white ${isRecording ? 'bg-red-500' : isUserTurn ? 'bg-cyan-600' : 'bg-slate-600'} disabled:opacity-70`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MeetingSimulationScreen;