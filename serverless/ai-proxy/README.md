This folder contains a simple template for a serverless proxy that calls the Gemini API
using a server-side secret. Deploy this function to any serverless provider (Vercel, Netlify,
Cloudflare Workers, AWS Lambda, etc.).

Why use a proxy?

- Keeps your GEMINI API key secret (never embed it in client bundles).
- Allows rate-limiting, input validation, and centralized logging.

Example Node (Express) handler (index.js): see index.js in this folder.

How to deploy

1. Add the secret `GEMINI_API_KEY` to your provider's secret store.
2. Deploy the function and choose an endpoint (e.g., `POST /api/ai`).
3. Update the frontend to POST to that endpoint with JSON { prompt: string }.

Security notes

- Validate and sanitize user input.
- Rate limit requests in the function.
- Never echo the API key back to the client.

If you'd like, I can implement and wire up a sample serverless deployment for a specific provider (Vercel/Netlify/Cloudflare).
