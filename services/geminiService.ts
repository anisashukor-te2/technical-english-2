import { GoogleGenAI, Type } from "@google/genai";
import { FeedbackData, MinuteFeedbackData, ComplaintFeedbackData, PracticeSession } from '../types';

// FIX: Initialize the GoogleGenAI client at the module level.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a Gemini API error and throws a more user-friendly, actionable error message.
 * @param error The original error object from the catch block.
 * @param context A string describing the context of the API call (e.g., 'presentation feedback').
 */
const handleGeminiError = (error: any, context: string): never => {
    console.error(`Error during Gemini API call for ${context}:`, error);
    let message = `Failed to get feedback from the AI model for ${context}. Please try again.`;
    const errorMessage = error.toString().toLowerCase();

    if (errorMessage.includes('api key not valid') || errorMessage.includes('api_key')) {
        message = "Configuration Error: The Gemini API key is missing or invalid. Please ensure it is correctly configured in your project's environment variables.";
    } else if (errorMessage.includes('billing')) {
        message = "Configuration Error: Billing is not enabled for the associated Google Cloud project. The Gemini API requires a project with an active billing account.";
    } else if (errorMessage.includes('api is not enabled') || errorMessage.includes('service has been disabled')) {
        message = "Configuration Error: The 'generativelanguage.googleapis.com' API is not enabled on your Google Cloud project. Please visit your cloud console to enable it.";
    } else if (error.message && !error.message.includes('Failed to get feedback')) {
        message = error.message; // Use the specific error message if it's not the generic one we're replacing.
    }
    
    throw new Error(message);
};


const SCRIPT = `
Slide 1: Title Slide
"Good morning/afternoon, everyone. Today, I'll be walking you through the critical steps involved in designing a robust bolted joint assembly. This is a fundamental process in mechanical engineering, ensuring the reliability and safety of countless structures and machines."

Slide 2: Introduction to Bolted Joints
"Firstly, let's understand why bolted joints are so prevalent. They offer versatility, ease of assembly and disassembly, and adjustability. However, their design requires careful consideration to prevent failures such as shearing, bearing failure, and fatigue."

Slide 3: Step 1 - Define Design Requirements
"The initial phase involves thoroughly defining the design requirements. We must identify the magnitude and type of applied loads – whether tensile, shear, or combined. Next, the material properties of both the bolt and the connected members are determined, including yield strength and ultimate tensile strength. Environmental conditions, such as temperature and corrosion, also play a significant role. Finally, appropriate safety factors are selected based on industry standards and critical application."

Slide 4: Step 2 - Select Bolt Material and Size
"Following the requirements, the next step is to select the appropriate bolt material and size. High-strength steel bolts are commonly used for structural applications. The diameter of the bolt is initially estimated based on the applied shear load and the allowable shear stress of the bolt material. Subsequently, the number of bolts required is calculated to safely transmit the forces."

Slide 5: Step 3 - Determine Joint Geometry and Configuration
"With the bolt chosen, we proceed to determine the optimal joint geometry and configuration. This includes specifying the pitch, which is the center-to-center distance between adjacent bolts, and the edge distance, which is the distance from the center of a bolt to the nearest edge of the connected member. These dimensions are crucial for preventing tear-out and block shear failure."

Slide 6: Step 4 - Perform Stress Analysis and Verification
"The fourth step involves a comprehensive stress analysis. Bearing stress is calculated at the bolt holes, and tensile stress is checked in the connected members. Shear stress on the bolts is verified against the material's allowable limits. Furthermore, potential for fatigue failure is assessed if cyclic loading is present. Finite Element Analysis, or FEA, may be employed for complex geometries."

Slide 7: Step 5 - Design for Preload and Torque
"Crucially, for many applications, the bolts must be preloaded to a specific tension. This preload enhances the joint's resistance to slipping and fatigue. The required torque for achieving this preload is determined using empirical formulas or manufacturer specifications. Proper tightening procedures are then established to ensure uniform preload across all bolts."

Slide 8: Conclusion
"In summary, designing a bolted joint is a systematic process that commences with defining requirements, proceeds through material selection and geometry, includes rigorous stress analysis, and concludes with preload considerations. Adhering to these steps is essential for creating safe and reliable mechanical systems. Are there any questions?"
`;

