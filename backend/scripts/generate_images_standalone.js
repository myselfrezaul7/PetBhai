
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Fallback to root .env
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

// Start generation
generateAll();

async function generateAll() {
    const ai = getAiInstance();
    if (!ai) {
        console.error('AI service not configured. Set GEMINI_API_KEY in .env');
        process.exit(1);
    }

    const publicDir = path.resolve(__dirname, '../../public');
    const blogImagesDir = path.join(publicDir, 'blog-images');

    // Ensure directories exist
    if (!fs.existsSync(blogImagesDir)) fs.mkdirSync(blogImagesDir, { recursive: true });

    // 1. Generate Blog Images
    await generateBlogImages(ai, blogImagesDir);

    // 2. Generate Homepage Hero
    await generateHeroImage(ai, publicDir);
}

async function generateBlogImages(ai, blogImagesDir) {
    console.log('\n--- Generating Blog Images ---');
    const dbPath = path.resolve(__dirname, '../data/db.json');

    if (!fs.existsSync(dbPath)) {
        console.error(`DB file not found at ${dbPath}`);
        return;
    }

    let dbData;
    try {
        dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (err) {
        console.error('Error reading db.json:', err);
        return;
    }

    const articles = dbData.articles || [];
    let successCount = 0;

    for (const article of articles) {
        // Skip if already has a local image (start with /blog-images/) and file exists
        // BUT user said "thumbnails aren't visible", so maybe files are missing.
        // Let's check if file exists.
        let needsGeneration = true;

        if (article.imageUrl && article.imageUrl.startsWith('/blog-images/')) {
            const existingFileName = path.basename(article.imageUrl);
            if (fs.existsSync(path.join(blogImagesDir, existingFileName))) {
                console.log(`Skipping ${article.title.substring(0, 20)}... (Image exists)`);
                needsGeneration = false;
            }
        }

        if (needsGeneration) {
            try {
                console.log(`Generating image for: "${article.title.substring(0, 30)}..."`);
                const prompt = `Create a blog post header image for the article titled "${article.title}". 
                The context is about pet care in Bangladesh.
                Style: Warm, vibrant, 2D vector art or illustration, friendly and inviting.`;

                // switch to imagen model
                const response = await ai.models.generateContent({
                    model: 'imagen-3.0-generate-001',
                    contents: { parts: [{ text: prompt }] },
                    config: {
                        responseMimeType: 'image/png',
                    }
                });



                // Handle binary image response directly
                // The Google GenAI Node SDK returns image bytes differently depending on version/method
                // We'll try to extract the base64 or binary data

                let imageBuffer = null;

                // Helper to extract image data
                if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
                    imageBuffer = Buffer.from(response.candidates[0].content.parts[0].inlineData.data, 'base64');
                } else {
                    // Try fallback for different response structure if needed, but standard is above
                    console.log("  No inlineData found, inspecting response...");
                }

                if (imageBuffer) {
                    const fileName = `article-${article.id}-${Date.now()}.png`;
                    const filePath = path.join(blogImagesDir, fileName);
                    fs.writeFileSync(filePath, imageBuffer);

                    article.imageUrl = `/blog-images/${fileName}`;
                    console.log(`  -> Saved to ${fileName}`);
                    successCount++;
                } else {
                    console.error(`  -> Failed: No valid image data in response`);
                }

                // Rate limit pause
                await new Promise(r => setTimeout(r, 2000));

            } catch (error) {
                console.error(`  -> Error:`, error.message);
                if (error.status === 503) {
                    console.log("  -> 503 Service Unavailable, pausing for 10s...");
                    await new Promise(r => setTimeout(r, 10000));
                }
            }
        }
    }

    if (successCount > 0) {
        // Write back to DB atomically
        const tempPath = `${dbPath}.tmp.${Date.now()}`;
        try {
            fs.writeFileSync(tempPath, JSON.stringify(dbData, null, 2));
            fs.renameSync(tempPath, dbPath);
            console.log(`Updated db.json with ${successCount} new images.`);
        } catch (error) {
            console.error('Failed to update db.json:', error);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }
}

async function generateHeroImage(ai, publicDir) {
    console.log('\n--- Generating Homepage Hero ---');
    const heroPath = path.join(publicDir, 'landing-hero-dhaka.png');

    // Always regenerate hero as per user request ("restore... I wanted you to generate")
    // Or check if it's the placeholder I just downloaded (size might be indicator, or just overwrite)
    console.log(`Generating Hero Image...`);

    const prompt = `A warm, 2D artistic illustration of a Dhaka street scene with stray dogs (kutta) and cats living peacefully. 
    The atmosphere should be vibrant yet dusty, typical of Dhaka, with colored rickshaws in the background and a golden hour sunset. 
    Friendly, inviting, and community-focused style. No text. Aspect ratio 16:9.`;

    try {
        // switch to imagen model
        const response = await ai.models.generateContent({
            model: 'imagen-3.0-generate-001',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'image/png',
            }
        });


        if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            const imageBuffer = Buffer.from(response.candidates[0].content.parts[0].inlineData.data, 'base64');
            fs.writeFileSync(heroPath, imageBuffer);
            console.log(`Success! Saved hero image to ${heroPath}`);
        } else {
            console.error(`Failed to generate hero image: No data`);
        }
    } catch (error) {
        console.error(`Error generating hero image:`, error.message);
    }
}
