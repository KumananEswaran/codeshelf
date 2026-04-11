"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateAutoTags } from "@/actions/ai";

interface SuggestTagsButtonProps {
  title: string;
  content: string;
  existingTags: string[];
  onAccept: (tag: string) => void;
}

export default function SuggestTagsButton({
  title,
  content,
  existingTags,
  onAccept,
}: SuggestTagsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  async function handleSuggest() {
    if (!title.trim()) {
      toast.error("Add a title first to get suggestions");
      return;
    }
    setLoading(true);
    const result = await generateAutoTags({ title, content });
    setLoading(false);

    if (!result.success) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to suggest tags");
      return;
    }

    const existing = new Set(existingTags.map((t) => t.toLowerCase()));
    const fresh = result.data.filter((t) => !existing.has(t));
    if (fresh.length === 0) {
      toast.info("No new tag suggestions");
      return;
    }
    setSuggestions(fresh);
  }

  function accept(tag: string) {
    onAccept(tag);
    setSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  function reject(tag: string) {
    setSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSuggest}
        disabled={loading}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        Suggest tags
      </Button>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed border-border p-2">
          <span className="text-xs text-muted-foreground mr-1">Suggested:</span>
          {suggestions.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="gap-1 text-xs py-0.5 pr-0.5"
            >
              {tag}
              <button
                type="button"
                onClick={() => accept(tag)}
                aria-label={`Accept tag ${tag}`}
                className="rounded p-0.5 text-emerald-500 hover:bg-emerald-500/10"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => reject(tag)}
                aria-label={`Reject tag ${tag}`}
                className="rounded p-0.5 text-red-500 hover:bg-red-500/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
