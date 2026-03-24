"use client";

import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
}: MarkdownEditorProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">(
    readOnly ? "preview" : "write"
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silently
    }
  }, [value]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#1e1e1e]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#2d2d2d] border-b border-[#404040]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-[#ff5f57]" />
            <div className="size-3 rounded-full bg-[#febc2e]" />
            <div className="size-3 rounded-full bg-[#28c840]" />
          </div>

          {/* Tabs */}
          {readOnly ? (
            <span className="ml-2 text-xs text-[#808080] font-mono select-none">
              preview
            </span>
          ) : (
            <div className="ml-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("write")}
                className={cn(
                  "px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer",
                  activeTab === "write"
                    ? "text-[#cccccc] bg-[#1e1e1e]"
                    : "text-[#808080] hover:text-[#cccccc]"
                )}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer",
                  activeTab === "preview"
                    ? "text-[#cccccc] bg-[#1e1e1e]"
                    : "text-[#808080] hover:text-[#cccccc]"
                )}
              >
                Preview
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-[#808080] hover:text-[#cccccc] transition-colors cursor-pointer"
          aria-label="Copy content"
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

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {activeTab === "write" && !readOnly ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Write markdown content..."
            className="w-full min-h-[200px] bg-transparent text-sm text-[#d4d4d4] font-mono p-4 resize-none focus:outline-none placeholder:text-[#555555]"
          />
        ) : (
          <div className="markdown-preview p-4 text-sm">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-[#555555] italic">Nothing to preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
