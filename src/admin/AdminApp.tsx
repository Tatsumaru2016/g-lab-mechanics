import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, RotateCcw, Save, Upload } from "lucide-react";
import SectionEditor from "./SectionEditor";
import { EDITABLE_SECTIONS, type EditableSectionId } from "../i18n/contentPaths";
import {
  applyContentOverrides,
  clearContentOverrides,
  getAllEditableDrafts,
  loadContentOverrides,
  persistAllLocaleDrafts,
  saveContentOverrides,
  type ContentOverrides,
} from "../i18n/contentStore";
import { LANGUAGE_OPTIONS, type AppLanguage } from "../i18n/languages";
import i18n from "../i18n/config";

type Status = { kind: "idle" | "loading" | "success" | "error"; message?: string };

export default function AdminApp() {
  const [activeSection, setActiveSection] = useState<EditableSectionId>("chamber01");
  const [activeLang, setActiveLang] = useState<AppLanguage>("ja");
  const [drafts, setDrafts] = useState<Record<AppLanguage, Record<string, unknown>>>(() =>
    getAllEditableDrafts(loadContentOverrides()),
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const importRef = useRef<HTMLInputElement>(null);

  const lastSavedAt = useMemo(() => loadContentOverrides()?.updatedAt, [status]);
  const currentDraft = drafts[activeLang];

  useEffect(() => {
    document.title = "G.Hub 管理画面";
  }, []);

  const updateCurrentDraft = useCallback(
    (next: Record<string, unknown>) => {
      setDrafts((prev) => ({ ...prev, [activeLang]: next }));
    },
    [activeLang],
  );

  const handleSave = useCallback(() => {
    setStatus({ kind: "loading", message: "保存中…" });
    try {
      const overrides = persistAllLocaleDrafts(drafts);
      applyContentOverrides(i18n);
      void i18n.changeLanguage(i18n.language);
      setStatus({
        kind: "success",
        message: `3言語分を保存しました（${new Date(overrides.updatedAt).toLocaleString("ja-JP")}）`,
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "保存に失敗しました。",
      });
    }
  }, [drafts]);

  const handleExport = useCallback(() => {
    const overrides = loadContentOverrides();
    if (!overrides) {
      setStatus({ kind: "error", message: "エクスポートする保存データがありません。" });
      return;
    }
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ghub-content-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus({ kind: "success", message: "JSON をエクスポートしました。" });
  }, []);

  const handleImport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ContentOverrides;
      if (parsed.version !== 1 || !parsed.locales) {
        throw new Error("JSON 形式が正しくありません。");
      }
      saveContentOverrides(parsed);
      setDrafts(getAllEditableDrafts(parsed));
      applyContentOverrides(i18n);
      await i18n.changeLanguage(i18n.language);
      setStatus({ kind: "success", message: "インポートしました。" });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "インポートに失敗しました。",
      });
    }
  }, []);

  const handleReset = useCallback(() => {
    if (!window.confirm("保存済みのカスタム文言をすべて削除しますか？")) return;
    clearContentOverrides();
    setDrafts(getAllEditableDrafts(null));
    applyContentOverrides(i18n);
    void i18n.changeLanguage(i18n.language);
    setStatus({ kind: "success", message: "デフォルト文言に戻しました。" });
  }, []);

  return (
    <div className="admin-app flex h-[100dvh] flex-col overflow-hidden bg-[#F6F6F4] text-neutral-900">
      <header className="shrink-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
          <a
            href="#/"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
            サイトへ戻る
          </a>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight">G.Hub 文言管理</h1>
            <p className="text-xs text-neutral-500">
              全シーンの文言を日本語・英語・中文で個別に編集（管理者翻訳 / localStorage 保存）
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={status.kind === "loading"}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0057FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0046cc] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {status.kind === "loading" ? "保存中…" : "3言語を保存"}
          </button>
        </div>
      </header>

      <div className="admin-scroll min-h-0 flex-1">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <nav className="admin-scroll max-h-[min(52vh,28rem)] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-sm">
            {EDITABLE_SECTIONS.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-[#0057FF]/10 font-medium text-[#0057FF]" : "hover:bg-neutral-50"
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>

          <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm space-y-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-50"
            >
              <Download className="h-4 w-4" />
              JSON エクスポート
            </button>
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-50"
            >
              <Upload className="h-4 w-4" />
              JSON インポート
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4" />
              デフォルトに戻す
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
                e.target.value = "";
              }}
            />
          </div>
        </aside>

        <main className="flex min-h-[min(70vh,40rem)] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="shrink-0 border-b border-neutral-100 p-5 pb-4">
          <div
            className="mb-5 flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="編集言語"
          >
            {LANGUAGE_OPTIONS.map(({ code, nativeLabel }) => {
              const active = activeLang === code;
              return (
                <button
                  key={code}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveLang(code)}
                  className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[#0057FF] font-medium text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {nativeLabel}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">
              {EDITABLE_SECTIONS.find((section) => section.id === activeSection)?.label}
            </h2>
            {lastSavedAt && (
              <span className="text-xs text-neutral-500">
                最終保存: {new Date(lastSavedAt).toLocaleString("ja-JP")}
              </span>
            )}
          </div>
          </div>

          <div className="admin-scroll min-h-0 flex-1 px-5 pb-5">
            <SectionEditor
              sectionId={activeSection}
              draft={currentDraft}
              onDraftChange={updateCurrentDraft}
            />

            {status.message && (
              <p
                className={`mt-6 rounded-lg px-3 py-2 text-sm ${
                  status.kind === "error"
                    ? "bg-red-50 text-red-700"
                    : status.kind === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {status.message}
              </p>
            )}
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
