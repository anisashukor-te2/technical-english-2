import React, { createContext, useContext, ReactNode } from 'react';
import { FeedbackData, PracticeView, PresentationMode, Slide, Student, Lecturer } from '../types';

export interface PresentationContextType {
  presentationMode: PresentationMode;
  practiceView: PracticeView;
  feedbackData: FeedbackData | null;
  slides: Slide[] | null;
  sessionId: string | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  recordingUrl: string;
  // FIX: Add missing properties to the context type.
  recordingBase64: string | null;
  recordingMimeType: string | null;

  handleRecordingComplete: (
    recordingBlob: Blob,
    duration: number,
    userScript?: string,
    presentationSlides?: Slide[],
    isSubmission?: boolean
  ) => Promise<void>;
  handlePracticeAgain: () => void;
  handleSelectPresentationMode: (mode: PresentationMode) => void;
  handleBackToSelection: () => void;
  setError: (error: string | null) => void;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export const usePresentation = (): PresentationContextType => {
  const context = useContext(PresentationContext);
  if (!context) {
    throw new Error('usePresentation must be used within a PresentationProvider');
  }
  return context;
};

interface PresentationProviderProps {
  children: ReactNode;
  value: PresentationContextType;
}

// This is now a simple "pass-through" provider.
// All state and logic are managed in the App.tsx component.
export const PresentationProvider: React.FC<PresentationProviderProps> = ({ children, value }) => {
    return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
};