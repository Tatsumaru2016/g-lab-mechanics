import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import ja from "./locales/ja";
import zh from "./locales/zh";
import {
  SUPPORTED_LANGUAGES,
  htmlLangFor,
  resolveAppLanguage,
  type AppLanguage,
} from "./languages";
import { applyContentOverrides } from "./contentStore";

export { LANG_STORAGE_KEY } from "./languages";
export { SUPPORTED_LANGUAGES, type AppLanguage, resolveAppLanguage, htmlLangFor };

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: "ja",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "ghub-lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = htmlLangFor(lng);
});

applyContentOverrides(i18n);
document.documentElement.lang = htmlLangFor(i18n.language);

export default i18n;
