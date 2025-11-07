import React, { useState, useEffect } from 'react';
import Card from './Card';
import Modal from './common/Modal';
import { PracticeSession, PeerFeedback } from '../types';
import * as firebaseService from '../services/firebaseService';
import Loader from './Loader';

const PRESENTATION_TEMPLATE = `
PRESENTATION SLIDE TEMPLATE (.pptx)
A simple, universal structure. Open this file in PowerPoint, and it will import this text as an outline.

----------------------------------
Slide 1: Title Slide
----------------------------------
- Presentation Title: [Your Title Here]
- Your Name & ID
- Course: DUE30072 - Technical English 2
- Date

----------------------------------
Slide 2: Introduction / Agenda
----------------------------------
- Hook: Start with a question, a surprising fact, or a brief story to grab the audience's attention.
- Objective: Clearly state the purpose of your presentation. (e.g., "Today, I will explain the five critical steps for...")
- Agenda: Briefly list the main points you will cover.

----------------------------------
Slide 3: Main Point 1
----------------------------------
- Topic Title: [Title of Your First Key Point]
- Supporting Detail 1: Explain the first part of your topic with clear, concise language.
- Supporting Detail 2: Add more information, data, or a specific example to reinforce your point.
- Visual Aid: (Describe the diagram, chart, or image you would use on this slide)

----------------------------------
Slide 4: Main Point 2 (and so on...)
----------------------------------
- (Repeat the structure of Slide 3 for all your main points)
- Topic Title: [Title of Your Second Key Point]
- Supporting Detail 1: ...
- Supporting Detail 2: ...
- Visual Aid: ...

----------------------------------
Slide 5: Conclusion
----------------------------------
- Summary: Briefly recap your main points (e.g., "In conclusion, we've covered A, B, and C.")
- Restate Objective: Remind the audience of the presentation's purpose and how you fulfilled it.
- Call to Action / Final Thought: What is the key message you want your audience to remember?
- Q&A: Formally open the floor for questions. "Thank you. I'm now happy to answer any questions you may have."
`.trim();

const MINUTES_TEMPLATE = `
MEETING MINUTES TEMPLATE (.docx)
A standard, professional format for recording meeting details.

----------------------------------
Meeting Title: [Insert Meeting Title]
Date: [Insert Date]
Time: [Insert Time]
Venue: [Insert Venue / Platform, e.g., "Microsoft Teams"]

----------------------------------
Attendees:
----------------------------------
1. [Name], Chairperson
2. [Name], Secretary
3. [Name], Participant
(List all attendees)

----------------------------------
Absentees (with apologies):
----------------------------------
1. (List anyone who was invited but could not attend)

----------------------------------
1.0 Opening Remarks by Chairperson
----------------------------------
- (Briefly note the key opening statements, the meeting's objective)

----------------------------------
2.0 Confirmation of Previous Minutes
----------------------------------
- The minutes of the meeting held on [Date of last meeting] were confirmed without amendment.

----------------------------------
3.0 Matters Arising
----------------------------------
- (Discuss any action items from the previous meeting that need an update. Note the progress.)

----------------------------------
4.0 Agenda Item 1: [Title of First Discussion Topic]
----------------------------------
- 4.1 Discussion: (Summarize the key points, ideas, and arguments discussed)
- 4.2 Decision: (Clearly state the decision that was made on this topic)

----------------------------------
5.0 Agenda Item 2: [Title of Second Discussion Topic]
----------------------------------
- 5.1 Discussion: ...
- 5.2 Decision: ...

----------------------------------
6.0 Action Items Summary
----------------------------------
| No. | Action Item Description                          | Owner (Person Responsible) | Due Date   |
|-----|--------------------------------------------------|----------------------------|------------|
| 1.  | [Describe the specific task]                     | [Name]                     | [Date]     |
| 2.  | [Describe the specific task]                     | [Name]                     | [Date]     |


----------------------------------
7.0 Other Business (if any)
----------------------------------
- (Note any other topics that were discussed)

----------------------------------
8.0 Closing
----------------------------------
- Next Meeting Date: [If applicable]
- Meeting Adjourned at: [Insert Time]

----------------------------------
Prepared by:

...................................
([Your Name])
Secretary

----------------------------------
Approved by:

...................................
([Chairperson's Name])
Chairperson
`.trim();

