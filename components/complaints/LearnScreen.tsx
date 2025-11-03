import React from 'react';
import Card from '../Card';

interface LearnScreenProps {
  onBack: () => void;
}

const LearnScreen: React.FC<LearnScreenProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">Learn: How to Handle Complaints Professionally</h2>
        <p className="mt-2 text-lg text-slate-400">Turn difficult situations into opportunities using the L.A.S.T. method.</p>
      </div>

      <Card title="The L.A.S.T. Method: A 4-Step Framework">
        <div className="p-4 text-slate-300 space-y-2 text-sm">
            <p>Handling a complaint effectively is a critical professional skill. It can de-escalate a tense situation and even strengthen a relationship with a client or colleague. The L.A.S.T. method provides a simple, memorable, and effective structure to guide your response.</p>
        </div>
      </Card>

      <div className="space-y-6">
        <Card title="Step 1: L - Listen">
          <div className="p-4 text-slate-300 space-y-2 text-sm">
            <h3 className="text-lg font-semibold text-fuchsia-400">Goal: Understand the Full Picture</h3>
            <p>Your first job is not to solve, but to listen. Give the person your complete and uninterrupted attention. Let them explain their issue fully without jumping in with corrections or solutions. This shows respect and helps you gather all the necessary facts.</p>
            <p className="font-semibold mt-2">Key Actions:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Use active listening cues (e.g., "I see," "Okay," nodding).</li>
              <li>Avoid interrupting or planning your response while they are speaking.</li>
              <li>Once they've finished, summarize their points to confirm you've understood correctly: "So, if I'm hearing you right, the main issue is..."</li>
            </ul>
          </div>
        </Card>

        <Card title="Step 2: A - Acknowledge & Apologize">
          <div className="p-4 text-slate-300 space-y-2 text-sm">
            <h3 className="text-lg font-semibold text-fuchsia-400">Goal: Show Empathy and Validate Their Feelings</h3>
            <p>Before you solve the problem, you must acknowledge the person's feelings. A sincere, simple apology can be incredibly powerful in defusing anger and frustration. This is not necessarily about admitting fault, but about showing empathy for their negative experience.</p>
            <p className="font-semibold mt-2">Key Phrases:</p>
            <ul className="list-disc list-inside ml-4">
              <li>"I'm very sorry to hear that this happened."</li>
              <li>"I understand why you're frustrated, and I apologize for the inconvenience."</li>
              <li>"That is not the level of quality we aim for, and I'm sorry we fell short."</li>
            </ul>
          </div>
        </Card>

        <Card title="Step 3: S - Solve">
          <div className="p-4 text-slate-300 space-y-2 text-sm">
            <h3 className="text-lg font-semibold text-fuchsia-400">Goal: Take Ownership and Propose a Solution</h3>
            <p>Now it's time to take action. Collaborate with the person to find a resolution. Where possible, offer a concrete solution immediately. If you can't, provide a clear plan of what you will do next and a timeline for a follow-up.</p>
            <p className="font-semibold mt-2">Key Actions:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Ask what they would consider a fair outcome: "What would be an ideal resolution for you?"</li>
              <li>Offer a clear, specific solution: "Here is what I can do to fix this for you right now..."</li>
              <li>Take ownership: Use "I will..." instead of "Someone will..."</li>
            </ul>
          </div>
        </Card>

        <Card title="Step 4: T - Thank">
          <div className="p-4 text-slate-300 space-y-2 text-sm">
            <h3 className="text-lg font-semibold text-fuchsia-400">Goal: Rebuild the Relationship</h3>
            <p>End the conversation on a positive and professional note. Thank the person for bringing the issue to your attention. This reframes their complaint as valuable feedback that helps you or your organization improve, which helps to repair the relationship.</p>
            <p className="font-semibold mt-2">Key Phrases:</p>
            <ul className="list-disc list-inside ml-4">
              <li>"Thank you for your patience as we work through this."</li>
              <li>"I really appreciate you bringing this to my attention."</li>
              <li>"Your feedback is very valuable and will help us improve."</li>
            </ul>
          </div>
        </Card>
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

export default LearnScreen;