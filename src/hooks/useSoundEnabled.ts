import { useCallback, useState } from "react";

const STORAGE_KEY = "ghub-sfx-enabled";
const LEGACY_STORAGE_KEY = "glab-sfx-enabled";
export const DEFAULT_SOUND_ENABLED = true;

function readStoredSoundEnabled(): boolean {
  try {
    let stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy !== null) {
        stored = legacy;
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    if (stored === null) {
      localStorage.setItem(STORAGE_KEY, String(DEFAULT_SOUND_ENABLED));
      return DEFAULT_SOUND_ENABLED;
    }
    return stored === "true";
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
