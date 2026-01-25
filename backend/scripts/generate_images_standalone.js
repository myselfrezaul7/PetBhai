"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const db_1 = require("../src/db");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const url_1 = require("url");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Load environment variables from backend/.env
const envPath = path_1.default.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
const result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    console.warn('Error loading .env file:', result.error);
}
// Fallback to root .env if needed
if (!process.env.GEMINI_API_KEY) {
    const rootEnvPath = path_1.default.resolve(__dirname, '../../.env');
    console.log(`Trying root .env from: ${rootEnvPath}`);
    dotenv_1.default.config({ path: rootEnvPath });
}
const getAiInstance = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key') {
        console.warn('GEMINI_API_KEY not configured');
        return null;
    }
    return new genai_1.GoogleGenAI({ apiKey });
};
function generateImages() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        console.log('Starting blog image generation...');
        const articles = db_1.db.articles;
        const ai = getAiInstance();
        if (!ai) {
            console.error('AI service not configured. Set GEMINI_API_KEY.');
            process.exit(1);
        }
        const publicDir = path_1.default.resolve(__dirname, '../../public');
        const blogImagesDir = path_1.default.join(publicDir, 'blog-images');
        if (!fs_1.default.existsSync(blogImagesDir)) {
            try {
                fs_1.default.mkdirSync(blogImagesDir, { recursive: true });
                console.log(`Created directory: ${blogImagesDir}`);
            }
            catch (err) {
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
                const response = yield ai.models.generateContent({
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
                if ((_c = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if ((_d = part.inlineData) === null || _d === void 0 ? void 0 : _d.data) {
                            base64Data = part.inlineData.data;
                            break;
                        }
                    }
                }
                if (base64Data) {
                    const fileName = `article-${article.id}-${Date.now()}.png`;
                    const filePath = path_1.default.join(blogImagesDir, fileName);
                    fs_1.default.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                    // Update article in DB
                    article.imageUrl = `/blog-images/${fileName}`;
                    console.log(`  -> Saved to ${fileName}`);
                    successCount++;
                }
                else {
                    console.error(`  -> Failed: No image data returned`);
                }
                // Small delay to respect rate limits
                yield new Promise((resolve) => setTimeout(resolve, 2000));
            }
            catch (error) {
                console.error(`  -> Error generating image for article ${article.id}:`, error.message);
            }
        }
        if (successCount > 0) {
            db_1.db.write();
            console.log(`\nSuccess! Generated ${successCount} images.`);
        }
        else {
            console.log('\nNo images generated.');
        }
    });
}
generateImages();
