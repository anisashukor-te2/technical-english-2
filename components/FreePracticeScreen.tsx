
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Slide } from '../types';
import { usePresentation } from '../contexts/PresentationContext';
import MicrophoneHelpModal from './common/MicrophoneHelpModal';

interface FreePracticeScreenProps {
    userType: 'student' | 'lecturer';
}

const FreePracticeScreen: React.FC<FreePracticeScreenProps> = ({ userType }) => {
    const { handleRecordingComplete, error, handleBackToSelection } = usePresentation();
    const [slides, setSlides] = useState<Slide[]>([
        { id: Date.now(), title: 'Slide 1: Title', script: 'Enter your speaker notes here...', transition: 'none' }
    ]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [mode, setMode] = useState<'EDITING' | 'PRESENTING'>('EDITING');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingData, setRecordingData] = useState<{ blob: Blob; duration: number } | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [micError, setMicError] = useState<string | null>(null);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [timer, setTimer] = useState(0);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const recordingCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    
    const slidesRef = useRef(slides);
    const currentSlideIndexRef = useRef(currentSlideIndex);
    const drawCallbackRef = useRef<(() => void) | undefined>(undefined);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const mediaPlaybackRef = useRef<HTMLVideoElement>(null);
    const imagePlaybackRef = useRef<HTMLImageElement>(null);
    const webcamVideoRef = useRef<HTMLVideoElement>(null);
    const combinedStreamRef = useRef<MediaStream | null>(null);

    const safeCurrentSlideIndex = Math.max(0, Math.min(currentSlideIndex, slides.length - 1));
    const currentSlide = slides.length > 0 ? slides[safeCurrentSlideIndex] : null;

    useEffect(() => { slidesRef.current = slides; }, [slides]);
    useEffect(() => { currentSlideIndexRef.current = currentSlideIndex; }, [currentSlideIndex]);

    const addSlide = () => {
        const newSlideIndex = slides.length;
        setSlides(prev => [...prev, { id: Date.now() + Math.random(), title: `Slide ${newSlideIndex + 1}`, script: '', transition: 'none' }]);
        setCurrentSlideIndex(newSlideIndex);
    };

    const updateSlide = <K extends keyof Slide>(index: number, field: K, value: Slide[K]) => {
        setSlides(prevSlides =>
            prevSlides.map((slide, i) => {
                if (i === index) {
                    return { ...slide, [field]: value };
                }
                return slide;
            })
        );
    };
    
    const deleteCurrentSlide = () => {
        if (slides.length <= 1) return;
        setSlides(prev => prev.filter((_, i) => i !== currentSlideIndex));
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updateSlide(safeCurrentSlideIndex, 'media', {
                    url: event.target?.result as string,
                    type: 'image'
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            updateSlide(safeCurrentSlideIndex, 'media', {
                url: url,
                type: 'video'
            });
        }
    };
    
    const handleRemoveMedia = (index: number) => {
        setSlides(prevSlides =>
            prevSlides.map((slide, i) => {
                if (i === index) {
                    const { media, ...rest } = slide;
                    if(media?.type === 'video' && media.url.startsWith('blob:')) {
                         URL.revokeObjectURL(media.url);
                    }
                    return rest;
                }
                return slide;
            })
        );
    };
    
    const drawSlideToCanvas = useCallback(() => {
        const canvas = recordingCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Dark slide background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const slide = slidesRef.current[currentSlideIndexRef.current];

        // Draw slide media (image or video)
        if (slide?.media) {
            const mediaEl = slide.media.type === 'image' 
                ? imagePlaybackRef.current 
                : mediaPlaybackRef.current;

            if (mediaEl && (mediaEl.src === slide.media.url)) {
                const mediaWidth = slide.media.type === 'image' ? (mediaEl as HTMLImageElement).naturalWidth : (mediaEl as HTMLVideoElement).videoWidth;
                const mediaHeight = slide.media.type === 'image' ? (mediaEl as HTMLImageElement).naturalHeight : (mediaEl as HTMLVideoElement).videoHeight;

                if (mediaWidth > 0 && mediaHeight > 0) {
                    const canvasAspectRatio = canvas.width / canvas.height;
                    const mediaAspectRatio = mediaWidth / mediaHeight;
                    let drawWidth, drawHeight, drawX, drawY;

                    if (canvasAspectRatio > mediaAspectRatio) {
                        drawHeight = canvas.height;
                        drawWidth = drawHeight * mediaAspectRatio;
                    } else {
                        drawWidth = canvas.width;
                        drawHeight = drawWidth / mediaAspectRatio;
                    }
                    
                    drawX = (canvas.width - drawWidth) / 2;
                    drawY = (canvas.height - drawHeight) / 2;

                    ctx.drawImage(mediaEl, drawX, drawY, drawWidth, drawHeight);
                }
            }
        }

        // Draw slide title over the media
        if (slide?.title) {
            ctx.textAlign = 'center';
            ctx.font = 'bold 48px sans-serif';
            // Add a semi-transparent background for readability
            const textMetrics = ctx.measureText(slide.title);
            const textHeight = 48; // Approximation
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 80 - textHeight, canvas.width, textHeight + 20);

            ctx.fillStyle = '#f1f5f9'; // Light text color
            ctx.fillText(slide.title, canvas.width / 2, 80, canvas.width * 0.9);
        }

        const webcamEl = webcamVideoRef.current;
        if (webcamEl && webcamEl.videoWidth > 0 && webcamEl.readyState >= 2) {
            const camWidth = 240;
            const camHeight = 180;
            const camX = canvas.width - camWidth - 20;
            const camY = canvas.height - camHeight - 20;
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(camX - 2, camY - 2, camWidth + 4, camHeight + 4);
            ctx.drawImage(webcamEl, camX, camY, camWidth, camHeight);
        }

    }, []);

    useEffect(() => {
        drawCallbackRef.current = drawSlideToCanvas;
    }, [drawSlideToCanvas]);
    
     useEffect(() => {
        if (mode === 'PRESENTING') {
            drawSlideToCanvas();
        }
    }, [mode, safeCurrentSlideIndex, slides, drawSlideToCanvas]);

     useEffect(() => {
        const slide = slides[safeCurrentSlideIndex];
        const imageEl = imagePlaybackRef.current;
        const videoEl = mediaPlaybackRef.current;

        if (!slide?.media || !imageEl || !videoEl) {
            if (imageEl) imageEl.src = '';
            if (videoEl) videoEl.src = '';
            return;
        }

        if (slide.media.type === 'image') {
            if (videoEl.src) videoEl.src = '';
            videoEl.pause();
            if (imageEl.src !== slide.media.url) {
                imageEl.src = slide.media.url;
                imageEl.onload = () => { if (mode === 'PRESENTING') drawSlideToCanvas(); };
            }
        } else { // video
            if (imageEl.src) imageEl.src = '';
            if (videoEl.src !== slide.media.url) {
                videoEl.src = slide.media.url;
                videoEl.onloadeddata = () => {
                    videoEl.play();
                    if (mode === 'PRESENTING') drawSlideToCanvas();
                };
            } else {
                videoEl.play();
            }
        }
    }, [safeCurrentSlideIndex, slides, mode, drawSlideToCanvas]);
    
    const startRecording = useCallback(async () => {
        setMicError(null);
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
             setMicError("Your browser does not support the required recording APIs.");
             return;
        }

        try {
            const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            if (webcamVideoRef.current) {
                webcamVideoRef.current.srcObject = userMediaStream;
                webcamVideoRef.current.play();
            }

            const canvas = recordingCanvasRef.current;
            if (!canvas) throw new Error("Canvas not found");
            const canvasStream = canvas.captureStream(25);
            
            const audioTracks = userMediaStream.getAudioTracks();
            if (audioTracks.length > 0) {
                canvasStream.addTrack(audioTracks[0]);
            } else {
                userMediaStream.getTracks().forEach(track => track.stop());
                throw new Error("No audio track found.");
            }
            
            combinedStreamRef.current = userMediaStream;
            const mimeType = 'video/webm';
            const mediaRecorder = new MediaRecorder(canvasStream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorder.onstop = () => {
                const recordingBlob = new Blob(audioChunksRef.current, { type: mimeType });
                setRecordingData({ blob: recordingBlob, duration: (Date.now() - startTimeRef.current) / 1000 });
                setPreviewUrl(URL.createObjectURL(recordingBlob));
                combinedStreamRef.current?.getTracks().forEach(track => track.stop());
                canvasStream.getTracks().forEach(track => track.stop());
            };

            const drawLoop = () => {
                drawCallbackRef.current?.();
                animationFrameId.current = requestAnimationFrame(drawLoop);
            };
            drawLoop();

            mediaRecorder.start();
            setIsRecording(true);
            startTimeRef.current = Date.now();
            timerIntervalRef.current = window.setInterval(() => {
                setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

        } catch (err) {
            setMicError("Microphone or Camera access was denied.");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    }, []);

    const handleReview = () => {
        if (recordingData) {
            const fullScript = slides.map(s => `Slide: ${s.title}\n${s.script}`).join('\n\n');
            handleRecordingComplete(recordingData.blob, recordingData.duration, fullScript, slides, false);
        }
    };

    const handleRecordAgain = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
        setRecordingData(null);
        setTimer(0);
        audioChunksRef.current = [];
    };
    
    const formatTime = (seconds: number) => {
        const totalSeconds = Math.round(seconds);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const renderEditingView = () => (
         <>
            <div className="bg-slate-800/60 p-6 rounded-lg border border-slate-700 mb-6 shadow-lg">
                <h2 className="text-xl font-bold text-cyan-600 mb-3">Practice</h2>
                <p className="text-slate-300">Build your presentation below. When ready, press "Start Presenting" to practice.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800/60 p-6 rounded-lg border border-slate-700 flex flex-col gap-4 shadow-lg">
                    <input type="text" value={currentSlide?.title || ''} onChange={(e) => updateSlide(safeCurrentSlideIndex, 'title', e.target.value)} className="w-full bg-slate-900 text-xl text-slate-200 font-bold p-3 rounded-lg border border-slate-600 focus:ring-2 focus:ring-cyan-700"/>
                    <textarea value={currentSlide?.script || ''} onChange={(e) => updateSlide(safeCurrentSlideIndex, 'script', e.target.value)} placeholder="Enter your speaker notes here..." className="w-full flex-grow p-3 bg-slate-900 text-slate-200 border border-slate-600 rounded-lg h-72 focus:ring-2 focus:ring-cyan-700"></textarea>
                    
                    <div className="mt-2">
                        <h4 className="text-sm font-semibold text-slate-400 mb-2 border-t border-slate-700 pt-4">Slide Media</h4>
                        {currentSlide?.media ? (
                            <div className="relative group bg-slate-900 rounded-lg p-2">
                                {currentSlide.media.type === 'image' ? (
                                    <img src={currentSlide.media.url} alt="Slide preview" className="w-full h-auto max-h-40 object-contain rounded-md" />
                                ) : (
                                    <video src={currentSlide.media.url} className="w-full h-auto max-h-40 object-contain rounded-md" controls />
                                )}
                                <button
                                    onClick={() => handleRemoveMedia(safeCurrentSlideIndex)}
                                    className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                    aria-label="Remove media"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => imageInputRef.current?.click()} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                    <span>Add Image</span>
                                </button>
                                <button onClick={() => videoInputRef.current?.click()} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
                                    </svg>
                                    <span>Add Video</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-lg">
                        <h3 className="text-lg font-bold text-cyan-600 mb-3">Slides</h3>
                        <ul className="space-y-2 h-64 overflow-y-auto pr-2">
                            {slides.map((slide, index) => (
                                <li key={slide.id} onClick={() => setCurrentSlideIndex(index)} className={`flex items-center p-2 rounded-lg cursor-pointer border-2 ${safeCurrentSlideIndex === index ? 'border-cyan-700 bg-cyan-950/20' : 'border-transparent hover:bg-slate-700'}`}>
                                    <span className="text-sm font-semibold text-slate-300">Slide {index + 1}: {slide.title}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button onClick={addSlide} className="w-full bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold py-2 px-4 rounded-lg text-sm">+ Add Slide</button>
                            <button onClick={deleteCurrentSlide} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Delete Slide</button>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-slate-800/60 p-6 rounded-lg border border-slate-700 text-center shadow-lg">
                         <button onClick={() => setMode('PRESENTING')} className="w-full bg-cyan-800 hover:bg-cyan-900 text-white font-bold py-3 px-4 rounded-lg">Start Presenting</button>
                         <button onClick={handleBackToSelection} className="text-sm text-cyan-600 hover:text-cyan-500 mt-4">Back to Menu</button>
                    </div>
                </div>
            </div>
         </>
    );
    
    const renderPresentingView = () => (
        <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)]">
                <div className="lg:col-span-2 relative bg-slate-900 rounded-lg border border-slate-700 shadow-lg flex items-center justify-center">
                    {previewUrl ? (
                        <video src={previewUrl} controls className="w-full h-full object-contain rounded-lg" />
                    ) : (
                        <canvas ref={recordingCanvasRef} width="1280" height="720" className="w-full h-full object-contain rounded-lg" />
                    )}
                    <video ref={webcamVideoRef} autoPlay playsInline muted className="hidden" />
                    <img ref={imagePlaybackRef} className="hidden" alt="Playback for canvas"/>
                    <video ref={mediaPlaybackRef} className="hidden" muted loop playsInline />
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-lg flex-grow overflow-y-auto">
                        <h3 className="text-lg font-bold text-cyan-600 mb-2">
                            Slide {safeCurrentSlideIndex + 1}: {currentSlide?.title}
                        </h3>
                        <p className="text-slate-300 whitespace-pre-wrap">{currentSlide?.script || 'No script for this slide.'}</p>
                    </div>
                    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 shadow-lg text-center h-48 flex flex-col justify-center">
                        {micError ? (
                            <div className="text-center p-2">
                                <h3 className="font-semibold text-red-400">Mic/Camera Error</h3>
                                <p className="text-sm text-slate-400">{micError}</p>
                                <button onClick={() => setIsHelpModalOpen(true)} className="mt-2 text-sm text-cyan-600">Show Help</button>
                            </div>
                        ) : recordingData ? (
                            <div className="space-y-3 flex flex-col items-center justify-center h-full text-center">
                                <h3 className="font-semibold text-slate-200 text-lg">Recording Complete!</h3>
                                <p className="font-mono text-3xl text-cyan-600 my-2">{formatTime(recordingData.duration)}</p>
                                <div className="w-full max-w-xs flex flex-col gap-2 mt-2">
                                    <button onClick={handleReview} className="w-full bg-cyan-800 hover:bg-cyan-900 text-white font-bold py-3 px-4 rounded-lg">
                                        Analyze Performance
                                    </button>
                                    <button onClick={handleRecordAgain} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-3 rounded-lg text-sm">
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <p className={`font-mono text-3xl mb-4 ${isRecording ? 'text-red-400' : 'text-slate-200'}`}>{formatTime(timer)}</p>
                                <button onClick={isRecording ? stopRecording : startRecording} className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${isRecording ? 'bg-red-600' : 'bg-cyan-800'}`}>
                                    {isRecording ? <div className="w-6 h-6 bg-white rounded-sm"></div> :  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                                </button>
                                <p className="text-sm text-slate-400 mt-2">{isRecording ? 'Recording...' : 'Start Recording'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
                <button onClick={() => setMode('EDITING')} className="text-sm text-cyan-600 hover:text-cyan-500">← Back to Editor</button>
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentSlideIndex(i => Math.max(0, i-1))} disabled={safeCurrentSlideIndex === 0} className="bg-slate-700 p-2 rounded-lg disabled:opacity-50 text-white">Prev</button>
                    <span className="text-slate-300 font-mono">{safeCurrentSlideIndex + 1} / {slides.length}</span>
                    <button onClick={() => setCurrentSlideIndex(i => Math.min(slides.length - 1, i+1))} disabled={safeCurrentSlideIndex === slides.length - 1} className="bg-slate-700 p-2 rounded-lg disabled:opacity-50 text-white">Next</button>
                </div>
            </div>
        </div>
    );
    
    return (
        <div className="max-w-7xl mx-auto">
            <MicrophoneHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageFileChange} className="hidden" />
            <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoFileChange} className="hidden" />
            {mode === 'EDITING' ? renderEditingView() : renderPresentingView()}
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
    );
};

export default FreePracticeScreen;