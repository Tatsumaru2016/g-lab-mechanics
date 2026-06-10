import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_OPTIONS, resolveAppLanguage, type AppLanguage } from "../i18n/languages";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = resolveAppLanguage(i18n.language);

  const setLanguage = (lng: AppLanguage) => {
    void i18n.changeLanguage(lng);
  };

  return (
    <div className="glass-chrome flex items-center rounded-lg overflow-hidden">
      <label htmlFor="ghub-lang-select" className="sr-only">
        {t("language.label")}
      </label>
      <select
        id="ghub-lang-select"
        value={current}
        onChange={(e) => setLanguage(e.target.value as AppLanguage)}
        aria-label={t("language.label")}
        className="px-2.5 py-2.5 font-mono text-[9px] tracking-widest bg-transparent text-[#0057FF] font-bold border-0 outline-none cursor-pointer appearance-none pr-6 max-w-[7.5rem]"
      >
        {LANGUAGE_OPTIONS.map(({ code, nativeLabel }) => (
          <option key={code} value={code}>
            {nativeLabel}
          </option>
        ))}
      </select>
      <div className="px-2 py-2.5 border-l border-white/50 text-neutral-400 pointer-events-none" aria-hidden>
        <Languages className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}
