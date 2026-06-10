export const LANG_STORAGE_KEY = "ghub-lang";

export const SUPPORTED_LANGUAGES = ["ja", "en", "zh"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_OPTIONS: { code: AppLanguage; nativeLabel: string }[] = [
  { code: "ja", nativeLabel: "日本語" },
  { code: "en", nativeLabel: "English" },
  { code: "zh", nativeLabel: "中文" },
];

const HTML_LANG: Record<AppLanguage, string> = {
  ja: "ja",
  en: "en",
  zh: "zh-CN",
};

export function resolveAppLanguage(lng: string): AppLanguage {
  const base = lng.split("-")[0] as AppLanguage;
  return SUPPORTED_LANGUAGES.includes(base) ? base : "ja";
}

export function htmlLangFor(lng: string): string {
  return HTML_LANG[resolveAppLanguage(lng)];
}