const COMPLAINT_TEMPLATE = `
COMPLAINT RESPONSE EMAIL TEMPLATE (.docx)
A professional template for responding to written complaints. Open this in Word or Google Docs.

----------------------------------
Subject: Regarding your recent feedback on [Issue/Product/Service]

Dear [Client/Customer Name],

Thank you for reaching out and bringing this matter to our attention.

I am very sorry to hear about the issue you experienced with [briefly and factually state the problem]. I understand how frustrating this must be, and I sincerely apologize for the inconvenience this has caused.

[CHOOSE THE APPROPRIATE OPTION BELOW AND DELETE THE OTHERS]

[Option 1: If the issue is already solved]
We have already taken action to resolve this. We have [describe the specific action taken, e.g., "shipped a replacement part," "corrected the invoice," etc.]. You should see this reflected by [date/time].

[Option 2: If you are proposing a solution]
To resolve this for you, I would like to offer [describe solution 1, e.g., "a full refund"] or [describe solution 2, e.g., "a replacement product at no charge"]. Please let me know which option you would prefer.

[Option 3: If you need more information to solve it]
To investigate this further and find the best solution, could you please provide me with [e.g., your order number, a screenshot of the error, the serial number of the product]? This will help us get to the bottom of it quickly.

We value your business and feedback, and we are committed to making this right. Please let me know if there is anything else I can assist you with.

Sincerely,

[Your Name]
[Your Title]
`.trim();

const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};


const PresentationChecklistContent = () => (
    <div className="space-y-4 text-slate-300">
        <div>
            <h4 className="font-bold text-cyan-400">1. Content & Structure (The "What")</h4>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                <li>Define your core objective: What's the key takeaway for your audience?</li>
                <li>Analyze your audience: Who are they and what do they already know?</li>
                <li>Create a logical outline: Introduction, Body (key points), and Conclusion.</li>
                <li>Draft a compelling script or speaker notes for each slide.</li>
                <li>Start with a strong opening to grab attention and end with a memorable summary.</li>
            </ul>
        </div>
        <div>
            <h4 className="font-bold text-cyan-400">2. Slide Design (The "Visuals")</h4>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                <li>Keep it simple: One main idea per slide. Avoid clutter.</li>
                <li>Use high-quality, relevant images and graphics.</li>
                <li>Ensure high contrast and readable fonts (at least 24pt).</li>
                <li>Use a consistent color scheme and layout.</li>
                <li>Check for typos and grammatical errors on every slide.</li>
            </ul>
        </div>
        <div>
            <h4 className="font-bold text-cyan-400">3. Delivery Practice (The "How")</h4>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                <li>Rehearse out loud multiple times, not just in your head.</li>
                <li>Time yourself to ensure you respect the time limit.</li>
                <li>Record yourself (using this app!) to check pacing, filler words, and body language.</li>
                <li>Practice in front of a friend or colleague for feedback.</li>
                <li>Anticipate potential questions from the audience.</li>
            </ul>
        </div>
        <div>
            <h4 className="font-bold text-cyan-400">4. Final Checks (The "Day Of")</h4>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                <li>Test all equipment: projector, laptop, clicker, and microphone.</li>
                <li>Have a backup of your presentation on a USB drive and in the cloud.</li>
                <li>Arrive early to get comfortable with the space.</li>
                <li>Do a final run-through of your opening and closing statements.</li>
            </ul>
        </div>
    </div>
);

