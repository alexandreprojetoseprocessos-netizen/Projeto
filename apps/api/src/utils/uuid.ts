const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const normalizeUuid = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!UUID_REGEX.test(normalized)) return null;
  return normalized;
};

export const isUuid = (value: unknown): value is string => normalizeUuid(value) !== null;