const KEY_TECHNICAL_TERMS = [
    "bolted joint assembly", "mechanical engineering", "shearing", "bearing failure", "fatigue",
    "design requirements", "applied loads", "tensile", "shear", "material properties", "yield strength",
    "ultimate tensile strength", "safety factors", "bolt material", "allowable shear stress",
    "joint geometry", "pitch", "edge distance", "tear-out", "block shear failure", "stress analysis",
    "bearing stress", "tensile stress", "Finite Element Analysis", "FEA", "preload", "torque"
];

const MEETING_TRANSCRIPT_FOR_MINUTES = `
Project Manager (Tuan Ihsan): "Alright team, let's get started. The main topic today is the Q3 software release, codenamed 'Odyssey'. We've hit a potential roadblock. Lead Engineer, can you give us the status update?"

Lead Engineer (Iman): "Thanks, Tuan Ihsan. The core features are code-complete. However, during integration testing, we discovered a significant performance issue with the new data processing module. It's using about 50% more memory than projected, which could cause crashes on lower-spec client machines."

Product Manager (Sarah): "That's a major concern. What are our options? We can't delay the launch."

Iman: "I see two paths. Option A is a quick patch. We can optimize the memory allocation, which should bring usage down by about 20%. It's a 3-day effort but it's not a permanent fix. Option B is to refactor the module. It's a 2-week effort, but it would permanently solve the issue and make it more scalable."

Tuan Ihsan: "Two weeks would mean a delay. Sarah, what's the impact of launching with the patch?"

Sarah: "We could launch on time, but we'd need to clearly communicate the higher system requirements and have a hotfix plan ready. It's not ideal. The marketing campaign is already scheduled."

Tuan Ihsan: "Okay, tough call. Given the marketing commitment, a delay is the worse option. Let's make a decision. We will go with Option A, the 3-day patch. We need to accept the risk of higher memory usage for the initial launch."

Sarah: "Agreed. I'll need to prepare a communication for the support team."

Tuan Ihsan: "Perfect. So, let's define the action items. Iman, your team will start on the memory optimization patch immediately. What's the ETA?"

Iman: "We can have it ready for QA by end of day Wednesday."

Tuan Ihsan: "Great. Sarah, can you draft the internal communication for the support and sales teams regarding the updated system requirements? Please have that ready by tomorrow."

Sarah: "Will do."

Tuan Ihsan: "Excellent. That's all for today. Thanks, everyone."
`;
// FIX: Export transcript for minute taking practice
export const MINUTE_TAKING_TRANSCRIPT = MEETING_TRANSCRIPT_FOR_MINUTES;


// This Base64 audio was generated using the Gemini TTS API with the transcript above.
// Speakers were mapped as follows: Tuan Ihsan (Kore), Iman (Puck), Sarah (Zephyr).


// FIX: Add schema for FeedbackData to ensure structured JSON output from Gemini
const feedbackDataSchema = {
    type: Type.OBJECT,
    properties: {
        transcription: { type: Type.STRING, description: "Verbatim transcription of the user's speech." },
        overallScore: { type: Type.NUMBER, description: "A single, aggregated score from 0 to 100." },
        fillerWords: {
            type: Type.ARRAY,
            description: "A list of filler words and their counts.",
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    count: { type: Type.NUMBER },
                },
                required: ['word', 'count']
            }
        },
        keywordAnalysis: {
            type: Type.OBJECT,
            properties: {
                keywordsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
                keywordsMissed: { type: Type.ARRAY, items: { type: Type.STRING } },
                feedback: { type: Type.STRING },
            },
            required: ['keywordsFound', 'keywordsMissed', 'feedback']
        },
        languageFeedback: { type: Type.STRING, description: "Constructive feedback on language, formality, and clarity." },
        pacing: {
            type: Type.OBJECT,
            properties: {
                wpm: { type: Type.NUMBER },
                feedback: { type: Type.STRING },
            },
            required: ['wpm', 'feedback']
        },
        voiceModulation: {
            type: Type.OBJECT,
            properties: {
                feedback: { type: Type.STRING, description: "Analysis of vocal variety and suggestions for improvement." },
            },
            required: ['feedback']
        },
        sessionSummary: { type: Type.STRING, description: "A concise summary of the 2-3 most important feedback points." },
    },
    required: [
        "transcription",
        "overallScore",
        "fillerWords",
        "keywordAnalysis",
        "languageFeedback",
        "pacing",
        "voiceModulation",
        "sessionSummary"
    ]
};