const LASTGuideContent = () => (
    <div className="space-y-4 text-slate-300">
        <p className="text-sm">The L.A.S.T. method is a simple, effective framework for handling complaints. It provides a clear, four-step process to de-escalate tension and find a resolution.</p>
        <div>
            <h4 className="text-xl font-bold text-cyan-400">L - Listen</h4>
            <p className="mt-1 pl-4 border-l-2 border-slate-600 text-sm">
                Give the person your complete, uninterrupted attention. Let them explain their issue fully. Focus on understanding their perspective, not on preparing your defense. Use active listening cues like nodding and confirming you understand.
            </p>
        </div>
        <div>
            <h4 className="text-xl font-bold text-cyan-400">A - Acknowledge & Apologize</h4>
            <p className="mt-1 pl-4 border-l-2 border-slate-600 text-sm">
                Validate their feelings by acknowledging their frustration or disappointment. A sincere, simple apology can be very powerful. Say "I'm sorry this happened" or "I understand why you're upset." This is not about admitting fault, but about showing empathy for their experience.
            </p>
        </div>
        <div>
            <h4 className="text-xl font-bold text-cyan-400">S - Solve</h4>
            <p className="mt-1 pl-4 border-l-2 border-slate-600 text-sm">
                Take ownership of finding a solution. Ask, "What would be an ideal outcome for you?" If you can, offer a concrete solution immediately. If not, clearly explain the next steps you will take to resolve the issue and provide a timeline.
            </p>
        </div>
        <div>
            <h4 className="text-xl font-bold text-cyan-400">T - Thank</h4>
            <p className="mt-1 pl-4 border-l-2 border-slate-600 text-sm">
                Thank the person for bringing the issue to your attention. Their feedback is valuable, even if it's hard to hear. This final step helps to rebuild the relationship and shows that you see their complaint as an opportunity to improve.
            </p>
        </div>
    </div>
);


