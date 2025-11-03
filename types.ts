import React from 'react';

export interface FillerWord {
  word: string;
  count: number;
}

export interface KeywordAnalysis {
  keywordsFound: string[];
  keywordsMissed: string[];
  feedback: string;
}

export interface Pacing {
  wpm: number;
  feedback: string;
}

export interface FeedbackData {
  transcription: string;
  overallScore: number;
  fillerWords: FillerWord[];
  keywordAnalysis: KeywordAnalysis;
  languageFeedback: string;
  pacing: Pacing;
  voiceModulation: {
      feedback: string;
  };
  sessionSummary: string;
}

export interface MinuteFeedbackData {
  accuracyScore: number;
  capturedCorrectly: string[];
  missedItems: string[];
  suggestions: string[];
  summary: string;
}

export interface ComplaintFeedbackData {
  toneScore: number; // 0-100 on professionalism & empathy
  clarityScore: number; // 0-100 on how clear the proposed solution is
  lastMethodAdherence: string[]; // e.g., "Listen: You successfully acknowledged the user's core problem."
  suggestions: string[]; // e.g., "Consider starting with a more direct apology."
  summary: string;
}

export type PracticeView = 'PRACTICE' | 'PROCESSING' | 'FEEDBACK';

export type PresentationMode = 'SELECTION' | 'GUIDED' | 'FREE' | 'REVIEW';

export interface Slide {
    id: number;
    title: string;
    script: string;
    media?: {
      url: string; // data URL for image, object URL for video
      type: 'image' | 'video';
    };
    transition?: 'fade' | 'slide' | 'none';
}

export interface PeerFeedback {
  id: string;
  clarityRating: number; // 1-5
  engagementRating: number; // 1-5
  comment: string;
  timestamp: number;
}

export interface PracticeSession {
  id: string; 
  timestamp: number; 
  feedbackData: FeedbackData;
  recordingData: string; // base64 encoded recording data
  recordingMimeType: string;
  peerReviews: PeerFeedback[];
  selfReflection?: string;
  slides?: Slide[];
  isSubmitted?: boolean;
  studentUid: string;
  studentEmail: string; // For display purposes
  classCode: string; // For filtering
  lecturerEmail: string; // For querying
  grade?: number;
  lecturerFeedback?: string;
}

export interface Lecturer {
  uid: string;
  email: string;
  role: 'lecturer';
  courseCode: string;
  classCodes: string[];
  password?: string;
}

export interface Student {
    uid: string;
    email: string;
    role: 'student';
    courseId: string;
    classCode: string;
    lecturerEmail: string;
    // FIX: Added optional password for login/registration purposes.
    password?: string;
}

// --- App-level Types ---
export type ActiveModule = 'PRESENTATION' | 'MEETING' | 'COMPLAINTS' | 'RESOURCES';
export type UserProfile = Student | Lecturer;


// --- Meeting & Complaint Session Types ---

export interface MeetingMessage {
    speaker: 'You' | 'AI';
    text: string;
}

export interface MeetingScenario {
  title: string;
  description: string;
  roles: string[];
  icon: React.ReactNode;
}

export interface MeetingSession {
    id: string;
    timestamp: number; 
    studentUid: string;
    studentEmail: string;
    lecturerEmail: string;
    classCode: string; // For filtering
    scenarioTitle: string;
    userRole: string;
    messages: MeetingMessage[];
    isSubmitted?: boolean;
    grade?: number;
    lecturerFeedback?: string;
}

export interface MinuteTakingSession {
    id: string;
    timestamp: number; 
    studentUid: string;
    studentEmail: string;
    lecturerEmail: string;
    classCode: string;
    userMinutes: string;
    feedbackData: MinuteFeedbackData;
    isSubmitted?: boolean;
    grade?: number;
    lecturerFeedback?: string;
}

export interface ComplaintMessage {
    speaker: 'You' | 'AI';
    text: string;
}

export interface ComplaintScenario {
  title: string;
  description: string;
  userRole: string;
  aiRole: string;
  aiPersona: string;
  icon: React.ReactNode;
}

export interface ComplaintSession {
    id: string;
    timestamp: number; 
    studentUid: string;
    studentEmail: string;
    lecturerEmail: string;
    classCode: string; // For filtering
    scenarioTitle: string;
    userRole: string;
    messages: ComplaintMessage[];
}