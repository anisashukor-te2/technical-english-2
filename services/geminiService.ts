

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

// This Base64 audio was generated using the Gemini TTS API with the transcript above.
// Speakers were mapped as follows: Tuan Ihsan (Kore), Iman (Puck), Sarah (Zephyr).
const MEETING_AUDIO_BASE_64_PLACEHOLDER = `SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq-AwhL/s0Pl+XPAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-AwhL/tAwl/0LAmrwAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-AwhL/s0Pl+XPAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-AwhL+O+Wc8AAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-AwhL/LgB6RWFqdzQAAAVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-AQAAAAAAAAYAAAOmAQADdAOAAAAEAAAA//8A/y4AekViYXN6NAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-AQAAAAAAAAYAAAOmAQADdAOAAAAEAAAA//8A/y4AekViYXN6NAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-AQAAAAAAAAYAAAOmAQADdAOAAAAEAAAA//8A/y4AekViYXN6NAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`;


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
        handleGeminiError(error, 'presentation feedback');
    }
};


// FIX: Export the function and wrap the prompt in a template literal string.
export const getPresentationFeedback = async (audioBase64: string, mimeType: string, durationInSeconds: number): Promise<FeedbackData> => {
    const audioPart = {
        inlineData: { data: audioBase64, mimeType: mimeType },
    };

    const prompt = `
    You are an expert AI coach for technical presentations. A student is practicing a presentation for their "Technical English 2" course.
    Their goal is to practice effective oral presentation skills in the context of process, procedure, and instruction in workplace situations.

    Here is the reference script they were supposed to follow:
    --- SCRIPT START ---
    ${SCRIPT}
    --- SCRIPT END ---

    Here is a list of key technical terms to listen for: ${KEY_TECHNICAL_TERMS.join(', ')}.
    
    The provided audio recording is ${durationInSeconds.toFixed(1)} seconds long.

    Please analyze the user's audio recording and provide feedback. Your analysis must include the following, formatted according to the provided JSON schema:
    1.  **Transcription**: Transcribe the user's speech verbatim.
    2.  **Filler Words**: Identify common filler words (like "um", "uh", "ah", "like", "you know", "so", "basically") and count their occurrences.
    3.  **Pacing**: Calculate the words per minute (WPM) based on your transcription and the audio duration (${durationInSeconds.toFixed(1)} seconds). Provide brief feedback on the pace (e.g., "Your pace is great," "You might be speaking a bit too quickly," etc.). A good pace is typically between 140-160 WPM.
    4.  **Keyword Analysis**: Compare the transcribed text to the list of key technical terms. List which keywords were successfully used and which were missed. Provide brief feedback.
    5.  **Language Appropriateness**: Provide constructive feedback on the user's language. Focus on formality, technical accuracy, and clarity. Suggest more precise terms or better phrasing if applicable. Be encouraging. Also, incorporate feedback on filler words here. Based on the total count from your 'fillerWords' analysis: if the total count is 5 or more, add a direct suggestion like 'You used filler words like 'um' and 'ah' frequently. Try pausing silently instead to gather your thoughts.' If the total count is less than 5, acknowledge the low count with positive feedback like 'Great job keeping filler words to a minimum!'
    6.  **Overall Score**: Provide a single, aggregated score from 0 to 100. This score should be a holistic evaluation based on all the factors you've analyzed: pacing (ideal is 140-160 WPM), minimal filler words, effective use of keywords (high found, low missed), and appropriate, clear language. A high score represents a well-delivered, technically sound presentation.
    7.  **Voice Modulation**: Analyze the user's vocal variety from the audio. Was the delivery monotone or engaging? Identify areas where varying pitch and tone could have made key points more impactful. Provide specific, constructive suggestions for improvement.
    8.  **Session Summary**: Based on all your analysis, create a concise summary of the 2-3 most important feedback points. Format this as a single string with bullet points starting with a hyphen. Highlight one key strength and one main area for improvement.
    `;
    
    return callGeminiWithFeedbackSchema(prompt, audioPart);
};


