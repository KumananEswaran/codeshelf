"use client";

import { useCallback, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorPreferences } from "@/contexts/EditorPreferencesContext";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
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
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
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
          <span className="ml-2 text-xs text-[#808080] font-mono select-none">
            {displayLanguage(language)}
          </span>
        </div>

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

      {/* Editor */}
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
    </div>
  );
}
