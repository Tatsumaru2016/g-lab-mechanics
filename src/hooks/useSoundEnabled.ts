import { useCallback, useState } from "react";

/** v4: force default OFF for all visitors (icon = VolumeX / grey) */
const STORAGE_KEY = "ghub-sfx-enabled-v4";
export const DEFAULT_SOUND_ENABLED = false;

function readStoredSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === "true";
    }
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_SOUND_ENABLED));
    return DEFAULT_SOUND_ENABLED;
  } catch {
    return DEFAULT_SOUND_ENABLED;
  }
}

export function useSoundEnabled() {
  const [soundEnabled, setSoundEnabledState] = useState(readStoredSoundEnabled);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Storage unavailable
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
    return !soundEnabled;
  }, [soundEnabled, setSoundEnabled]);

  return { soundEnabled, setSoundEnabled, toggleSound };
}
