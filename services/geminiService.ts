import { GoogleGenAI, Modality } from "@google/genai";
import { MOCK_PRODUCTS } from '../constants';

// Create a singleton instance of the AI client to avoid re-creating it on every call.
let aiInstance: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      console.error("API_KEY environment variable is not set.");
      throw new Error("AI service is not configured. Missing API key.");
    }
    try {
        aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI", e);
        throw new Error("Failed to initialize AI service.");
    }
  }
  return aiInstance;
}

// Generate a summary of the product catalog for the AI
const productCatalog = MOCK_PRODUCTS.map(p => 
    `- ${p.name} (${p.category}): ৳${p.price} [Rating: ${p.rating}/5]`
).join('\n');

const SYSTEM_INSTRUCTION = `You are an AI Vet for PetBhai, an animal welfare organization. Provide helpful, general first-aid and pet care advice. 
Your role is to give safe, preliminary guidance. You are NOT a substitute for a professional veterinarian. 
Do not diagnose conditions or prescribe specific medications. 
Crucially, if a situation seems serious, you must strongly advise the user to consult a licensed, in-person veterinarian immediately.

**Context-Aware Shop Assistant Rules:**
You have access to the shop's inventory below. 
If a user asks for recommendations (like food, toys, or supplies), ALWAYS check this list first.
If you find a matching product, enthusiastically suggest it and say "We have this in our shop!".
Mention the price in Taka (৳).
Inventory:
${productCatalog}

If the user needs something not on this list, you can suggest general types of products but clarify you don't sell them directly.
Keep your answers concise and easy for a non-medical person to understand. Format your responses using simple Markdown.
Use asterisks for bullet points (e.g., * Item 1) and double asterisks for bolding important text (e.g., **Warning**). If you use Google Search, cite your sources.`;

export const getVetAssistantResponse = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiInstance();
    // Upgraded to gemini-3-pro-preview for advanced reasoning capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Enabling thinking allows the model to reason about safety and medical nuance before answering
        thinkingConfig: { thinkingBudget: 2048 },
        // Enable Google Search to provide grounded, up-to-date information
        tools: [{ googleSearch: {} }] 
      },
    });

    let text = response.text || "I'm having trouble generating a response right now.";

    // Append grounding sources if available
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
        const sources = chunks
            .map((chunk: any) => chunk.web?.uri) // Extract URIs
            .filter((uri: string) => uri) // Filter undefined
            .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index); // Unique

        if (sources.length > 0) {
            text += "\n\n**Sources:**\n" + sources.map((url: string) => `* [${new URL(url).hostname}](${url})`).join("\n");
        }
    }

    return text;
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
    // Upgraded to gemini-3-pro-image-preview for high-quality visuals
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        // No responseModalities needed for this model when generating images via generateContent
        imageConfig: {
            aspectRatio: "16:9", // Optimized for blog post headers
            imageSize: "1K"
        }
      },
    });
    
    // Iterate through parts to find the image data
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
          }
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

export const generateVlogThumbnail = async (title: string, subject: string, mood: string): Promise<string> => {
    try {
        const ai = getAiInstance();
        // Using 'nano banana' (gemini-2.5-flash-image) as requested for fast, creative thumbnails
        const prompt = `Create a high-quality, eye-catching YouTube vlog thumbnail. 
        Title context: "${title}". 
        Subject: ${subject}. 
        Mood/Style: ${mood}. 
        The image should be 16:9, vibrant, high contrast, and look like a professional vlog thumbnail.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                }
            }
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:image/png;base64,${base64ImageBytes}`;
                }
            }
        }
        throw new Error("No image data found.");
    } catch (error) {
        console.error("Error generating thumbnail:", error);
        throw error;
    }
};

export const analyzeRescueImage = async (imageFile: File): Promise<{ type: string, condition: string }> => {
    try {
        const ai = getAiInstance();
        
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });
        
        // Remove data url prefix
        const base64String = base64Data.split(',')[1];
        const mimeType = imageFile.type;

        // Use gemini-3-pro-preview for multimodal analysis
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64String } },
                    { text: "Analyze this image of an animal. Return a JSON object with two fields: 'type' (e.g., Dog, Cat, Bird, Other) and 'condition' (a short, concise description of the animal's physical condition, injuries, or situation). JSON only." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                 // Low thinking budget for faster analysis as this is a simpler task
                thinkingConfig: { thinkingBudget: 1024 }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text);
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw error;
    }
}