// FIX: Add a helper function to encapsulate the Gemini API call for feedback.
const callGeminiWithFeedbackSchema = async (prompt: string, mediaPart: {inlineData: {data: string, mimeType: string}}): Promise<FeedbackData> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: { parts: [{ text: prompt }, mediaPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: feedbackDataSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as FeedbackData;
    } catch (error) {
        // FIX: The function must return a value on all code paths. Re-throwing the error ensures the promise is rejected.
        return handleGeminiError(error, 'presentation feedback');
    }
};


// FIX: Export the function and wrap the prompt in a template literal string.
export const getPresentationFeedback = async (audioBase64: string, mimeType: string, durationInSeconds: number): Promise<FeedbackData> => {
    const audioPart = {
        inlineData: { data: audioBase64, mimeType: mimeType },
    };

    const prompt = `
    You are an expert AI coach for technical presentations. A student is practicing a presentation for their "Technical English 2" course.
    Their script is provided below. I have also provided a video file of their practice session containing their audio. The media is ${durationInSeconds} seconds long.

    Your task is to analyze the audio from the provided video file:
    1.  Transcribe the audio VERBATIM.
    2.  Compare the transcription to the official script to analyze keyword usage. The key technical terms are provided below.
    3.  Calculate their pacing (Words Per Minute). A good pace is between 140-160 WPM.
    4.  Count the usage of common filler words (e.g., um, uh, ah, like, you know, right, so).
    5.  Provide constructive feedback on their language use (grammar, clarity, formality) based on the transcription.
    6.  Analyze their voice modulation (vocal variety, tone, confidence) based on the audio.
    7.  Provide a concise session summary highlighting the 2-3 most important feedback points.
    8.  Calculate an overall score out of 100, aggregating all factors (pacing, keyword usage, clarity, filler words, etc.).

    Return the analysis in a structured JSON format that strictly adheres to the provided schema. Do not include any text outside of the JSON object.

    --- SCRIPT START ---
    ${SCRIPT}
    --- SCRIPT END ---

    --- KEY TECHNICAL TERMS ---
    ${KEY_TECHNICAL_TERMS.join(", ")}
    --- END KEY TECHNICAL TERMS ---
    `;

    return await callGeminiWithFeedbackSchema(prompt, audioPart);
};

// FIX: Add and export getFreePracticeFeedback function
export const getFreePracticeFeedback = async (audioBase64: string, mimeType: string, durationInSeconds: number, userScript: string): Promise<FeedbackData> => {
    const audioPart = {
        inlineData: { data: audioBase64, mimeType: mimeType },
    };

    const prompt = `
    You are an expert AI coach for technical presentations. A student is practicing a presentation for their "Technical English 2" course using their own custom script.
    Their provided script is:
    --- SCRIPT START ---
    ${userScript}
    --- SCRIPT END ---

    I have provided a video file of their practice session containing their audio. The media is ${durationInSeconds} seconds long.

    Please analyze the student's performance based ONLY on the audio from the provided video and their script.

    Your task is to:
    1.  Transcribe the audio VERBATIM.
    2.  Compare the transcription to their provided script to analyze keyword usage. Identify key technical terms from their script and check if they were spoken.
    3.  Calculate their pacing (Words Per Minute). A good pace is between 140-160 WPM.
    4.  Count the usage of common filler words (e.g., um, uh, ah, like, you know, right, so).
    5.  Provide constructive feedback on their language use, clarity, and grammar.
    6.  Analyze their voice modulation (vocal variety, tone, confidence).
    7.  Provide a concise session summary highlighting the 2-3 most important feedback points.
    8.  Calculate an overall score out of 100, aggregating all factors.

    Return the analysis in a structured JSON format that strictly adheres to the provided schema. Do not include any text outside of the JSON object.
    `;

    return await callGeminiWithFeedbackSchema(prompt, audioPart);
};


