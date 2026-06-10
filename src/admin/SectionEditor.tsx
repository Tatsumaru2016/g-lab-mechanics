import { useMemo } from "react";
import {
  EDITABLE_SECTIONS,
  arrayToMultiline,
  flattenContent,
  multilineToValue,
  pickSectionRoot,
  type EditableSectionId,
  type FlatContent,
} from "../i18n/contentPaths";

interface SectionEditorProps {
  sectionId: EditableSectionId;
  draft: Record<string, unknown>;
  onDraftChange: (next: Record<string, unknown>) => void;
}

function textareaRows(value: string | string[]): number {
  const lineCount = arrayToMultiline(value).split("\n").length;
  return Math.min(14, Math.max(2, lineCount + 1));
}

export default function SectionEditor({ sectionId, draft, onDraftChange }: SectionEditorProps) {
  const section = EDITABLE_SECTIONS.find((item) => item.id === sectionId)!;
  const sectionValue = pickSectionRoot(draft, section.root);
  const flat = useMemo(() => flattenContent(sectionValue, section.root), [section.root, sectionValue]);
  const entries = useMemo(() => Object.entries(flat).sort(([a], [b]) => a.localeCompare(b)), [flat]);

  const updateField = (path: string, raw: string) => {
    const original = flat[path];
    const nextValue = multilineToValue(raw, original);
    const nextFlat: FlatContent = { ...flat, [path]: nextValue };
    const nextSection = flattenToSectionRoot(nextFlat, section.root);
    onDraftChange({
      ...draft,
      [section.root]: nextSection,
    });
  };

  if (entries.length === 0) {
    return <p className="text-sm text-neutral-500">このセクションに編集可能な項目がありません。</p>;
  }

  return (
    <div className="space-y-4 pt-1">
      {entries.map(([path, value]) => {
        const isArray = Array.isArray(value);
        const inputId = path.replace(/\./g, "-");
        const display = arrayToMultiline(value);

        return (
          <label key={path} htmlFor={inputId} className="block space-y-1.5">
            <span className="font-mono text-[10px] tracking-wide text-neutral-500">{path}</span>
            {isArray && (
              <span className="ml-2 font-mono text-[9px] text-neutral-400">（1行 = 1項目）</span>
            )}
            <textarea
              id={inputId}
              rows={textareaRows(value)}
              value={display}
              onChange={(e) => updateField(path, e.target.value)}
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 font-sans text-sm leading-relaxed whitespace-pre-wrap outline-none focus:border-[#0057FF] min-h-[2.75rem]"
            />
          </label>
        );
      })}
    </div>
  );
}

function flattenToSectionRoot(flat: FlatContent, root: string): Record<string, unknown> {
  const sectionFlat: FlatContent = {};
  const prefix = `${root}.`;

  for (const [path, value] of Object.entries(flat)) {
    if (path === root) {
      if (typeof value === "string") return { [root]: value } as unknown as Record<string, unknown>;
    } else if (path.startsWith(prefix)) {
      sectionFlat[path.slice(prefix.length)] = value;
    }
  }

  return unflattenSection(sectionFlat);
}

function unflattenSection(flat: FlatContent): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split(".");
    let cursor: Record<string, unknown> = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const part = parts[i];
      if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
        cursor[part] = {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]] = value;
  }
  return root;
}
