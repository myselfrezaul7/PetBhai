# PetBhai Project: AI System Guidelines & Master Prompt

> **Dear AI Assistant:** If you are reading this file, you are working on the **PetBhai** project. Please strictly adhere to the following rules, preferences, and technical boundaries when generating content, writing code, or creating images.

---

## 1. Content Strategy: The "Three-Part" Blog Rule
All health, medical, emergency, and general care blog articles MUST follow this strict three-part structure. Do not skip any section.

### Part 1: ⚡ প্রাথমিক চিকিৎসা (Immediate First Aid)
- **Always placed first.**
- Written in short, highly scannable bullet points.
- Focuses strictly on immediate actions a pet owner must take *right now* to stabilize the animal before visiting a doctor.
- Tone: Urgent, clear, and actionable.

### Part 2: 📋 বিস্তারিত করণীয় (Detailed Guide)
- The core educational body of the article.
- Deep-dive explanations covering causes, symptoms, home care routines, prevention, and long-term management.
- Use bold sub-headings for easy mobile reading.

### Part 3: 👨‍⚕️ ভেটের পরামর্শ (Consult a Certified Vet)
- **Always placed at the very end.**
- A strong, unequivocal warning that internet advice is not a substitute for a professional medical diagnosis.
- Must include a Call-To-Action (CTA) urging the user to contact a registered veterinarian through the **PetBhai app/website**.
- *Example text:* "অবশ্যই মনে রাখবেন, ইন্টারনেটের কোনো তথ্যই একজন রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের বিকল্প হতে পারে না। আপনার পোষা প্রাণীর যেকোনো জরুরি চিকিৎসায় আজই **PetBhai** অ্যাপ বা ওয়েবসাইট থেকে একজন সার্টিফাইড ভেটের সাথে যোগাযোগ করুন।"

---

## 2. Image Generation & Visual Identity
When generating thumbnails or UI assets for the blog, you must strictly follow these prompt rules. Failure to do so will break the platform's visual consistency.

- **Topic Relevance (CRITICAL):** The animal in the thumbnail MUST match the topic of the blog. Use a cat for cat-related blogs and a dog for dog-related blogs. Do not mix them up unless the blog is about both.
- **Aspect Ratio:** `cinematic wide 16:9 landscape aspect ratio` (Crucial to prevent UI cropping in `ArticleCard` and `ArticleDetailPage`).
- **Breed Policy (STRICT):** **ONLY** use Bangladeshi desi street dogs, stray cats, or mixed breeds. **ABSOLUTELY NO** foreign or purebred animals (e.g., no Golden Retrievers, Huskies, Persians). 
- **Age Preference:** Strongly prefer using **small stray kittens** and **small desi puppies** whenever the topic allows, as they resonate better with the audience.
- **Human Face Policy (STRICT):** **NO human faces visible.** Hands, arms, or torsos are acceptable (e.g., hands examining a dog's ear), but faces must remain completely out of frame or obscured to keep 100% focus on the animal.
- **Setting & Style:** Use local Bangladeshi settings (Dhaka streets, local courtyards, tin awnings, warm natural light). Include `professional pet photography`, `shallow depth of field`, `no text`, `no watermark`.

---

## 3. Technical & Database Boundaries
The project currently relies on hardcoded mock data for the blog infrastructure. 

- **Database File:** `backend/src/data/mockData.ts`
- **Encoding Rule (CRITICAL):** The `mockData.ts` file is encoded in **UTF-16LE**. Any Node.js script written to parse, inject, or modify this file MUST use `fs.readFileSync(path, 'utf16le')` and `fs.writeFileSync(path, content, 'utf16le')`. Writing in UTF-8 will corrupt the database.
- **Image Paths:** Blog images should be saved in `public/blog-images/` and referenced in the database as `'/blog-images/blog-topic-name.png'`.
- **Language:** Blog titles and content must be written in natural, fluent **Bangla**. The `slug` must be English transliteration (e.g., `biraler-ukun-hole-211`).

---

**AI Acknowledgment:** 
By reading this file, you agree to format all future articles with the Three-Part template, generate images exclusively of 16:9 faceless desi puppies/kittens, and handle `mockData.ts` using UTF-16LE.
