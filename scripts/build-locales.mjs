import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deToFr, deToIt } from "./maps/de-eu.mjs";
import { jaToZh, jaToKo } from "./maps/ja-east.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../src/i18n/locales");

function applyReplacements(content, replacements) {
  const sorted = [...replacements].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    if (from && from !== to) {
      content = content.split(from).join(to);
    }
  }
  return content;
}

function buildFromSource(sourceFile, targetFile, constName, replacements) {
  const sourceConst = sourceFile.replace(".ts", "");
  let content = fs.readFileSync(path.join(localesDir, sourceFile), "utf8");
  content = content.replace(`const ${sourceConst} =`, `const ${constName} =`);
  content = content.replace(`export default ${sourceConst}`, `export default ${constName}`);
  content = applyReplacements(content, replacements);
  fs.writeFileSync(path.join(localesDir, targetFile), content, "utf8");
}

buildFromSource("de.ts", "fr.ts", "fr", deToFr);
buildFromSource("de.ts", "it.ts", "it", deToIt);
buildFromSource("ja.ts", "zh.ts", "zh", jaToZh);
buildFromSource("ja.ts", "ko.ts", "ko", jaToKo);

console.log("Built fr.ts, it.ts, zh.ts, ko.ts");
