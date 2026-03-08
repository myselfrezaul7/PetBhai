import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Async error wrapper to catch unhandled promise rejections
const asyncHandler =
  (fn: express.RequestHandler): express.RequestHandler =>
    (req, res, next) =>
      Promise.resolve(fn(req, res, next)).catch((error) => {
        console.error('AI Route Error:', error);
        // Don't crash - return a friendly error
        if (!res.headersSent) {
          res.status(500).json({
            error: 'AI service temporarily unavailable',
            message:
              process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
          });
        }
      });

// Initialize Gemini AI with error handling
const getAiInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    console.warn('GEMINI_API_KEY not configured - AI features will be unavailable');
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Generate dynamic system instruction with up-to-date inventory
const getSystemInstruction = () => {
  const products = db.products || [];
  const productCatalog = products
    .map((p) => `- ${p.name} (${p.category}): ৳${p.price} [Rating: ${p.rating}/5]`)
    .join('\n');

  return `You are an AI Vet for PetBhai, an animal welfare organization. Provide helpful, general first-aid and pet care advice. 
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
};

// Chat Endpoint
router.post(
  '/chat',
  aiLimiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    const sanitizedPrompt = prompt.trim();
    if (sanitizedPrompt.length === 0) {
      return res.status(400).json({ error: 'Prompt cannot be empty' });
    }

    if (sanitizedPrompt.length > 10000) {
      return res.status(400).json({ error: 'Prompt is too long. Maximum 10000 characters.' });
    }

    const ai = getAiInstance();
    if (!ai) {
      return res.status(503).json({
        error: 'AI service not configured',
        text: 'The AI assistant is currently unavailable. Please contact support or try again later.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-thinking-exp', // Using a strong model for reasoning
      contents: [{ parts: [{ text: sanitizedPrompt }] }],
      config: {
        systemInstruction: getSystemInstruction(),
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
        .filter(
          (uri: string | undefined): uri is string => typeof uri === 'string' && uri.length > 0
        )
        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);

      if (sources.length > 0) {
        text +=
          '\n\n**Sources:**\n' +
          sources
            .map((url: string) => {
              try {
                return `* [${new URL(url).hostname}](${url})`;
              } catch {
                return `* ${url}`;
              }
            })
            .join('\n');
      }
    }

    res.json({ text });
  })
);

// Image Generation Endpoint
router.post(
  '/generate-image',
  aiLimiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    const sanitizedPrompt = prompt.trim();
    if (sanitizedPrompt.length === 0) {
      return res.status(400).json({ error: 'Prompt cannot be empty' });
    }

    if (sanitizedPrompt.length > 2000) {
      return res.status(400).json({ error: 'Prompt is too long. Maximum 2000 characters.' });
    }

    const ai = getAiInstance();
    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [{ text: sanitizedPrompt }],
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
  })
);

// Thumbnail Generation Endpoint
router.post(
  '/generate-thumbnail',
  aiLimiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { title, subject, mood } = req.body;

    if (!title || !subject || !mood) {
      return res.status(400).json({ error: 'Title, subject, and mood are required' });
    }

    if (typeof title !== 'string' || typeof subject !== 'string' || typeof mood !== 'string') {
      return res.status(400).json({ error: 'All fields must be strings' });
    }

    const sanitizedTitle = title.trim().slice(0, 200);
    const sanitizedSubject = subject.trim().slice(0, 200);
    const sanitizedMood = mood.trim().slice(0, 100);

    if (!sanitizedTitle || !sanitizedSubject || !sanitizedMood) {
      return res.status(400).json({ error: 'Fields cannot be empty' });
    }

    const ai = getAiInstance();
    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const prompt = `Create a high-quality, eye-catching YouTube vlog thumbnail. 
      Title context: "${sanitizedTitle}". 
      Subject: ${sanitizedSubject}. 
      Mood/Style: ${sanitizedMood}. 
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
  })
);

// Image Analysis Endpoint
router.post(
  '/analyze-image',
  asyncHandler(async (req, res) => {
    const { mimeType, data } = req.body;

    if (!mimeType || !data) {
      return res.status(400).json({ error: 'Image data (mimeType and base64 data) is required' });
    }

    if (typeof mimeType !== 'string' || typeof data !== 'string') {
      return res.status(400).json({ error: 'Invalid data types' });
    }

    // Validate mimeType
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Invalid image format. Use JPEG, PNG, GIF, or WebP.' });
    }

    // Validate base64 data (basic check)
    if (data.length < 100) {
      return res.status(400).json({ error: 'Image data appears to be invalid' });
    }

    // Limit max image size (approximately 10MB in base64)
    if (data.length > 14 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image is too large. Maximum 10MB.' });
    }

    const ai = getAiInstance();
    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

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

      // Validate response structure
      res.json({
        type: result.type || 'Unknown',
        condition: result.condition || 'Unable to determine condition',
      });
    } catch (e) {
      console.error('Failed to parse JSON from AI response:', text);
      res.status(500).json({
        error: 'Failed to parse AI response',
        type: 'Unknown',
        condition: 'Analysis failed - please try again',
      });
    }
  })
);

// Batch Generate Blog Images
router.post(
  '/generate-blog-images',
  asyncHandler(async (req, res) => {
    const articles = db.articles;
    const ai = getAiInstance();

    if (!ai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const results: { id: number; title: string; success: boolean; error?: string }[] = [];

    // Resolve public/blog-images path
    // We are in backend/src/routes/aiRoutes.ts -> needs to go up 3 levels to root, then public
    const publicDir = path.resolve(__dirname, '../../../public');
    const blogImagesDir = path.join(publicDir, 'blog-images');

    if (!fs.existsSync(blogImagesDir)) {
      try {
        fs.mkdirSync(blogImagesDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create blog-images directory:', err);
        return res.status(500).json({ error: 'Failed to create images directory' });
      }
    }

    // Process articles sequentially
    for (const article of articles) {
      // Skip if image already exists and looks valid (not empty)
      if (article.imageUrl && article.imageUrl.length > 5) {
        console.log(`Skipping article ${article.id} - Image already exists: ${article.imageUrl}`);
        results.push({ id: article.id, title: article.title, success: true, error: 'Skipped - Image exists' });
        continue;
      }

      try {
        console.log(`Generating image for article: ${article.title}`);

        // Use "Nano Banana Pro" in the prompt as requested
        const prompt = `Create a blog post header image for the article titled "${article.title}". 
        The context is about pet care.
        Style: Nano Banana Pro, vibrant, modern, high quality, photorealistic or artistic illustration compatible with a pet care blog.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: '16:9', // Standard blog header ratio
            },
          },
        });

        let base64Data = null;
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              base64Data = part.inlineData.data;
              break;
            }
          }
        }

        if (base64Data) {
          const fileName = `article-${article.id}-${Date.now()}.png`;
          const filePath = path.join(blogImagesDir, fileName);

          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

          // Update article in DB
          article.imageUrl = `/blog-images/${fileName}`;
          results.push({ id: article.id, title: article.title, success: true });
        } else {
          results.push({
            id: article.id,
            title: article.title,
            success: false,
            error: 'No image data returned',
          });
        }

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`Error generating image for article ${article.id}:`, error);
        results.push({
          id: article.id,
          title: article.title,
          success: false,
          error: error.message,
        });
      }
    }

    // Persist changes
    db.write();

    res.json({
      message: 'Blog image generation complete',
      results,
    });
  })
);

export default router;
