import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Slide } from '../types';
import { usePresentation } from '../contexts/PresentationContext';
import MicrophoneHelpModal from './common/MicrophoneHelpModal';

const FreePracticeScreen: React.FC = () => {
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
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
    const [mediaUploadState, setMediaUploadState] = useState<{ status: 'idle' | 'processing' | 'error', message: string | null }>({ status: 'idle', message: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recordingCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const initialLoadRef = useRef(true);
    const drawCallbackRef = useRef<(() => void) | undefined>(undefined);
    const mediaPlaybackRef = useRef<HTMLVideoElement>(null);
    const imagePlaybackRef = useRef<HTMLImageElement>(null);
    const webcamVideoRef = useRef<HTMLVideoElement>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    
    const dragItemIndex = useRef<number | null>(null);
    const dragOverItemIndex = useRef<number | null>(null);

    const slidesRef = useRef(slides);
    const currentSlideIndexRef = useRef(currentSlideIndex);

    // This makes accessing the current slide safe, even during re-renders when the index might be temporarily out of sync.
    const safeCurrentSlideIndex = Math.max(0, Math.min(currentSlideIndex, slides.length - 1));
    const currentSlide = slides.length > 0 ? slides[safeCurrentSlideIndex] : null;

    useEffect(() => { slidesRef.current = slides; }, [slides]);
    useEffect(() => { currentSlideIndexRef.current = currentSlideIndex; }, [currentSlideIndex]);

    useEffect(() => {
        try {
            const savedSlidesRaw = localStorage.getItem('freePracticePresentation');
            if (savedSlidesRaw) {
                const savedSlides = JSON.parse(savedSlidesRaw);
                if (Array.isArray(savedSlides) && savedSlides.length > 0) {
                    setSlides(savedSlides);
                }
            }
        } catch (e) {
            console.error("Failed to load saved presentation", e);
        }
    }, []);


    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
        }

        setSaveStatus('saving');
        const handler = setTimeout(() => {
            try {
                const slidesToSave = slides.map(slide => {
                    const slideCopy = { ...slide };
                    if (slideCopy.media?.type === 'video') {
                        // Don't save video media, as blob URLs are not persistent
                        delete slideCopy.media;
                    }
                    return slideCopy;
                });
                localStorage.setItem('freePracticePresentation', JSON.stringify(slidesToSave));
                setSaveStatus('saved');
                const idleTimeout = setTimeout(() => setSaveStatus('idle'), 2000);
                return () => clearTimeout(idleTimeout);
            } catch (e) {
                console.error("Failed to auto-save presentation", e);
                 alert("Auto-save failed. Your presentation might be too large to save in the browser.");
            }
        }, 1500);

        return () => {
            clearTimeout(handler);
        };
    }, [slides]);

    const addSlide = () => {
        const newSlideIndex = slides.length;
        setSlides(prev => [...prev, { id: Date.now() + Math.random(), title: `Slide ${newSlideIndex + 1}`, script: '', transition: 'none' }]);
        setCurrentSlideIndex(newSlideIndex);
    };

    const updateSlide = <K extends 'title' | 'script' | 'transition'>(index: number, field: K, value: Slide[K]) => {
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
        if (slides.length <= 1) {
            alert("You cannot delete the last slide.");
            return;
        }

        const indexToDelete = safeCurrentSlideIndex;
        const slideToDelete = slides[indexToDelete];
        if (!slideToDelete) return;

        const slideTitle = slideToDelete.title || `Slide ${indexToDelete + 1}`;

        if (window.confirm(`Are you sure you want to delete "${slideTitle}"? This action cannot be undone.`)) {
            // Revoke blob URL if the deleted slide has one to prevent memory leaks
            if (slideToDelete.media?.type === 'video' && slideToDelete.media.url.startsWith('blob:')) {
                URL.revokeObjectURL(slideToDelete.media.url);
            }

            const newSlides = slides.filter((_, index) => index !== indexToDelete);
            
            // Determine the new current slide index, ensuring it's within bounds
            const newIndex = Math.min(currentSlideIndex, newSlides.length - 1);

            setSlides(newSlides);
            setCurrentSlideIndex(Math.max(0, newIndex)); // Ensure index is non-negative
        }
    };

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, slideIndex: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setMediaUploadState({ status: 'idle', message: null });
        const MAX_IMAGE_SIZE_MB = 5;
        const MAX_VIDEO_SIZE_MB = 200;

        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

        if (!fileType) {
            setMediaUploadState({ status: 'error', message: 'Unsupported file. Please upload an image or video.' });
            return;
        }

        if (fileType === 'image' && file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
             setMediaUploadState({ status: 'error', message: `Image is too large. Please upload an image under ${MAX_IMAGE_SIZE_MB}MB.` });
             return;
        }
        
        if (fileType === 'video' && file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            setMediaUploadState({ status: 'error', message: `Video is too large. Please upload a video under ${MAX_VIDEO_SIZE_MB}MB.` });
            return;
        }

        setMediaUploadState({ status: 'processing', message: 'Processing media...' });
        
        const updateSlideMedia = (url: string, type: 'image' | 'video') => {
            setSlides(prevSlides => {
                return prevSlides.map((slide, i) => {
                    if (i === slideIndex) {
                        // Revoke old blob url if it exists to prevent memory leaks
                        if (slide.media?.type === 'video' && slide.media.url.startsWith('blob:')) {
                            URL.revokeObjectURL(slide.media.url);
                        }
                        return { ...slide, media: { url, type } };
                    }
                    return slide;
                });
            });
            setMediaUploadState({ status: 'idle', message: null });
        };
        
        if (fileType === 'video') {
            const videoUrl = URL.createObjectURL(file);
            updateSlideMedia(videoUrl, 'video');
        } else { // image
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    updateSlideMedia(event.target.result as string, 'image');
                } else {
                    setMediaUploadState({ status: 'error', message: 'Could not read the image file.' });
                }
            };
            reader.onerror = () => setMediaUploadState({ status: 'error', message: 'Error reading file.' });
            reader.readAsDataURL(file);
        }
    };

    const triggerMediaUpload = () => {
        fileInputRef.current?.click();
    };

    const removeMedia = (slideIndex: number) => {
        setSlides(prevSlides => {
            return prevSlides.map((slide, i) => {
                if (i === slideIndex) {
                    const { media, ...rest } = slide;
                    if (media?.type === 'video' && media.url.startsWith('blob:')) {
                        URL.revokeObjectURL(media.url);
                    }
                    return rest;
                }
                return slide;
            });
        });
        setMediaUploadState({ status: 'idle', message: null });
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        dragItemIndex.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        dragOverItemIndex.current = index;
    };

    const handleDrop = () => {
        if (dragItemIndex.current === null || dragOverItemIndex.current === null || dragItemIndex.current === dragOverItemIndex.current) {
            return;
        }
        const newSlides = [...slides];
        const draggedItemContent = newSlides.splice(dragItemIndex.current, 1)[0];
        newSlides.splice(dragOverItemIndex.current, 0, draggedItemContent);
        dragItemIndex.current = null;
        dragOverItemIndex.current = null;
        setSlides(newSlides);
    };

    const drawSlideToCanvas = useCallback(() => {
        const canvas = recordingCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const currentSlide = slidesRef.current[currentSlideIndexRef.current];
        const imageEl = imagePlaybackRef.current;
        const videoEl = mediaPlaybackRef.current;
        
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let mediaSource: HTMLImageElement | HTMLVideoElement | null = null;
        if (currentSlide?.media?.type === 'image' && imageEl && imageEl.complete && imageEl.naturalHeight !== 0) {
            mediaSource = imageEl;
        } else if (currentSlide?.media?.type === 'video' && videoEl && videoEl.readyState >= 2) {
            mediaSource = videoEl;
        }

        if (mediaSource) {
            const canvasAspect = canvas.width / canvas.height;
            const mediaWidth = mediaSource instanceof HTMLImageElement ? mediaSource.naturalWidth : mediaSource.videoWidth;
            const mediaHeight = mediaSource instanceof HTMLImageElement ? mediaSource.naturalHeight : mediaSource.videoHeight;
            const mediaAspect = mediaWidth / mediaHeight;
            let sx = 0, sy = 0, sWidth = mediaWidth, sHeight = mediaHeight;

            if (canvasAspect > mediaAspect) {
                sHeight = mediaWidth / canvasAspect;
                sy = (mediaHeight - sHeight) / 2;
            } else {
                sWidth = mediaHeight * canvasAspect;
                sx = (mediaWidth - sWidth) / 2;
            }
            ctx.drawImage(mediaSource, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
            ctx.fillRect(0,0, canvas.width, canvas.height);
        }

        if (currentSlide) {
            ctx.fillStyle = '#22d3ee';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(currentSlide.title, canvas.width / 2, 120, canvas.width * 0.9);
        }


        const webcamEl = webcamVideoRef.current;
        if (webcamEl && webcamEl.videoWidth > 0 && webcamEl.readyState >= 2) {
            const camWidth = 240;
            const camHeight = 180;
            const camX = canvas.width - camWidth - 20;
            const camY = canvas.height - camHeight - 20;
            ctx.fillStyle = '#111827';
            ctx.fillRect(camX - 2, camY - 2, camWidth + 4, camHeight + 4);
            ctx.drawImage(webcamEl, camX, camY, camWidth, camHeight);
        }

    }, []);

    useEffect(() => {
        drawCallbackRef.current = drawSlideToCanvas;
    }, [drawSlideToCanvas]);
    
     useEffect(() => {
        if (mode === 'PRESENTING') {
            const currentSlide = slides[safeCurrentSlideIndex];
            const imageEl = imagePlaybackRef.current;
            const videoEl = mediaPlaybackRef.current;

            if (imageEl) imageEl.src = '';
            if (videoEl) {
                videoEl.pause();
                videoEl.removeAttribute('src');
                videoEl.load();
            }

            if (currentSlide?.media) {
                if (currentSlide.media.type === 'image' && imageEl) {
                    imageEl.src = currentSlide.media.url;
                    imageEl.onload = () => drawSlideToCanvas();
                } else if (currentSlide.media.type === 'video' && videoEl) {
                    videoEl.src = currentSlide.media.url;
                    videoEl.play().catch(e => console.error("Video autoplay failed", e));
                }
            } else {
                // If there's no media, we still need to draw the slide title etc.
                drawSlideToCanvas();
            }
        }
    }, [mode, safeCurrentSlideIndex, slides, drawSlideToCanvas]);
    
    const startRecording = useCallback(async () => {
        setMicError(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                // Get audio stream for recording
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

                // Get video stream for user's visual feedback (display only)
                try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    videoStreamRef.current = videoStream;
                    if (webcamVideoRef.current) {
                        webcamVideoRef.current.srcObject = videoStream;
                    }
                } catch (videoErr) {
                    console.warn("Could not get video stream, continuing with audio only.", videoErr);
                    // Don't block recording if camera fails, just warn.
                }

                // The mimeType should be audio
                const mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    setMicError("Audio recording format (audio/webm) not supported on your browser.");
                    return;
                }
                const mediaRecorder = new MediaRecorder(audioStream, { mimeType });
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const recordingBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    const duration = (Date.now() - startTimeRef.current) / 1000;
                    setRecordingData({ blob: recordingBlob, duration });
                    setPreviewUrl(URL.createObjectURL(recordingBlob)); // Create preview URL

                    // Stop all tracks properly
                    audioStream.getTracks().forEach(track => track.stop());
                    if (videoStreamRef.current) {
                        videoStreamRef.current.getTracks().forEach(track => track.stop());
                        videoStreamRef.current = null;
                    }
                };

                // The canvas draw loop is for user's visual reference, it is not recorded.
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
                let errorMessage = "Microphone or Camera access was denied. Please allow access in your browser settings.";
                if (err instanceof DOMException) {
                    if (err.name === 'NotAllowedError') {
                        errorMessage = "Permission to use microphone was denied. Please enable it in your browser settings to record. Check the lock icon in the address bar.";
                    } else if (err.name === 'NotFoundError') {
                        errorMessage = "No microphone found. Please ensure it is connected and enabled.";
                    }
                }
                console.error("Error accessing devices or starting recording:", err);
                setMicError(errorMessage);
            }
        } else {
            setMicError("Your browser does not support the required recording APIs.");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    }, []);

    const handleReview = () => {
        if (recordingData) {
            const fullScript = slides.map(s => `Slide: ${s.title}\n${s.script}`).join('\n\n');
            handleRecordingComplete(recordingData.blob, recordingData.duration, fullScript, slides);
        }
    };

    const handleSubmit = () => {
        if (recordingData && !isSubmitting) {
            setIsSubmitting(true);
            const fullScript = slides.map(s => `Slide: ${s.title}\n${s.script}`).join('\n\n');
            handleRecordingComplete(recordingData.blob, recordingData.duration, fullScript, slides, true)
                .catch((err) => {
                    console.error("Submission failed", err);
                })
                .finally(() => {
                    setIsSubmitting(false);
                });
        }
    };

    const handleRecordAgain = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl('');
        setRecordingData(null);
        setTimer(0);
        audioChunksRef.current = [];
    };
    
    useEffect(() => () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        slides.forEach(slide => {
            if (slide.media?.type === 'video' && slide.media.url.startsWith('blob:')) {
                URL.revokeObjectURL(slide.media.url);
            }
        });
    }, [slides, previewUrl]);

    const formatTime = (seconds: number) => {
        const totalSeconds = Math.round(seconds);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    const SaveStatusIndicator = () => {
        switch (saveStatus) {
            case 'saving':
                return <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>;
            case 'saved':
                return <span className="text-green-400">✓ Changes saved</span>;
            case 'idle':
            default:
                return <span>Auto-save enabled (images only)</span>;
        }
    };
    
    const MediaEditor = () => (
        <div className="h-72 bg-slate-900 rounded-md flex items-center justify-center border border-slate-600 relative overflow-hidden group">
             {(() => {
                if (mediaUploadState.status === 'processing') {
                    return (
                        <div className="text-center p-4">
                            <svg className="animate-spin h-12 w-12 mx-auto text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-slate-400 mt-4">{mediaUploadState.message}</p>
                        </div>
                    );
                }

                if (currentSlide?.media) {
                    return (
                        <>
                            {currentSlide.media.type === 'video' && <video src={currentSlide.media.url} controls className="object-contain h-full w-full" />}
                            {currentSlide.media.type === 'image' && <img src={currentSlide.media.url} alt={`Slide ${safeCurrentSlideIndex + 1} background`} className="object-contain h-full w-full" />}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <button onClick={triggerMediaUpload} className="bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors pointer-events-auto">Change</button>
                                <button onClick={() => removeMedia(safeCurrentSlideIndex)} className="bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors pointer-events-auto">Remove</button>
                            </div>
                        </>
                    );
                }

                return (
                     <div className="text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {mediaUploadState.status === 'error' ? (
                            <p className="text-red-400 mt-2 text-sm">{mediaUploadState.message}</p>
                        ) : (
                            <p className="text-slate-500 mt-2 text-sm">Add a background image or video to this slide.</p>
                        )}
                        <button onClick={triggerMediaUpload} className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded text-sm">
                            {mediaUploadState.status === 'error' ? 'Try Again' : 'Upload Media'}
                        </button>
                    </div>
                );
            })()}
            <input type="file" ref={fileInputRef} onChange={(e) => handleMediaUpload(e, safeCurrentSlideIndex)} accept="video/*,image/*" className="hidden" />
        </div>
    );

    const renderEditingView = () => (
         <>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
                <h2 className="text-xl font-bold text-cyan-400 mb-3">Practice</h2>
                <p className="text-slate-400">
                    Build your presentation below. Upload background media and add speaker notes for each slide. Your work is saved automatically. When ready, press "Start Presenting" to practice.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col gap-4">
                    <MediaEditor />
                    <div className="flex-grow flex flex-col gap-4">
                        <input 
                            type="text"
                            value={currentSlide?.title || ''}
                            onChange={(e) => updateSlide(safeCurrentSlideIndex, 'title', e.target.value)}
                            className="w-full bg-slate-900 text-xl font-bold p-2 rounded border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                        <textarea
                            value={currentSlide?.script || ''}
                            onChange={(e) => updateSlide(safeCurrentSlideIndex, 'script', e.target.value)}
                            placeholder="Enter speaker notes for this slide..."
                            className="w-full flex-grow p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        ></textarea>
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-bold text-cyan-400 mb-3">Presentation Overview</h3>
                        <ul onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="space-y-2 h-64 overflow-y-auto pr-2">
                            {slides.map((slide, index) => (
                                <li 
                                    key={slide.id} 
                                    onClick={() => setCurrentSlideIndex(index)}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragEnd={() => dragOverItemIndex.current = null}
                                    className={`flex items-center p-2 rounded-lg cursor-pointer border-2 transition-colors ${safeCurrentSlideIndex === index ? 'border-cyan-500 bg-slate-700/50' : 'border-transparent hover:bg-slate-700'} ${dragOverItemIndex.current === index ? 'bg-slate-600/50' : ''}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 mr-2 flex-shrink-0 cursor-move" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                    <div className="w-16 h-10 bg-slate-900 rounded-md flex items-center justify-center overflow-hidden mr-3 flex-shrink-0 border border-slate-600">
                                        {slide.media ? (
                                            slide.media.type === 'video' ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2-2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            )
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        )}
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-semibold text-slate-200 truncate">{slide.title || `Slide ${index + 1}`}</p>
                                        <p className="text-xs text-slate-400">Slide {index + 1}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button onClick={addSlide} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded text-sm">+ Add Slide</button>
                            <button onClick={deleteCurrentSlide} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm">Delete Slide</button>
                        </div>
                         <div className="mt-2 flex items-center justify-center text-xs text-slate-400 bg-slate-900/50 rounded-lg p-2">
                            <SaveStatusIndicator />
                        </div>
                    </div>
                    <div className="bg-slate-800/70 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-md font-semibold text-cyan-400 mb-2">Slide Settings</h4>
                        <label className="text-sm text-slate-400">Transition Effect</label>
                        <div className="flex gap-2 mt-1">
                            {(['none', 'fade', 'slide'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => updateSlide(safeCurrentSlideIndex, 'transition', t)}
                                    className={`flex-1 text-sm py-1 rounded-md transition-colors ${currentSlide?.transition === t || (!currentSlide?.transition && t === 'none') ? 'bg-cyan-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-slate-800 p-6 rounded-lg border border-slate-700 text-center">
                        <h3 className="text-lg font-bold text-cyan-400 mb-3">Ready to Practice?</h3>
                         <p className="text-slate-400 mb-4 text-sm">Enter presentation mode to see your slides and access recording controls.</p>
                         <button onClick={() => setMode('PRESENTING')} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded">
                             Start Presenting
                         </button>
                         <button onClick={handleBackToSelection} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center mx-auto mt-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            Back to Menu Selection
                        </button>
                    </div>
                </div>
            </div>
             <div className="mt-4 flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                <button onClick={() => { setCurrentSlideIndex(prev => Math.max(0, prev - 1)); setSlideDirection('prev'); }} disabled={safeCurrentSlideIndex === 0} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                <span className="text-sm font-semibold">{slides.length > 0 ? safeCurrentSlideIndex + 1 : 0} / {slides.length}</span>
                <button onClick={() => { setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1)); setSlideDirection('next'); }} disabled={safeCurrentSlideIndex === slides.length - 1} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
            </div>
         </>
    );
    
    const renderPresentingView = () => (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-cyan-400">Presentation Mode</h2>
                    <p className="text-sm text-slate-400">{recordingData ? 'Review your recording before submitting.' : 'Your voice will be recorded. The visuals are for practice only.'}</p>
                </div>
                <button onClick={() => setMode('EDITING')} className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 py-2 px-4 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Back to Editor
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-420px)]">
                {/* Left side: Presentation Canvas / Audio Player */}
                <div className="lg:col-span-2 relative bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden h-full">
                    {recordingData ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
                             <p className="text-slate-300 mb-4">Recording complete. Listen to your audio below.</p>
                             <audio controls src={previewUrl} className="w-full max-w-lg" />
                        </div>
                    ) : (
                         <>
                            <canvas ref={recordingCanvasRef} width="1280" height="720" className="aspect-video w-full h-auto max-h-full object-contain" />
                            <img ref={imagePlaybackRef} className="hidden" />
                            <video ref={mediaPlaybackRef} muted loop className="hidden" />
                            <video ref={webcamVideoRef} autoPlay playsInline muted className="hidden" />
                        </>
                    )}
    
                    <div className="absolute top-4 right-4 z-10">
                        {micError && (
                            <div className="bg-red-800/80 p-3 rounded-lg text-sm text-center">
                                <p>{micError}</p>
                                <button onClick={() => setIsHelpModalOpen(true)} className="mt-2 text-cyan-300 underline">Show Help</button>
                            </div>
                        )}
                    </div>
                    {error && <p className="absolute top-4 left-4 bg-red-800/80 p-3 rounded-lg text-sm z-10">{error}</p>}
                </div>
    
                {/* Right side: Speaker Notes */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-cyan-400 mb-3 border-b border-slate-700 pb-2 flex-shrink-0">
                        Slide {safeCurrentSlideIndex + 1}: {currentSlide?.title}
                    </h3>
                    <div className="flex-grow overflow-y-auto text-slate-300 text-sm leading-relaxed pr-2">
                        <p className="whitespace-pre-wrap">{currentSlide?.script || <span className="italic text-slate-500">No speaker notes for this slide.</span>}</p>
                    </div>
                </div>
            </div>
            
            {/* Bottom Controls */}
            {recordingData ? (
                <>
                    <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">
                         <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
                            <span className="font-mono font-bold text-cyan-400">{formatTime(recordingData.duration)}</span>
                            <button onClick={handleRecordAgain} disabled={isSubmitting} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:opacity-50">Record Again</button>
                            <button onClick={handleReview} disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:opacity-50">Review & Save</button>
                         </div>
                    </div>
                    <div className="text-center mt-4 flex justify-center items-center gap-4">
                        <button onClick={handleBackToSelection} className="text-sm bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-500/50 flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            Back to Menu Selection
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/50 text-sm disabled:bg-slate-500 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit to Lecturer'}
                        </button>
                    </div>
                </>
            ) : (
                 <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">
                     <div className="max-w-xl mx-auto flex items-center justify-around">
                        <button onClick={() => { setCurrentSlideIndex(prev => Math.max(0, prev - 1)); setSlideDirection('prev'); }} disabled={safeCurrentSlideIndex === 0} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50">
                            Previous
                        </button>
                        
                        <div className="flex items-center gap-4">
                            <span className={`text-xl font-mono font-bold ${isRecording ? 'text-red-500' : 'text-cyan-400'}`}>{formatTime(timer)}</span>
                            
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                                className={`relative flex items-center justify-center w-16 h-16 rounded-full text-white shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 ${
                                    isRecording ? 'bg-red-700 focus:ring-red-500/50' : 'bg-red-600 focus:ring-red-500/50'
                                }`}
                            >
                                {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-pulse"></div>}
                                {isRecording ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                                        <path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 9v1a4 4 0 004 4h.01a4 4 0 004-4V9a.5.5 0 011 0v1a5 5 0 01-4.5 4.975V17h3a.5.5 0 010 1h-7a.5.5 0 010-1h3v-2.025A5 5 0 015 10V9a.5.5 0 01.5-.5z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>

                            <span className="text-sm font-semibold w-24 text-center">Slide {safeCurrentSlideIndex + 1} of {slides.length}</span>
                        </div>

                        <button onClick={() => { setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1)); setSlideDirection('next'); }} disabled={safeCurrentSlideIndex === slides.length - 1} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50">
                            Next
                        </button>
                     </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <MicrophoneHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            {mode === 'EDITING' ? renderEditingView() : renderPresentingView()}
        </div>
    );
};

export default FreePracticeScreen;