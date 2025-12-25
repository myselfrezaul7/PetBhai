import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { MOCK_PRODUCTS } from '../data/mockData';

const router = express.Router();

// Initialize Gemini AI
const getAiInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY environment variable is not set.');
  }
  return new GoogleGenAI({ apiKey });
};

// Generate a summary of the product catalog for the AI
const productCatalog = MOCK_PRODUCTS.map(
  (p) => `- ${p.name} (${p.category}): ৳${p.price} [Rating: ${p.rating}/5]`
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

// Chat Endpoint
router.post('/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-thinking-exp', // Using a strong model for reasoning
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 2048 },
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text || "I'm having trouble generating a response right now.";

    // Append grounding sources if available
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = response.candidates[0].groundingMetadata.groundingChunks;
      const sources = chunks
        .map((chunk: any) => chunk.web?.uri)
        .filter((uri: string) => uri)
        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);

      if (sources.length > 0) {
        text +=
          '\n\n**Sources:**\n' +
          sources.map((url: string) => `* [${new URL(url).hostname}](${url})`).join('\n');
      }
    }

    res.json({ text });
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ error: error.message || 'Failed to generate response' });
  }
});

// Image Generation Endpoint
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Using flash for images as per original code (or similar)
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '1K',
        },
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const base64ImageBytes = part.inlineData.data;
          return res.json({ imageUrl: `data:image/png;base64,${base64ImageBytes}` });
        }
      }
    }

    res.status(500).json({ error: 'No image data found in response' });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// Thumbnail Generation Endpoint
router.post('/generate-thumbnail', async (req, res) => {
  try {
    const { title, subject, mood } = req.body;
    if (!title || !subject || !mood) {
      return res.status(400).json({ error: 'Title, subject, and mood are required' });
    }

    const ai = getAiInstance();
    const prompt = `Create a high-quality, eye-catching YouTube vlog thumbnail. 
        Title context: "${title}". 
        Subject: ${subject}. 
        Mood/Style: ${mood}. 
        The image should be 16:9, vibrant, high contrast, and look like a professional vlog thumbnail.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '16:9',
        },
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const base64ImageBytes = part.inlineData.data;
          return res.json({ imageUrl: `data:image/png;base64,${base64ImageBytes}` });
        }
      }
    }

    res.status(500).json({ error: 'No image data found' });
  } catch (error: any) {
    console.error('Error generating thumbnail:', error);
    res.status(500).json({ error: error.message || 'Failed to generate thumbnail' });
  }
});

// Image Analysis Endpoint
router.post('/analyze-image', async (req, res) => {
  try {
    const { mimeType, data } = req.body;
    if (!mimeType || !data) {
      return res.status(400).json({ error: 'Image data (mimeType and base64 data) is required' });
    }

    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-thinking-exp',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          {
            text: "Analyze this image of an animal. Return a JSON object with two fields: 'type' (e.g., Dog, Cat, Bird, Other) and 'condition' (a short, concise description of the animal's physical condition, injuries, or situation). JSON only.",
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse JSON from the response text
    try {
      // Sometimes the model might wrap JSON in markdown code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      const result = JSON.parse(jsonString);
      res.json(result);
    } catch (e) {
      console.error('Failed to parse JSON from AI response:', text);
      res.status(500).json({ error: 'Failed to parse AI response', rawResponse: text });
    }
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze image' });
  }
});

export default router;
