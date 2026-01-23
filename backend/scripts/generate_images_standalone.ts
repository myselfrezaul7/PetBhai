import { GoogleGenAI } from '@google/genai';
import { db } from '../src/db';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('Error loading .env file:', result.error);
}

// Fallback to root .env if needed
if (!process.env.GEMINI_API_KEY) {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  console.log(`Trying root .env from: ${rootEnvPath}`);
  dotenv.config({ path: rootEnvPath });
}

const getAiInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    console.warn('GEMINI_API_KEY not configured');
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

async function generateImages() {
  console.log('Starting blog image generation...');
  const articles = db.articles;
  const ai = getAiInstance();

  if (!ai) {
    console.error('AI service not configured. Set GEMINI_API_KEY.');
    process.exit(1);
  }

  const publicDir = path.resolve(__dirname, '../../public');
  const blogImagesDir = path.join(publicDir, 'blog-images');

  if (!fs.existsSync(blogImagesDir)) {
    try {
      fs.mkdirSync(blogImagesDir, { recursive: true });
      console.log(`Created directory: ${blogImagesDir}`);
    } catch (err) {
      console.error('Failed to create blog-images directory:', err);
      process.exit(1);
    }
  }

  let successCount = 0;

  for (const article of articles) {
    try {
      console.log(`Generating image for article: "${article.title}"...`);

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
            aspectRatio: '16:9',
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
        console.log(`  -> Saved to ${fileName}`);
        successCount++;
      } else {
        console.error(`  -> Failed: No image data returned`);
      }

      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`  -> Error generating image for article ${article.id}:`, error.message);
    }
  }

  if (successCount > 0) {
    db.write();
    console.log(`\nSuccess! Generated ${successCount} images.`);
  } else {
    console.log('\nNo images generated.');
  }
}

generateImages();