export const getFreePracticeFeedback = async (recordingBase64: string, mimeType: string, durationInSeconds: number, userScript: string): Promise<FeedbackData> => {
     const mediaPart = {
        inlineData: { data: recordingBase64, mimeType: mimeType },
    };

    const prompt = `
    You are an expert AI coach for technical presentations. A student is practicing their own custom presentation for their "Technical English 2" course.
    Their goal is to practice effective oral presentation skills. The provided media is an audio recording of their presentation. You must analyze this audio recording.

    Here is the custom script the user prepared for their presentation:
    --- SCRIPT START ---
    ${userScript}
    --- SCRIPT END ---
    
    The provided audio recording is ${durationInSeconds.toFixed(1)} seconds long.

    Please analyze the user's audio recording and provide feedback. Your analysis must include the following, formatted according to the provided JSON schema:
    1.  **Transcription**: Transcribe the user's speech verbatim from the audio track.
    2.  **Filler Words**: Identify common filler words (like "um", "uh", "ah", "like", "you know", "so", "basically") and count their occurrences.
    3.  **Pacing**: Calculate the words per minute (WPM) based on your transcription and the recording duration (${durationInSeconds.toFixed(1)} seconds). Provide brief feedback on the pace (e.g., "Your pace is great," "You might be speaking a bit too quickly," etc.). A good pace is typically between 140-160 WPM.
    4.  **Keyword Analysis**: First, identify the most important technical keywords and concepts from the user's provided script. Then, compare the transcribed text to the list of keywords you identified. List which keywords were successfully used and which were missed. Provide brief feedback on how well they covered their own key points.
    5.  **Language Appropriateness**: Provide constructive feedback on the user's language. Focus on formality, technical accuracy, and clarity based on their provided script. Suggest more precise terms or better phrasing if applicable. Be encouraging.
    6.  **Overall Score**: Provide a single, aggregated score from 0 to 100. This score should be a holistic evaluation based on all the factors you've analyzed: pacing (ideal is 140-160 WPM), minimal filler words, effective use of keywords from their script, and appropriate, clear language. A high score represents a well-delivered, technically sound presentation.
    7.  **Voice Modulation**: Analyze the user's vocal variety from the audio track. Was the delivery monotone or engaging? Identify areas where varying pitch and tone could have made their key points more impactful. Provide specific, constructive suggestions for improvement.
    8.  **Session Summary**: Based on all your analysis, create a concise summary of the 2-3 most important feedback points. Format this as a single string with bullet points starting with a hyphen. Highlight one key strength and one main area for improvement.
    `;

    return callGeminiWithFeedbackSchema(prompt, mediaPart);
};

// FIX: Define a model answer for the minute-taking practice.
const MODEL_MINUTES = `
Meeting Title: Q3 Software Release 'Odyssey' - Roadblock Discussion
Date: [Today's Date]

Attendees:
- Tuan Ihsan (Project Manager)
- Iman (Lead Engineer)
- Sarah (Product Manager)

Decisions:
1.  The team will proceed with Option A: a 3-day memory optimization patch for the data processing module, despite it not being a permanent fix. This decision was made to avoid delaying the Q3 launch, which has a marketing campaign commitment.

Action Items:
| Action Item                                                                   | Owner | Due Date           |
|-------------------------------------------------------------------------------|-------|--------------------|
| 1. Implement the memory optimization patch to reduce memory usage by ~20%.    | Iman  | End of Day, Wednesday |
| 2. Draft internal communication for support/sales on updated system requirements. | Sarah | Tomorrow           |
`;

