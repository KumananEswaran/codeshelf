"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateSummary } from "@/actions/ai";

interface SuggestDescriptionButtonProps {
  title: string;
  content?: string;
  url?: string;
  fileName?: string;
  typeName?: string;
  onAccept: (summary: string) => void;
}

export default function SuggestDescriptionButton({
  title,
  content = "",
  url = "",
  fileName = "",
  typeName = "",
  onAccept,
}: SuggestDescriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSuggest() {
    if (!title.trim()) {
      toast.error("Add a title first to get a description");
      return;
    }

    setLoading(true);
    const result = await generateSummary({ title, content, url, fileName, typeName });
    setLoading(false);

    if (!result.success) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to generate description");
      return;
    }

    onAccept(result.data);
    toast.success("Description generated");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSuggest}
      disabled={loading}
      aria-label="Generate description with AI"
      title="Generate description with AI"
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      Suggest description
    </Button>
  );
}
