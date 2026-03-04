const FRONT_URL = process.env.SMOKE_FRONT_URL ?? "http://localhost:5173";
const API_URL = process.env.SMOKE_API_URL ?? "http://localhost:4000";
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 10000);

const withTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/html;q=0.9",
        ...(options.headers ?? {})
      }
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

const checks = [
  {
    name: "front:index",
    url: FRONT_URL,
    validate: async (response) => {
      const body = await response.text();
      return response.ok && body.includes("<div id=\"root\"></div>");
    }
  },
  {
    name: "api:health",
    url: `${API_URL}/health`,
    validate: async (response) => {
      if (!response.ok) return false;
      const body = await response.json().catch(() => null);
      return Boolean(body?.ok);
    }
  }
];

let hasFailure = false;

for (const check of checks) {
  try {
    const response = await withTimeout(check.url);
    const ok = await check.validate(response);
    if (!ok) {
      hasFailure = true;
      console.error(`[smoke] FAIL ${check.name} -> ${check.url}`);
      continue;
    }
    console.log(`[smoke] OK   ${check.name} -> ${check.url}`);
  } catch (error) {
    hasFailure = true;
    console.error(`[smoke] FAIL ${check.name} -> ${check.url}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log("[smoke] Todos os checks basicos passaram.");
}
