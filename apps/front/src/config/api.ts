const envBaseUrl = import.meta.env.VITE_API_BASE_URL;

const resolvedBaseUrl = (() => {
  if (typeof envBaseUrl === "string" && envBaseUrl.trim()) {
    return envBaseUrl.trim();
  }
  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }
  throw new Error("VITE_API_BASE_URL is required in production.");
})();

const normalizedBaseUrl = resolvedBaseUrl.endsWith("/")
  ? resolvedBaseUrl.slice(0, -1)
  : resolvedBaseUrl;

export const apiBaseUrl = normalizedBaseUrl;

export const apiUrl = (path = "") => {
  if (!path) return normalizedBaseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};
