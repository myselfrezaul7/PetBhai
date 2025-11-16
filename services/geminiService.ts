import { GoogleGenAI, Modality } from "@google/genai";

// Create a singleton instance of the AI client to avoid re-creating it on every call.
let aiInstance: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      console.error("API_KEY environment variable is not set.");
      throw new Error("AI service is not configured. Missing API key.");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
}

const SYSTEM_INSTRUCTION = `You are an AI Vet for PetBhai, an animal welfare organization. Provide helpful, general first-aid and pet care advice. Your role is to give safe, preliminary guidance. You are NOT a substitute for a professional veterinarian. Do not diagnose conditions or prescribe specific medications. Crucially, if a situation seems serious, you must strongly advise the user to consult a licensed, in-person veterinarian immediately. Keep your answers concise and easy for a non-medical person to understand. Format your responses using simple Markdown. Use asterisks for bullet points (e.g., * Item 1) and double asterisks for bolding important text (e.g., **Warning**).`;

export const getVetAssistantResponse = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error in getVetAssistantResponse:", error);
    if (error instanceof Error && error.message.includes("API key")) {
        return "I'm sorry, but the AI Assistant is currently unavailable due to a configuration issue. Please contact the site administrator.";
    }
    return "I'm sorry, but I'm having trouble connecting to my knowledge base right now. Please try again later.";
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    throw new Error("No image data found in the AI response.");
  } catch (error) {
    console.error("Error generating image from Gemini:", error);
    if (error instanceof Error && error.message.includes("API key")) {
        throw new Error("The image generator is unavailable due to a configuration issue.");
    }
    throw new Error("Failed to generate the image. Please try again later.");
  }
};
