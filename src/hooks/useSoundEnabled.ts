import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ghub-sfx-enabled-v5";
const LEGACY_KEYS = [
  "ghub-sfx-enabled-v4",
  "ghub-sfx-enabled-v3",
  "ghub-sfx-enabled-v2",
  "ghub-sfx-enabled",
  "glab-sfx-enabled",
] as const;

function readStoredSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function purgeLegacySoundKeys(): void {
  try {
    for (const key of LEGACY_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable
  }
}

export function useSoundEnabled() {
  const [soundEnabled, setSoundEnabledState] = useState(false);

  useEffect(() => {
    purgeLegacySoundKeys();
    setSoundEnabledState(readStoredSoundEnabled());
  }, []);

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
