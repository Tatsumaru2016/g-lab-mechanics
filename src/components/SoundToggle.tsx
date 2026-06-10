import { Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export default function SoundToggle({ enabled, onToggle, className = "" }: SoundToggleProps) {
  const { t } = useTranslation();
  const label = enabled ? t("common.soundOn") : t("common.soundOff");

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? t("common.disableSound") : t("common.enableSound")}
      title={label}
      className={`glass-chrome p-2.5 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
        enabled ? "" : "opacity-70"
      } ${className}`}
    >
      {enabled ? (
        <Volume2 className="w-3.5 h-3.5 text-[#0057FF]" aria-hidden />
      ) : (
        <VolumeX className="w-3.5 h-3.5 text-neutral-500" aria-hidden />
      )}
    </button>
  );
}
