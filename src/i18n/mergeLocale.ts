type PlainObject = Record<string, unknown>;

/** Deep-merge partial locale overrides onto the English base catalog. */
export function mergeLocale<T extends PlainObject>(base: T, override: PlainObject): T {
  const out: PlainObject = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      out[key] = mergeLocale(current as PlainObject, value as PlainObject);
    } else {
      out[key] = value;
    }
  }

  return out as T;
}
