/**
 * Verifies admin CMS save/load merge without a browser.
 * Run: node scripts/verify-content-store.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, v),
  removeItem: (k) => storage.delete(k),
};

// Dynamic import after localStorage mock
const { getAllEditableDrafts, getMergedLocale, persistAllLocaleDrafts, loadContentOverrides, clearContentOverrides } =
  await import("../src/i18n/contentStore.ts");

const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

clearContentOverrides();

const drafts = getAllEditableDrafts(null);
const jaDraft = structuredClone(drafts.ja);
jaDraft.chamber01 = {
  ...jaDraft.chamber01,
  subtitle: "【VERIFY】テスト保存文言",
  hubGames: "G.games",
};

persistAllLocaleDrafts({ ...drafts, ja: jaDraft });
const loaded = loadContentOverrides();

assert(loaded !== null, "loadContentOverrides should return data after save");
assert(loaded?.version === 1, "version should be 1");
assert(loaded?.locales?.ja?.chamber01?.subtitle === "【VERIFY】テスト保存文言", "JA subtitle round-trip");
assert(loaded?.locales?.en?.chamber01 !== undefined, "EN chamber01 should be stored");
assert(loaded?.locales?.zh?.chamber01 !== undefined, "ZH chamber01 should be stored");

const mergedJa = getMergedLocale("ja", loaded);
assert(mergedJa.chamber01.subtitle === "【VERIFY】テスト保存文言", "merged JA subtitle");
assert(mergedJa.common?.labManual !== undefined, "non-editable keys preserved from base");
assert(mergedJa.chamber01.hubGames === "G.games", "hubGames preserved");

const mergedEn = getMergedLocale("en", loaded);
assert(
  typeof mergedEn.chamber01.subtitle === "string" && mergedEn.chamber01.subtitle.length > 0,
  "EN chamber01 still valid after JA-only edit",
);

if (failures.length) {
  console.error("FAILED:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log("OK: content store save/load/merge verified");
console.log("  storage key: ghub-content-overrides");
console.log("  sample JA subtitle:", loaded.locales.ja.chamber01.subtitle);