const StarRating: React.FC<{ rating: number; setRating: (r: number) => void }> = ({ rating, setRating }) => {
    return (
        <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} out of 5 stars`}
                >
                    <svg
                        className={`w-6 h-6 ${rating >= star ? 'text-yellow-400' : 'text-slate-500'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};


const PeerReviewModal: React.FC<{
    session: PracticeSession;
    onClose: () => void;
    onSubmitFeedback: (sessionId: string, feedback: Omit<PeerFeedback, 'id' | 'timestamp'>) => void;
}> = ({ session, onClose, onSubmitFeedback }) => {
    const { feedbackData } = session;
    const [clarityRating, setClarityRating] = useState(0);
    const [engagementRating, setEngagementRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaSrc, setMediaSrc] = useState<string>('');

    useEffect(() => {
        if (session?.recordingUrl) {
            setMediaSrc(session.recordingUrl);
        }
    }, [session]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clarityRating === 0 || engagementRating === 0 || !comment.trim()) {
            alert("Please provide a rating for both categories and a comment.");
            return;
        }
        setIsSubmitting(true);
        onSubmitFeedback(session.id, { clarityRating, engagementRating, comment });
    };

    return (
        <Modal isOpen={!!session} onClose={onClose} title={`Reviewing Session from ${new Date(session.timestamp).toLocaleDateString()}`}>
            <div className="grid lg:grid-cols-2 gap-6">
                 {/* Left Column: Original Feedback */}
                 <div className="space-y-4">
                    <Card title="Original AI Feedback">
                         <div className="p-4 space-y-3">
                            <div className="flex justify-around text-center">
                                <div>
                                    <p className="text-slate-400 text-sm">Score</p>
                                    <p className="text-2xl font-bold text-cyan-400">{feedbackData.overallScore}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Pacing</p>
                                    <p className="text-2xl font-bold text-cyan-400">{feedbackData.pacing.wpm} WPM</p>
                                </div>
                            </div>
                         </div>
                    </Card>
                    <Card title="Session Recording & Transcription">
                        <div className="p-4">
                            {mediaSrc ? (
                                session.recordingMimeType.startsWith('video/') ? (
                                    <video controls src={mediaSrc} className="w-full mb-4 rounded-md bg-black">
                                        Your browser does not support the video element.
                                    </video>
                                ) : (
                                    <audio controls src={mediaSrc} className="w-full mb-4 rounded-md">
                                        Your browser does not support the audio element.
                                    </audio>
                                )
                            ) : (
                                <div className="w-full h-14 flex items-center justify-center bg-slate-700 rounded-md mb-4">
                                    <p className="text-slate-400 text-sm">Loading recording...</p>
                                </div>
                            )}
                            <div className="h-40 overflow-y-auto text-slate-300 text-sm leading-relaxed border-t border-slate-700 pt-4">
                                {feedbackData.transcription}
                            </div>
                        </div>
                    </Card>
                    <Card title="Existing Peer Feedback">
                         <div className="p-4 h-48 overflow-y-auto space-y-4">
                            {session.peerReviews.length > 0 ? (
                                session.peerReviews.map(review => (
                                    <div key={review.id} className="text-sm border-b border-slate-700 pb-2">
                                        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                                            <span>Clarity: {'⭐'.repeat(review.clarityRating)}</span>
                                            <span>Engagement: {'⭐'.repeat(review.engagementRating)}</span>
                                        </div>
                                        <p className="text-slate-300 italic">"{review.comment}"</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 text-center pt-12">No peer feedback yet. Be the first!</p>
                            )}
                         </div>
                    </Card>
                 </div>
                 {/* Right Column: Add Feedback */}
                 <div className="space-y-4">
                    <Card title="Add Your Feedback">
                         <form onSubmit={handleSubmit} className="p-4 space-y-4">
                             <div>
                                 <label className="block text-sm font-medium text-slate-300 mb-1">Clarity</label>
                                 <StarRating rating={clarityRating} setRating={setClarityRating} />
                                 <p className="text-xs text-slate-500 mt-1">How clear and easy to understand was the speaker?</p>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-300 mb-1">Engagement</label>
                                 <StarRating rating={engagementRating} setRating={setEngagementRating} />
                                 <p className="text-xs text-slate-500 mt-1">How engaging and confident did the speaker sound?</p>
                             </div>
                             <div>
                                 <label htmlFor="comment" className="block text-sm font-medium text-slate-300 mb-1">Constructive Comment</label>
                                 <textarea
                                    id="comment"
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Provide one piece of positive feedback and one suggestion for improvement."
                                    className="w-full h-32 p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 text-white"
                                    required
                                />
                             </div>
                             <button type="submit" disabled={isSubmitting} className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                         </form>
                     </Card>
                 </div>
            </div>
        </Modal>
    );
};


const PeerReviewSystem = () => {
    const [sessions, setSessions] = useState<PracticeSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<PracticeSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedSessions = await firebaseService.getPeerReviewSessions();
            setSessions(fetchedSessions);
        } catch (error) {
            console.error("Error fetching peer review sessions:", error);
            setError("Missing or insufficient permissions.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleAddFeedback = async (sessionId: string, newFeedback: Omit<PeerFeedback, 'id' | 'timestamp'>) => {
        const feedbackToAdd: PeerFeedback = {
            ...newFeedback,
            id: `feedback_${Date.now()}`,
            timestamp: Date.now(),
        };

        try {
            await firebaseService.addPeerReviewFeedback(sessionId, feedbackToAdd);
            const updatedSessions = sessions.map(s => {
                if (s.id === sessionId) {
                    return { ...s, peerReviews: [...s.peerReviews, feedbackToAdd] };
                }
                return s;
            });
            setSessions(updatedSessions);
            
            setTimeout(() => {
                setSelectedSession(null);
            }, 1500);
        } catch (error) {
            console.error("Error adding feedback:", error);
            alert("Failed to submit feedback.");
        }
    };

    return (
        <div className="p-4">
            <p className="text-sm text-slate-400 mb-4">Review anonymous practice sessions from your peers to help them improve. Remember to provide constructive and encouraging feedback.</p>
            {isLoading ? <Loader message="Loading sessions..." /> : error ? (
                <div className="text-center py-10 bg-slate-800/50 rounded-lg">
                    <h3 className="text-sm font-semibold text-red-400">Error</h3>
                    <p className="mt-1 text-sm text-slate-500">{error}</p>
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    <h3 className="mt-2 text-sm font-semibold text-slate-300">No Sessions Available for Review</h3>
                    <p className="mt-1 text-sm text-slate-500">Complete a practice session and share it to get started.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map(session => (
                        <div key={session.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-200">Anonymous Session</p>
                                <p className="text-xs text-slate-400">Submitted: {new Date(session.timestamp).toLocaleString()}</p>
                                <div className="flex justify-around text-center my-3 py-2 border-y border-slate-700">
                                    <div>
                                        <p className="text-xs text-slate-400">Score</p>
                                        <p className="font-bold text-cyan-400">{session.feedbackData.overallScore}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Pacing</p>
                                        <p className="font-bold text-cyan-400">{session.feedbackData.pacing.wpm} WPM</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Reviews</p>
                                        <p className="font-bold text-cyan-400">{session.peerReviews.length}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSession(session)}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded transition-colors text-sm"
                            >
                                Review Session
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {selectedSession && (
                <PeerReviewModal
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onSubmitFeedback={handleAddFeedback}
                />
            )}
        </div>
    );
};



export const ResourceLibrary: React.FC = () => {
    const [activeModal, setActiveModal] = useState<'checklist' | 'guide' | null>(null);

    return (
        <>
            <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-24">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-100">Resource Library</h2>
                    <p className="mt-2 text-lg text-slate-400">Supporting materials for your Technical English 2 course.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card title="Course References" color="blue">
                        <div className="p-4 space-y-3">
                            <a href="https://polycc.cidos.edu.my/" target="_blank" rel="noopener noreferrer" className="w-full text-left bg-white/50 hover:bg-white/70 text-blue-400 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 mr-3 flex-shrink-0 text-blue-400">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M15 3h6m0 0v6m0-6l-7.5 7.5" />
                                </svg>
                                Politeknik Malaysia CIDOS E-Learning Portal
                            </a>
                            <a href="https://www.toastmasters.org/resources/public-speaking-tips" target="_blank" rel="noopener noreferrer" className="w-full text-left bg-white/50 hover:bg-white/70 text-blue-400 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 mr-3 flex-shrink-0 text-blue-400">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M15 3h6m0 0v6m0-6l-7.5 7.5" />
                                </svg>
                                Toastmasters International: Public Speaking Tips
                            </a>
                            <a href="https://www.robertsrules.com/" target="_blank" rel="noopener noreferrer" className="w-full text-left bg-white/50 hover:bg-white/70 text-blue-400 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 mr-3 flex-shrink-0 text-blue-400">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M15 3h6m0 0v6m0-6l-7.5 7.5" />
                                </svg>
                                Robert's Rules of Order (Meeting Protocols)
                            </a>
                        </div>
                    </Card>

                    <Card title="Downloadable Templates" color="green">
                        <div className="p-4 space-y-3">
                            <button onClick={() => downloadTextFile(PRESENTATION_TEMPLATE, 'presentation-template.pptx')} className="w-full text-left bg-white/10 hover:bg-white/20 text-green-300 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center border border-green-700/50 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                Presentation Slide Template (.pptx)
                            </button>
                            <button onClick={() => downloadTextFile(MINUTES_TEMPLATE, 'meeting-minutes-template.docx')} className="w-full text-left bg-white/10 hover:bg-white/20 text-green-300 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center border border-green-700/50 shadow-sm">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                Meeting Minutes Template (.docx)
                            </button>
                            <button onClick={() => downloadTextFile(COMPLAINT_TEMPLATE, 'complaint-response-template.docx')} className="w-full text-left bg-white/10 hover:bg-white/20 text-green-300 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center border border-green-700/50 shadow-sm">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                Complaint Response Email Template (.docx)
                            </button>
                        </div>
                    </Card>
                </div>

                <Card title="Peer Review System" color="purple">
                    <PeerReviewSystem />
                </Card>

                <Card title="Quick Guides" color="orange">
                    <div className="p-4 flex flex-col md:flex-row gap-4">
                        <button onClick={() => setActiveModal('checklist')} className="flex-1 text-left bg-white/10 hover:bg-white/20 text-orange-300 font-semibold py-3 px-5 rounded-lg transition-colors text-lg border border-orange-700/50 shadow-sm">
                            Presentation Checklist
                        </button>
                        <button onClick={() => setActiveModal('guide')} className="flex-1 text-left bg-white/10 hover:bg-white/20 text-orange-300 font-semibold py-3 px-5 rounded-lg transition-colors text-lg border border-orange-700/50 shadow-sm">
                            L.A.S.T. Method Guide
                        </button>
                    </div>
                </Card>
            </div>
            <Modal isOpen={activeModal === 'checklist'} onClose={() => setActiveModal(null)} title="Presentation Preparation Checklist">
                <PresentationChecklistContent />
            </Modal>
            <Modal isOpen={activeModal === 'guide'} onClose={() => setActiveModal(null)} title="Guide: The L.A.S.T. Method for Handling Complaints">
                <LASTGuideContent />
            </Modal>
        </>
    );
};