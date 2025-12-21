/* eslint-disable no-console */
// Lightweight smoke-test for configured AI proxy
// Usage: NODE_OPTIONS=--unhandled-rejections=strict node scripts/ci/ai-proxy-smoke.js

const proxyUrl = process.env.VITE_AI_PROXY_URL || process.env.AI_PROXY_URL;

async function main() {
  if (!proxyUrl) {
    console.log(
      'No AI proxy configured (VITE_AI_PROXY_URL / AI_PROXY_URL not set). Skipping smoke test.'
    );
    process.exit(0);
  }

  console.log(`Running AI proxy smoke test against: ${proxyUrl}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'PetBhai smoke test: ping' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      console.error(`Proxy returned non-OK status: ${resp.status} ${resp.statusText}`);
      process.exit(2);
    }

    const json = await resp.json().catch(() => null);
    if (!json) {
      console.error('Proxy response is not valid JSON');
      process.exit(3);
    }

    // Expect either { text: ... } or { success: true } style responses from common proxies
    if (typeof json.text === 'string' || json.success === true) {
      console.log('AI proxy smoke test passed');
      process.exit(0);
    }

    console.error(
      'AI proxy responded but did not include expected fields (text / success). Response:',
      json
    );
    process.exit(4);
  } catch (err) {
    if (err && err.name === 'AbortError') {
      console.error('AI proxy smoke test timed out');
      process.exit(5);
    }
    console.error('Error during AI proxy smoke test:', err && err.message ? err.message : err);
    process.exit(6);
  }
}

main();
