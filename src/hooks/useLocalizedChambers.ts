import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CHAMBERS, type Chamber } from "../types";
import { chamberI18nKey } from "../i18n/chamberKey";

export type LocalizedChamber = Chamber & {
  name: string;
  tagline: string;
};

export function useLocalizedChambers(): LocalizedChamber[] {
  const { t, i18n } = useTranslation();

  return useMemo(
    () =>
      CHAMBERS.map((chamber) => {
        const key = chamberI18nKey(chamber.id);
        return {
          ...chamber,
          name: t(`chambers.${key}.name`),
          tagline: t(`chambers.${key}.tagline`),
        };
      }),
    [t, i18n.language]
  );
}

export function useChamberLabel(chamberId: string): { name: string; tagline: string } {
  const { t, i18n } = useTranslation();
  const key = chamberI18nKey(chamberId);

  return useMemo(
    () => ({
      name: t(`chambers.${key}.name`),
      tagline: t(`chambers.${key}.tagline`),
    }),
    [t, i18n.language, key]
  );
}
