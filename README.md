<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Z8Y_0SmP7T2684rss1HhLkQuXTjFQgew

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set your Gemini API key for local development and builds.
   - Create a file named `.env.local` with one of these options:
     - Use the build-time variable (recommended):

       GEMINI_API_KEY=your_gemini_key_here

       (Vite maps `GEMINI_API_KEY` to `process.env.API_KEY` at build time.)

     - Or set the Vite runtime variable for dev:

       VITE_API_KEY=your_gemini_key_here

       (The app will also read `import.meta.env.VITE_API_KEY` if present.)

   Important security note:
   - Do NOT embed a production Gemini API key in the client bundle. For production you should
     - Do NOT embed a production Gemini API key in the client bundle. Instead:
       - Deploy a server-side proxy (see `serverless/ai-proxy/README.md`) that keeps the key
         secret and exposes a safe endpoint for the frontend to call.
       - Configure the frontend to use the proxy by setting `VITE_AI_PROXY_URL` to the
         proxy endpoint (e.g., `https://example.com/api/ai`). When set, the frontend
         will POST { prompt } to that endpoint and display the response.

3. Run the app:
   `npm run dev`

## Build & Deploy

- Create a production build: `npm run build`
- Deploy to GitHub Pages: `npm run deploy` (project uses `gh-pages` and has a `CNAME` for `www.petbhai.com`).

---

## CI checks & AI proxy (added by automation)

The repository is configured to run enforced CI checks on PRs/Pushes to `main`:

- `npm run ci` (lint + build) is run during CI.
- `npm run check:html` is run after `npm run build` and will fail the CI if HTML validation issues are present.
- A **secret scan** using `gitleaks` is run on `dist/` and the repository; any findings will fail CI and require remediation.
- A lightweight AI proxy smoke-test is executed if `VITE_AI_PROXY_URL` or `AI_PROXY_URL` secret is configured in the repository settings; it POSTs a small prompt and expects a JSON-like response.

Required repository secrets for production AI workflows (configure under Settings → Secrets → Actions):

- `GEMINI_API_KEY` — only for server-side deployments; do NOT inject production keys into the client.
- `VITE_AI_PROXY_URL` — optional: the endpoint for a server-side proxy that the frontend can call to safely access AI services.

If you'd like, I can also add a GitHub Action to automatically deploy the optional serverless proxy (Netlify/Vercel) and wire the `VITE_AI_PROXY_URL` for you — let me know which host you'd prefer.
