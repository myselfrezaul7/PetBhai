// Minimal Express-compatible serverless handler for a POST /api/ai endpoint.
// Adapt this to your target platform (Vercel, Netlify, AWS Lambda, Cloudflare Workers, etc.).

const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(bodyParser.json({ limit: '256kb' }));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set');
}

const client = new GoogleGenAI({ apiKey });

app.post('/api/ai', async (req, res) => {
  if (!apiKey) return res.status(500).json({ error: 'AI backend not configured' });

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { thinkingConfig: { thinkingBudget: 2048 } },
    });

    return res.json({ text: response.text || '' });
  } catch (err) {
    console.error('AI proxy error:', err);
    return res.status(500).json({ error: 'AI call failed' });
  }
});

// Export for serverless platforms that accept an Express app
module.exports = app;

// For local dev only:
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`AI proxy listening on port ${port}`));
}