export const getMinuteTakingFeedback = async (userMinutes: string): Promise<MinuteFeedbackData> => {
    const minuteFeedbackSchema = {
        type: Type.OBJECT,
        properties: {
            accuracyScore: { type: Type.NUMBER, description: "A score from 0 to 100 on how well the user captured the key points compared to the model answer." },
            capturedCorrectly: {
                type: Type.ARRAY,
                description: "A list of key decisions or action items the user correctly identified.",
                items: { type: Type.STRING }
            },
            missedItems: {
                type: Type.ARRAY,
                description: "A list of crucial decisions or action items from the model answer that the user missed.",
                items: { type: Type.STRING }
            },
            suggestions: {
                type: Type.ARRAY,
                description: "A list of actionable suggestions for improvement, focusing on clarity, conciseness, and formatting.",
                items: { type: Type.STRING }
            },
            summary: {
                type: Type.STRING,
                description: "A concise summary of the feedback in 2-3 bullet points, starting each with a hyphen '-'. Highlight the user's accuracy and the most important suggestion. For example: '- Good job capturing the main decision. - Remember to use a table for action items to improve clarity.'"
            }
        },
        required: ["accuracyScore", "capturedCorrectly", "missedItems", "suggestions", "summary"]
    };

    const prompt = `
    You are an expert professional communication coach. A user is practicing taking meeting minutes.
    You will be provided with the full meeting transcript, the user's attempt at writing the minutes, and an ideal 'model answer'.

    Your task is to compare the user's minutes to the model answer, using the full transcript for context. Analyze how well they captured the critical information.

    **Full Meeting Transcript:**
    ---
    ${MEETING_TRANSCRIPT_FOR_MINUTES}
    ---

    **Model Answer (Ideal Minutes):**
    ---
    ${MODEL_MINUTES}
    ---

    **User's Attempt:**
    ---
    ${userMinutes}
    ---

    Please provide your feedback in the specified JSON format.
    - **accuracyScore**: Score from 0-100 based on how well they identified the decisions and action items from the model answer.
    - **capturedCorrectly**: List the specific decisions or action items they got right.
    - **missedItems**: List the key decisions or action items from the model answer that are missing from the user's attempt.
    - **suggestions**: Provide 2-3 constructive tips for improvement (e.g., "Consider using a table for action items to clearly assign owners and due dates," or "Try to summarize discussion points more concisely.").
    - **summary**: Create a 2-bullet point summary of the feedback. One bullet for what they did well, and one for the most important area of improvement.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: minuteFeedbackSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as MinuteFeedbackData;
    } catch (error) {
        handleGeminiError(error, 'minute-taking feedback');
    }
};

// FIX: Define the scenario as a const string.
const COMPLAINT_SCENARIO_FOR_EMAIL_PRACTICE = `A client is upset because a project deliverable was a day late and didn't meet one of the key specifications. They are threatening to cancel the contract.`;

export const getComplaintEmailFeedback = async (userEmail: string): Promise<ComplaintFeedbackData> => {
    const complaintFeedbackSchema = {
        type: Type.OBJECT,
        properties: {
            toneScore: { type: Type.NUMBER, description: "A score from 0-100 on how professional and empathetic the email's tone is." },
            clarityScore: { type: Type.NUMBER, description: "A score from 0-100 on how clear and actionable the proposed solution is." },
            lastMethodAdherence: {
                type: Type.ARRAY,
                description: "A list of strings analyzing how well the email follows each step of the L.A.S.T. method (Listen, Acknowledge/Apologize, Solve, Thank). For each step, state whether it was met and provide a brief justification.",
                items: { type: Type.STRING }
            },
            suggestions: {
                type: Type.ARRAY,
                description: "A list of 2-3 specific, actionable suggestions for improving the email.",
                items: { type: Type.STRING }
            },
            summary: {
                type: Type.STRING,
                description: "A concise summary of the feedback in 2-3 bullet points, starting each with a hyphen '-'. Highlight the email's tone and the most important suggestion for improvement based on the L.A.S.T. method. For example: '- Great empathetic tone. - Ensure your 'Solve' step proposes a more concrete action.'"
            }
        },
        required: ["toneScore", "clarityScore", "lastMethodAdherence", "suggestions", "summary"]
    };

    const prompt = `
    You are an expert communication coach. A user is practicing writing a professional email to handle a complaint.

    **The Scenario:**
    ---
    ${COMPLAINT_SCENARIO_FOR_EMAIL_PRACTICE}
    ---

    **The User's Email Draft:**
    ---
    ${userEmail}
    ---

    Your task is to analyze the user's email based on the L.A.S.T. method (Listen, Acknowledge/Apologize, Solve, Thank) and provide feedback in the specified JSON format.

    - **toneScore**: How well does the email balance professionalism and empathy? Is it defensive or reassuring?
    - **clarityScore**: How clear and easy to understand is the proposed solution? Is it a concrete step or vague promise?
    - **lastMethodAdherence**: For each of the 4 steps of L.A.S.T., state if the user's email successfully implemented it and briefly explain why. For example: "Listen: Success - The email correctly identifies that the deliverable was late and incorrect." or "Apologize: Partial - An apology was given, but it sounded a bit generic."
    - **suggestions**: Provide 2-3 constructive tips. For example, "Try to state the apology earlier in the email for greater impact." or "The proposed solution could be more specific about the timeline for the fix."
    - **summary**: Create a 2-bullet point summary of the feedback. One bullet point on the email's tone/clarity, and one on the most important area for improvement related to the L.A.S.T. method.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: complaintFeedbackSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ComplaintFeedbackData;
    } catch (error) {
        handleGeminiError(error, 'complaint email feedback');
    }
};


export const generateComplaintStarterScript = async (userScenario: string): Promise<{ aiRole: string; aiPersona: string; starterScript: string; }> => {
    const scriptGenerationSchema = {
        type: Type.OBJECT,
        properties: {
            aiRole: { type: Type.STRING, description: "A concise, professional role title for the AI who is making the complaint (e.g., 'Concerned Client', 'Frustrated Team Member')." },
            aiPersona: { type: Type.STRING, description: "A brief persona for this role describing their emotional state, main concern, and what they want." },
            starterScript: { type: Type.STRING, description: "A single, powerful opening sentence the AI would use to state their complaint and start the simulation." }
        },
        required: ["aiRole", "aiPersona", "starterScript"]
    };
    
    const prompt = `
        You are an AI assistant for a professional communication training app. A mechanical engineering student has described a complaint scenario they want to practice.
        
        **User's Scenario:** "${userScenario}"

        Your tasks are:
        1.  **Infer AI Role**: Based on the scenario, what is a concise, professional role for the person MAKING the complaint? (e.g., "Upset Client", "Concerned Team Member", "Disappointed Project Stakeholder").
        2.  **Create AI Persona**: Write a brief persona for this role. It should describe their emotional state, their main concern, and what they hope to achieve.
        3.  **Write Starter Script**: Write a single, powerful opening sentence that this person would use to start the conversation and state their complaint. This will be the first thing the AI says in the simulation.

        Provide your response in the specified JSON format.
    `;
    
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: scriptGenerationSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        handleGeminiError(error, 'complaint script generation');
    }
}

export const getSubmissionTrends = async (sessions: PracticeSession[]): Promise<string> => {
    if (sessions.length === 0) {
        return "No submission data available to analyze.";
    }

    // Extract relevant data points for analysis
    const analysisData = sessions.map(s => ({
        score: s.feedbackData.overallScore,
        wpm: s.feedbackData.pacing.wpm,
        fillerWords: s.feedbackData.fillerWords.map(fw => fw.word).join(', '),
        missedKeywords: s.feedbackData.keywordAnalysis.keywordsMissed.join(', '),
        summary: s.feedbackData.sessionSummary,
    }));

    const prompt = `
    You are an expert educational analyst for a technical presentation coaching app.
    I will provide you with a summary of the last ${analysisData.length} student submissions.
    Your task is to identify 2-3 of the most common, actionable trends or areas where students are struggling.
    Provide your output as a single string containing a bulleted list. Each bullet point should start with a hyphen '-'.
    Be concise and focus on insights that a lecturer can use to help their class.

    Example Output:
    - Many students are speaking too quickly, with average pacing well above the ideal 160 WPM.
    - The filler words 'um' and 'ah' are very common across most submissions, indicating a need to practice pausing.
    - Several students are forgetting to cover key technical terms like 'preload' and 'torque' in the final stages of the presentation.

    Here is the submission data:
    ---
    ${JSON.stringify(analysisData, null, 2)}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        handleGeminiError(error, 'submission trend analysis');
    }
};


// Expose constants for use in the UI
export const MINUTE_TAKING_TRANSCRIPT = MEETING_TRANSCRIPT_FOR_MINUTES;
export const MINUTE_TAKING_MODEL_ANSWER = MODEL_MINUTES;
export const COMPLAINT_EMAIL_SCENARIO = COMPLAINT_SCENARIO_FOR_EMAIL_PRACTICE;
export const MEETING_AUDIO_BASE64 = MEETING_AUDIO_BASE_64_PLACEHOLDER;