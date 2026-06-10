/** Map chamber id "L-01" → translation namespace "L01" */
export function chamberI18nKey(id: string): string {
  return id.replace("-", "");
}
