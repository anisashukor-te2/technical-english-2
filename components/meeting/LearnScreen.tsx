import React from 'react';
import Card from '../Card';

interface LearnScreenProps {
  onBack: () => void;
}

const LearnScreen: React.FC<LearnScreenProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">Learn: Meeting & Social Skills Essentials</h2>
        <p className="mt-2 text-lg text-slate-400">Master the fundamentals of effective professional meetings.</p>
      </div>

      <Card title="1. The Purpose of a Meeting">
        <div className="p-4 text-slate-300 space-y-2 text-sm">
          <p>A professional meeting should never be "just a chat." Every meeting must have a clear purpose. Before scheduling or accepting a meeting, ask: "What is the desired outcome of this meeting?"</p>
          <p className="font-semibold">Common purposes include:</p>
          <ul className="list-disc list-inside ml-4">
            <li><strong>Decision-Making:</strong> To choose a course of action from several options.</li>
            <li><strong>Problem-Solving:</strong> To analyze an issue and brainstorm solutions.</li>
            <li><strong>Information Sharing:</strong> To provide updates, present findings, or align the team on a topic.</li>
            <li><strong>Planning:</strong> To define goals, assign tasks, and set timelines for a project.</li>
          </ul>
        </div>
      </Card>

      <Card title="2. The Agenda: Your Meeting Roadmap">
        <div className="p-4 text-slate-300 space-y-2 text-sm">
          <p>An agenda is a non-negotiable for a productive meeting. It outlines the topics to be discussed, the person responsible for each topic, and the time allocated. A good agenda is sent out at least 24 hours in advance.</p>
          <p className="font-semibold">A simple agenda includes:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Meeting Title, Date, Time, Attendees</li>
            <li>Meeting Objective (1 sentence)</li>
            <li>List of topics with time estimates (e.g., "1. Review Q3 Performance - 15 mins")</li>
            <li>Any required pre-reading or preparation</li>
          </ul>
        </div>
      </Card>

      <Card title="3. Key Meeting Roles">
        <div className="p-4 text-slate-300 space-y-2 text-sm">
          <p>Even in informal meetings, participants naturally take on roles. Understanding these helps ensure the meeting stays on track.</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Chairperson/Facilitator:</strong> Guides the conversation, ensures the meeting stays on agenda and on time, and facilitates discussion so that all voices are heard.</li>
            <li><strong>Note-Taker/Secretary:</strong> Has the critical task of documenting the meeting. They record key discussion points, final decisions, and any action items, including who is responsible and the due date.</li>
            <li><strong>Participant:</strong> The responsibility of every participant is to arrive prepared, listen actively to others, contribute constructively to the discussion, and maintain a respectful and professional tone.</li>
          </ul>
        </div>
      </Card>
      
      <Card title="4. Effective Participation">
        <div className="p-4 text-slate-300 space-y-2 text-sm">
            <p>Your contribution is valuable. Here's how to make it count:</p>
            <ul className="list-disc list-inside ml-4">
                <li><strong>Be Prepared:</strong> Read the agenda and any materials beforehand.</li>
                <li><strong>Listen Actively:</strong> Don't just wait for your turn to speak. Understand what others are saying and build on their ideas.</li>
                <li><strong>Speak Clearly and Concisely:</strong> Get to your point quickly. Avoid jargon where possible.</li>
                <li><strong>Be Respectful:</strong> Disagree with ideas, not people. Maintain a professional tone.</li>
                <li><strong>Focus on Solutions:</strong> When discussing a problem, try to also propose a potential solution.</li>
            </ul>
        </div>
      </Card>

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

export default LearnScreen;