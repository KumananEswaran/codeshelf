"use client";

import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Sparkles, Loader2, Crown, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { optimizePrompt } from "@/actions/ai";

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  showOptimize?: boolean;
  isPro?: boolean;
  onAcceptOptimized?: (optimized: string) => void | Promise<void>;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
  showOptimize = false,
  isPro = false,
  onAcceptOptimized,
}: MarkdownEditorProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">(
    readOnly ? "preview" : "write"
  );
  const [optimized, setOptimized] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [compareTab, setCompareTab] = useState<"original" | "optimized">(
    "optimized"
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

  const handleOptimize = useCallback(async () => {
    if (!value.trim()) {
      toast.error("Nothing to optimize");
      return;
    }
    setOptimizing(true);
    const result = await optimizePrompt({ content: value });
    setOptimizing(false);

    if (!result.success) {
      toast.error(
        typeof result.error === "string"
          ? result.error
          : "Failed to optimize prompt"
      );
      return;
    }

    setOptimized(result.data);
    setCompareTab("optimized");
  }, [value]);

  const handleAccept = useCallback(async () => {
    if (!optimized || !onAcceptOptimized) return;
    setAccepting(true);
    try {
      await onAcceptOptimized(optimized);
      setOptimized(null);
      toast.success("Prompt updated");
    } catch {
      toast.error("Failed to save optimized prompt");
    } finally {
      setAccepting(false);
    }
  }, [optimized, onAcceptOptimized]);

  const handleReject = useCallback(() => {
    setOptimized(null);
  }, []);

  const hasOptimized = optimized !== null;

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
          {hasOptimized ? (
            <div className="ml-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCompareTab("original")}
                className={cn(
                  "px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer",
                  compareTab === "original"
                    ? "text-[#cccccc] bg-[#1e1e1e]"
                    : "text-[#808080] hover:text-[#cccccc]"
                )}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setCompareTab("optimized")}
                className={cn(
                  "px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer",
                  compareTab === "optimized"
                    ? "text-[#cccccc] bg-[#1e1e1e]"
                    : "text-[#808080] hover:text-[#cccccc]"
                )}
              >
                Optimized
              </button>
            </div>
          ) : readOnly ? (
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

        <div className="flex items-center gap-3">
          {showOptimize && !hasOptimized &&
            (isPro ? (
              <button
                type="button"
                onClick={handleOptimize}
                disabled={optimizing}
                className="flex items-center gap-1.5 text-xs text-[#808080] hover:text-[#cccccc] transition-colors cursor-pointer disabled:opacity-60"
                aria-label="Optimize prompt with AI"
                title="Optimize prompt with AI"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Optimize</span>
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
                <span>Optimize</span>
              </span>
            ))}

          {hasOptimized && (
            <>
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="flex items-center justify-center size-6 rounded text-emerald-400 hover:text-emerald-300 hover:bg-[#1e1e1e] transition-colors cursor-pointer disabled:opacity-60"
                aria-label="Use optimized prompt"
                title="Use optimized prompt"
              >
                {accepting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={accepting}
                className="flex items-center justify-center size-6 rounded text-[#808080] hover:text-[#cccccc] hover:bg-[#1e1e1e] transition-colors cursor-pointer disabled:opacity-60"
                aria-label="Discard optimized prompt"
                title="Discard optimized prompt"
              >
                <X className="size-3.5" />
              </button>
            </>
          )}

          {!hasOptimized && (
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {hasOptimized ? (
          <div className="markdown-preview p-4 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {compareTab === "optimized" ? (optimized ?? "") : value}
            </ReactMarkdown>
          </div>
        ) : activeTab === "write" && !readOnly ? (
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
