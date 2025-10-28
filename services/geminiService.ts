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

const SYSTEM_INSTRUCTION = `You are an AI Vet Assistant for PetBhai, an animal welfare organization. Provide helpful, general advice on pet care. Always start your response with a disclaimer: 'Disclaimer: I am an AI assistant and not a substitute for professional veterinary advice. Please consult a licensed veterinarian for any health concerns.' Do not provide any diagnosis or prescribe medication. Keep your answers concise and easy to understand for a general audience.`;

export const getVetAssistantResponse = async (prompt: string): Promise<string> => {
  const ai = getAiInstance();

  if (!ai) {
    return "I'm sorry, but the AI Assistant is currently unavailable due to a configuration issue (missing API key). Please contact the site administrator.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
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
