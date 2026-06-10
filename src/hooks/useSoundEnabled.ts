import { useCallback, useState } from "react";

/** v2: reset stale OFF values; default is always ON for new visitors */
const STORAGE_KEY = "ghub-sfx-enabled-v2";
const LEGACY_KEYS = ["ghub-sfx-enabled", "glab-sfx-enabled"] as const;
export const DEFAULT_SOUND_ENABLED = true;

function readStoredSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === "true";
    }

    // Only inherit legacy preference when it was explicitly ON
    for (const legacyKey of LEGACY_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy === "true") {
        localStorage.setItem(STORAGE_KEY, "true");
        for (const key of LEGACY_KEYS) localStorage.removeItem(key);
        return true;
      }
    }

    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
    localStorage.setItem(STORAGE_KEY, "true");
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
