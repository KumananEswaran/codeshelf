"use client";

import { useCallback, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Check, Copy, Sparkles, Loader2, Crown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEditorPreferences } from "@/contexts/EditorPreferencesContext";
import { explainCode } from "@/actions/ai";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  showExplain?: boolean;
  isPro?: boolean;
  typeName?: "snippet" | "command";
}

const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  md: "markdown",
  jsx: "javascript",
  tsx: "typescript",
};

function normalizeLanguage(lang?: string): string {
  if (!lang) return "plaintext";
  const lower = lang.toLowerCase().trim();
  return LANGUAGE_MAP[lower] || lower;
}

function displayLanguage(lang?: string): string {
  if (!lang) return "plaintext";
  return lang.toLowerCase().trim();
}

function defineCustomThemes(monaco: Parameters<OnMount>[1]) {
  monaco.editor.defineTheme("monokai", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "75715E", fontStyle: "italic" },
      { token: "keyword", foreground: "F92672" },
      { token: "string", foreground: "E6DB74" },
      { token: "number", foreground: "AE81FF" },
      { token: "type", foreground: "66D9EF", fontStyle: "italic" },
      { token: "function", foreground: "A6E22E" },
      { token: "variable", foreground: "F8F8F2" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#F8F8F2",
      "editor.lineHighlightBackground": "#3E3D32",
      "editorLineNumber.foreground": "#75715E",
    },
  });

  monaco.editor.defineTheme("github-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8B949E", fontStyle: "italic" },
      { token: "keyword", foreground: "FF7B72" },
      { token: "string", foreground: "A5D6FF" },
      { token: "number", foreground: "79C0FF" },
      { token: "type", foreground: "FFA657" },
      { token: "function", foreground: "D2A8FF" },
      { token: "variable", foreground: "C9D1D9" },
    ],
    colors: {
      "editor.background": "#0D1117",
      "editor.foreground": "#C9D1D9",
      "editor.lineHighlightBackground": "#161B22",
      "editorLineNumber.foreground": "#484F58",
    },
  });
}

const THEME_BACKGROUNDS: Record<string, string> = {
  "vs-dark": "#1e1e1e",
  monokai: "#272822",
  "github-dark": "#0D1117",
};

const THEME_HEADER_BACKGROUNDS: Record<string, string> = {
  "vs-dark": "#2d2d2d",
  monokai: "#1e1f1c",
  "github-dark": "#161B22",
};

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  className,
  showExplain = false,
  isPro = false,
  typeName = "snippet",
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "explain">("code");
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const { preferences } = useEditorPreferences();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silently
    }
  }, [value]);

  const handleExplain = useCallback(async () => {
    if (!value.trim()) {
      toast.error("Nothing to explain");
      return;
    }
    setExplaining(true);
    const result = await explainCode({
      content: value,
      language: language ?? "",
      typeName,
    });
    setExplaining(false);

    if (!result.success) {
      toast.error(
        typeof result.error === "string"
          ? result.error
          : "Failed to generate explanation"
      );
      return;
    }

    setExplanation(result.data);
    setActiveTab("explain");
  }, [value, language, typeName]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    defineCustomThemes(monaco);
    monaco.editor.setTheme(preferences.theme);
  };

  const lineCount = value.split("\n").length;
  const lineHeight = 20;
  const padding = 16;
  const editorHeight = Math.min(lineCount * lineHeight + padding, 400);

  const bg = THEME_BACKGROUNDS[preferences.theme] ?? "#1e1e1e";
  const headerBg = THEME_HEADER_BACKGROUNDS[preferences.theme] ?? "#2d2d2d";

  const hasExplanation = explanation !== null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border",
        className
      )}
      style={{ backgroundColor: bg }}
    >
      {/* macOS-style header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-[#404040]"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-[#ff5f57]" />
            <div className="size-3 rounded-full bg-[#febc2e]" />
            <div className="size-3 rounded-full bg-[#28c840]" />
          </div>

          {hasExplanation ? (
            <div className="ml-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={cn(
                  "px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer",
                  activeTab === "code"
                    ? "text-[#cccccc] bg-[#1e1e1e]"
                    : "text-[#808080] hover:text-[#cccccc]"
                )}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("explain")}
                className={cn(
                  "px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer",
                  activeTab === "explain"
                    ? "text-[#cccccc] bg-[#1e1e1e]"
                    : "text-[#808080] hover:text-[#cccccc]"
                )}
              >
                Explain
              </button>
            </div>
          ) : (
            <span className="ml-2 text-xs text-[#808080] font-mono select-none">
              {displayLanguage(language)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showExplain && !hasExplanation &&
            (isPro ? (
              <button
                type="button"
                onClick={handleExplain}
                disabled={explaining}
                className="flex items-center gap-1.5 text-xs text-[#808080] hover:text-[#cccccc] transition-colors cursor-pointer disabled:opacity-60"
                aria-label="Explain code with AI"
                title="Explain code with AI"
              >
                {explaining ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Explaining...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Explain</span>
                  </>
                )}
              </button>
            ) : (
              <span
                className="flex items-center gap-1.5 text-xs text-[#808080] cursor-not-allowed opacity-70"
                title="AI features require Pro subscription"
                aria-label="AI features require Pro subscription"
              >
                <Crown className="size-3.5" />
                <span>Explain</span>
              </span>
            ))}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[#808080] hover:text-[#cccccc] transition-colors cursor-pointer"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      {hasExplanation && activeTab === "explain" ? (
        <div className="markdown-preview p-4 text-sm max-h-[400px] overflow-y-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {explanation ?? ""}
          </ReactMarkdown>
        </div>
      ) : (
        <Editor
          height={editorHeight}
          language={normalizeLanguage(language)}
          value={value}
          onChange={(val) => onChange?.(val ?? "")}
          onMount={handleMount}
          theme={preferences.theme}
          options={{
            readOnly,
            minimap: { enabled: preferences.minimap },
            scrollBeyondLastLine: false,
            lineNumbers: readOnly ? "on" : "on",
            renderLineHighlight: readOnly ? "none" : "line",
            fontSize: preferences.fontSize,
            fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
            lineHeight: 20,
            padding: { top: 8, bottom: 8 },
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            contextmenu: false,
            wordWrap: preferences.wordWrap ? "on" : "off",
            domReadOnly: readOnly,
            cursorStyle: readOnly ? "underline-thin" : "line",
            tabSize: preferences.tabSize,
            automaticLayout: true,
            fixedOverflowWidgets: true,
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 8,
            lineNumbersMinChars: 3,
          }}
        />
      )}
    </div>
  );
}
