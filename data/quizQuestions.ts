import React from 'react';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export const meetingQuizQuestions: QuizQuestion[] = [
  {
    question: "According to the 'Learn' module, what is the most important first step before scheduling or accepting a meeting?",
    options: [
      "Booking a conference room.",
      "Defining a clear, desired outcome.",
      "Inviting all senior managers.",
      "Preparing a slide deck."
    ],
    correctAnswerIndex: 1,
    explanation: "Every meeting must have a clear purpose or desired outcome. This ensures the meeting is necessary and stays focused on achieving a specific goal."
  },
  {
    question: "When should a good meeting agenda ideally be sent out to participants?",
    options: [
      "At the beginning of the meeting.",
      "One hour before the meeting.",
      "At least 24 hours in advance.",
      "After the meeting, as a summary."
    ],
    correctAnswerIndex: 2,
    explanation: "Sending the agenda at least 24 hours in advance gives all participants time to prepare, which is crucial for a productive discussion."
  },
  {
    question: "Who is primarily responsible for guiding the conversation, staying on schedule, and ensuring all voices are heard?",
    options: [
      "The Participant",
      "The Note-Taker/Secretary",
      "The most senior person in the room",
      "The Chairperson/Facilitator"
    ],
    correctAnswerIndex: 3,
    explanation: "The Chairperson or Facilitator's key role is to manage the flow of the meeting, ensure it adheres to the agenda, and encourage balanced participation."
  },
  {
    question: "What are the three critical items a Note-Taker should document?",
    options: [
      "Attendance, jokes, and coffee orders.",
      "Key discussion points, final decisions, and action items.",
      "Who spoke the most, who was late, and who left early.",
      "The meeting's start time, end time, and location."
    ],
    correctAnswerIndex: 1,
    explanation: "The most critical function of a note-taker is to capture the substance of the meeting: the main points discussed, the decisions made, and the specific, actionable tasks that result."
  },
  {
    question: "Which of the following is described as a key part of 'Effective Participation'?",
    options: [
      "Waiting for your turn to speak, then listing all your ideas.",
      "Disagreeing with people, not their ideas.",
      "Listening actively to understand and build on others' ideas.",
      "Using complex jargon to show your expertise."
    ],
    correctAnswerIndex: 2,
    explanation: "Active listening is a core component of effective participation. It involves understanding what others are saying and contributing in a way that builds upon the conversation, rather than just waiting to speak."
  },
  {
    question: "What is NOT a primary purpose of a professional meeting?",
    options: [
        "Decision-Making",
        "Problem-Solving",
        "A general 'chat' to catch up",
        "Information Sharing & Planning"
    ],
    correctAnswerIndex: 2,
    explanation: "While building rapport is important, a professional meeting should never be 'just a chat.' It must have a clear, work-related purpose like making decisions, solving problems, or planning."
  },
  {
    question: "According to the guide on effective participation, when discussing a problem, it's best to also...",
    options: [
      "Assign blame for the problem.",
      "Propose a potential solution.",
      "Wait for the manager to solve it.",
      "Change the topic to something more positive."
    ],
    correctAnswerIndex: 1,
    explanation: "A constructive participant doesn't just identify problems; they also contribute to solving them by proposing potential solutions, which moves the conversation forward."
  },
  {
    question: "What is the primary responsibility of a 'Participant' in a meeting?",
    options: [
      "To document all key decisions and action items.",
      "To lead the discussion and ensure the meeting stays on time.",
      "To arrive prepared, listen actively, and contribute constructively.",
      "To challenge every point made to ensure rigorous debate."
    ],
    correctAnswerIndex: 2,
    explanation: "The role of a participant is to be an engaged and prepared contributor who listens to others and adds value to the discussion in a respectful manner."
  },
  {
    question: "Which of the following is NOT listed as a necessary component of a simple meeting agenda?",
    options: [
      "A one-sentence meeting objective.",
      "A detailed biography of each attendee.",
      "A list of topics with time estimates.",
      "Information on any required pre-reading."
    ],
    correctAnswerIndex: 1,
    explanation: "An agenda should list attendees, but detailed biographies are not necessary. The focus should be on the objective, topics, and preparation materials."
  },
  {
    question: "The 'Be Respectful' principle of effective participation specifically advises to:",
    options: [
      "Avoid any form of disagreement to maintain harmony.",
      "Only speak when asked a direct question by the facilitator.",
      "Disagree with ideas, not with people, and maintain a professional tone.",
      "Ensure your ideas are heard, even if it means interrupting others."
    ],
    correctAnswerIndex: 2,
    explanation: "Constructive disagreement is healthy for a meeting. The key is to challenge the idea or proposal, not to make the disagreement personal, and to always maintain a professional and respectful tone."
  }
];