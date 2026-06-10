export type FlatContent = Record<string, string | string[]>;

export const EDITABLE_SECTIONS = [
  { id: "meta", label: "ページ情報", root: "meta" },
  { id: "shell", label: "共通 UI / マニュアル", root: "shell" },
  { id: "chambers", label: "チャンバー一覧", root: "chambers" },
  { id: "chamber01", label: "L-01 ENTRY", root: "chamber01" },
  { id: "chamber02", label: "L-02 THINKING", root: "chamber02" },
  { id: "chamber03", label: "L-03 ECOSYSTEM", root: "chamber03" },
  { id: "chamber04", label: "L-04 G.GAME", root: "chamber04" },
  { id: "chamber05", label: "L-05 G.TRANS", root: "chamber05" },
  { id: "chamber06", label: "L-06 ENGINE", root: "chamber06" },
  { id: "chamber07", label: "L-07 SHOWCASE", root: "chamber07" },
  { id: "chamber08", label: "L-08 FUTURE", root: "chamber08" },
  { id: "chamber09", label: "L-09 CONTACT", root: "chamber09" },
] as const;

export type EditableSectionId = (typeof EDITABLE_SECTIONS)[number]["id"];

export function flattenContent(value: unknown, prefix = ""): FlatContent {
  if (typeof value === "string") {
    return prefix ? { [prefix]: value } : {};
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return prefix ? { [prefix]: value } : {};
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out: FlatContent = {};
    for (const [key, nested] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      Object.assign(out, flattenContent(nested, path));
    }
    return out;
  }

  return {};
}

export function unflattenContent(flat: FlatContent): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split(".");
    let cursor: Record<string, unknown> = root;

    for (let i = 0; i < parts.length - 1; i += 1) {
      const part = parts[i];
      const next = cursor[part];
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        cursor[part] = {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    }

    cursor[parts[parts.length - 1]] = value;
  }

  return root;
}

export function pickSectionRoot(source: Record<string, unknown>, root: string): Record<string, unknown> {
  const value = source[root];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function mergeSectionRoot(
  base: Record<string, unknown>,
  root: string,
  sectionValue: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...base,
    [root]: sectionValue,
  };
}

export function editableRootsFromLocale(locale: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const section of EDITABLE_SECTIONS) {
    out[section.root] = pickSectionRoot(locale, section.root);
  }
  return out;
}

export function flatEditableFromLocale(locale: Record<string, unknown>): FlatContent {
  return flattenContent(editableRootsFromLocale(locale));
}

export function arrayToMultiline(value: string | string[]): string {
  return Array.isArray(value) ? value.join("\n") : value;
}

export function multilineToValue(raw: string, original: string | string[]): string | string[] {
  if (Array.isArray(original)) {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return raw;
}