// FIX: Add schema, model answer, and function for minute taking feedback
const minuteFeedbackDataSchema = {
    type: Type.OBJECT,
    properties: {
        accuracyScore: { type: Type.NUMBER, description: "Score from 0-100 based on how well the user's minutes captured the key points from the model answer." },
        capturedCorrectly: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of key decisions or action items the user correctly identified." },
        missedItems: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of key decisions or action items the user missed." },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific suggestions for improving the minutes (e.g., clarity, formatting, conciseness)." },
        summary: { type: Type.STRING, description: "A one or two-sentence summary of the feedback." }
    },
    required: ["accuracyScore", "capturedCorrectly", "missedItems", "suggestions", "summary"]
};

export const MINUTE_TAKING_MODEL_ANSWER = `**Meeting Minutes**

**Date:** [Current Date]
**Topic:** Q3 Software Release 'Odyssey' - Performance Issue

**Attendees:**
- Tuan Ihsan (Project Manager)
- Iman (Lead Engineer)
- Sarah (Product Manager)

**Key Discussion Points:**
1.  A significant performance issue was found in the new data processing module during integration testing.
2.  The module is using 50% more memory than projected, risking crashes on client machines.
3.  Two options were proposed by Iman:
    - **Option A:** A 3-day quick patch to optimize memory, reducing usage by ~20%. Not a permanent fix.
    - **Option B:** A 2-week refactor of the module to permanently solve the issue.

**Decisions Made:**
- The team has decided to proceed with **Option A (3-day patch)**.
- This decision was made to avoid delaying the Q3 launch, which has a marketing campaign already scheduled.
- The team accepts the risk of higher memory usage for the initial launch.

**Action Items:**
| Action                                                                   | Owner | Due Date           |
|--------------------------------------------------------------------------|-------|--------------------|
| Begin work on the memory optimization patch.                             | Iman  | End of day Wednesday |
| Draft internal communication for support/sales on system requirements.   | Sarah | Tomorrow           |
`;

