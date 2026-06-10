import type { i18n as I18nInstance } from "i18next";
import en from "./locales/en";
import ja from "./locales/ja";
import zh from "./locales/zh";
import { mergeLocale } from "./mergeLocale";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "./languages";
import { editableRootsFromLocale } from "./contentPaths";

export const CONTENT_STORAGE_KEY = "ghub-content-overrides";

const BASE_LOCALES: Record<AppLanguage, Record<string, unknown>> = {
  ja: ja as Record<string, unknown>,
  en: en as Record<string, unknown>,
  zh: zh as Record<string, unknown>,
};

export interface ContentOverrides {
  version: 1;
  updatedAt: string;
  locales: Partial<Record<AppLanguage, Record<string, unknown>>>;
}

export function createEmptyOverrides(): ContentOverrides {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    locales: {},
  };
}

export function loadContentOverrides(): ContentOverrides | null {
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContentOverrides;
    if (parsed.version !== 1 || !parsed.locales) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveContentOverrides(overrides: ContentOverrides): void {
  localStorage.setItem(
    CONTENT_STORAGE_KEY,
    JSON.stringify({
      ...overrides,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearContentOverrides(): void {
  localStorage.removeItem(CONTENT_STORAGE_KEY);
}

export function getMergedLocale(lang: AppLanguage, overrides: ContentOverrides | null): Record<string, unknown> {
  const base = BASE_LOCALES[lang];
  const patch = overrides?.locales?.[lang];
  if (!patch) return base;
  return mergeLocale(base, patch);
}

export function getEditableDraft(
  lang: AppLanguage,
  overrides: ContentOverrides | null,
): Record<string, unknown> {
  return editableRootsFromLocale(getMergedLocale(lang, overrides));
}

export function getAllEditableDrafts(
  overrides: ContentOverrides | null,
): Record<AppLanguage, Record<string, unknown>> {
  return {
    ja: getEditableDraft("ja", overrides),
    en: getEditableDraft("en", overrides),
    zh: getEditableDraft("zh", overrides),
  };
}

export function applyContentOverrides(instance: I18nInstance): void {
  const overrides = loadContentOverrides();
  if (!overrides) return;

  for (const lang of SUPPORTED_LANGUAGES) {
    const patch = overrides.locales[lang];
    if (!patch) continue;
    const merged = mergeLocale(BASE_LOCALES[lang], patch);
    instance.addResourceBundle(lang, "translation", merged, true, true);
  }
}

export function persistAllLocaleDrafts(
  drafts: Record<AppLanguage, Record<string, unknown>>,
): ContentOverrides {
  const overrides: ContentOverrides = {
    version: 1,
    updatedAt: new Date().toISOString(),
    locales: drafts,
  };
  saveContentOverrides(overrides);
  return overrides;
}
