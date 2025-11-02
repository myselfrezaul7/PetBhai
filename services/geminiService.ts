import { GoogleGenAI } from "@google/genai";

// Create a singleton instance of the AI client to avoid re-creating it on every call.
let aiInstance: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI | null {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      console.error("API_KEY environment variable is not set. AI functionality will be disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
}

const SYSTEM_INSTRUCTION = `You are an AI Vet for PetBhai, an animal welfare organization. Provide helpful, general first-aid and pet care advice. Your role is to give safe, preliminary guidance. You are NOT a substitute for a professional veterinarian. Do not diagnose conditions or prescribe specific medications. Crucially, if a situation seems serious, you must strongly advise the user to consult a licensed, in-person veterinarian immediately. Keep your answers concise and easy for a non-medical person to understand. Format your responses using simple Markdown. Use asterisks for bullet points (e.g., * Item 1) and double asterisks for bolding important text (e.g., **Warning**).`;

export const getVetAssistantResponse = async (prompt: string): Promise<string> => {
  const ai = getAiInstance();

  if (!ai) {
    return "I'm sorry, but the AI Assistant is currently unavailable due to a configuration issue (missing API key). Please contact the site administrator.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    return "I'm sorry, but I'm having trouble connecting to my knowledge base right now. Please try again later.";
  }
};