export const getMinuteTakingFeedback = async (userMinutes: string): Promise<MinuteFeedbackData> => {
    const modelAnswer = MINUTE_TAKING_MODEL_ANSWER;
    const prompt = `
    You are an AI assistant evaluating a student's ability to take meeting minutes.
    I will provide you with the student's minutes and a model answer based on a meeting transcript.

    Your task is to compare the student's minutes to the model answer and provide feedback.
    - Analyze if the student captured the key decisions.
    - Analyze if the student captured the main action items, who is responsible, and the deadlines.
    - Evaluate the clarity, conciseness, and professionalism of their writing.
    - Provide an overall accuracy score from 0-100.
    - List what they captured correctly and what they missed.
    - Provide specific suggestions for improvement.

    Here is the student's submission:
    --- STUDENT MINUTES ---
    ${userMinutes}
    --- END STUDENT MINUTES ---

    Here is the model answer for comparison:
    --- MODEL ANSWER ---
    ${modelAnswer}
    --- END MODEL ANSWER ---

    Return your analysis in a structured JSON format that strictly adheres to the provided schema. Do not include any text outside of the JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: { parts: [{text: prompt}] },
            config: {
                responseMimeType: "application/json",
                responseSchema: minuteFeedbackDataSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as MinuteFeedbackData;
    } catch (error) {
        return handleGeminiError(error, 'minute-taking feedback');
    }
};

// FIX: Add schema, scenario, and function for complaint handling email feedback
export const COMPLAINT_EMAIL_SCENARIO = `You are a Project Engineer at a tech firm. A client, Mr. Ahmad, has sent an email complaining about a prototype your team delivered.

Client's Complaint:
"Hi, we received prototype #P-78B yesterday. I'm concerned. The performance is not meeting the specs we agreed upon in the contract (specifically, the processing speed is about 20% slower than the 500ms target). Furthermore, the casing feels fragile and less durable than expected. We have an important stakeholder demo next week, and I'm worried this reflects poorly on the project's progress. Please advise on how you plan to rectify this immediately."

Your Task:
Write a professional email response to Mr. Ahmad. Use the L.A.S.T. method (Listen, Acknowledge/Apologize, Solve, Thank) to structure your reply. Address both of his concerns (performance and build quality) and propose a clear path forward.
`;

const complaintFeedbackDataSchema = {
    type: Type.OBJECT,
    properties: {
        toneScore: { type: Type.NUMBER, description: "Score from 0-100 on the professionalism and empathy of the email's tone." },
        clarityScore: { type: Type.NUMBER, description: "Score from 0-100 on how clear and actionable the proposed solution is." },
        lastMethodAdherence: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of points analyzing how well the email adheres to the L.A.S.T. method (Listen, Acknowledge, Solve, Thank)." },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific suggestions for improving the email." },
        summary: { type: Type.STRING, description: "A one or two-sentence summary of the feedback." }
    },
    required: ["toneScore", "clarityScore", "lastMethodAdherence", "suggestions", "summary"]
};

export const getComplaintEmailFeedback = async (userEmail: string): Promise<ComplaintFeedbackData> => {
    const prompt = `
    You are an AI assistant evaluating a student's professional email writing skills.
    The student was asked to respond to a client complaint based on a specific scenario.

    Scenario: A client is unhappy with a prototype's slow performance and fragile build quality.
    The student should use the L.A.S.T. (Listen, Acknowledge/Apologize, Solve, Thank) method.

    Here is the student's email:
    --- STUDENT EMAIL ---
    ${userEmail}
    --- END STUDENT EMAIL ---

    Your task is to analyze the email and provide feedback.
    1.  **Tone Score (0-100):** How professional, empathetic, and reassuring is the tone?
    2.  **Clarity Score (0-100):** How clear, specific, and actionable is the proposed solution?
    3.  **L.A.S.T. Method Adherence:** Provide a list of bullet points analyzing if the student successfully applied each step of the L.A.S.T. method.
    4.  **Suggestions:** Provide a list of specific, actionable suggestions for improvement.
    5.  **Summary:** A 1-2 sentence summary of the main feedback points.

    Return your analysis in a structured JSON format that strictly adheres to the provided schema. Do not include any text outside of the JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: { parts: [{text: prompt}] },
            config: {
                responseMimeType: "application/json",
                responseSchema: complaintFeedbackDataSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ComplaintFeedbackData;
    } catch (error) {
        return handleGeminiError(error, 'complaint email feedback');
    }
};


// FIX: Add and export function to generate custom complaint starter script
export const generateComplaintStarterScript = async (customScenario: string): Promise<{ starterScript: string; aiRole: string; aiPersona: string; }> => {
    const prompt = `
    A user wants to practice handling a complaint. They have provided a custom scenario.
    Based on their scenario, generate a starter script for an AI to begin the conversation.
    The AI will be playing the role of the complainer.

    User's Scenario: "${customScenario}"

    Your task is to:
    1.  Determine the most logical role for the AI to play (e.g., "Angry Customer", "Disappointed Client", "Frustrated Colleague").
    2.  Create a brief, one-sentence persona for the AI that captures their emotional state and goal.
    3.  Write a single, direct sentence that the AI will use to start the conversation, clearly stating their complaint.

    Return the response as a JSON object with three keys: "starterScript", "aiRole", and "aiPersona".
    Example:
    {
      "starterScript": "I was told this part would be delivered on Monday, and it's already Wednesday. This is completely unacceptable.",
      "aiRole": "Angry Customer",
      "aiPersona": "You are angry about a late delivery and want an immediate explanation."
    }
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            starterScript: { type: Type.STRING },
            aiRole: { type: Type.STRING },
            aiPersona: { type: Type.STRING },
        },
        required: ["starterScript", "aiRole", "aiPersona"]
    };
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{text: prompt}] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        return handleGeminiError(error, 'generating custom complaint script');
    }
};