"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { ItemWithDetails } from "@/lib/db/items";

function getCopyText(item: ItemWithDetails): string | null {
  const typeName = item.type.name.toLowerCase();

  if (typeName === "link" && item.url) return item.url;
  if (item.content) return item.content;
  if (item.fileUrl) return item.fileUrl;

  return item.title;
}

interface CopyButtonProps {
  item: ItemWithDetails;
  className?: string;
}

export default function CopyButton({ item, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const text = getCopyText(item);
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const Icon = copied ? Check : Copy;

  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 p-1.5 rounded-md transition-colors ${
        copied
          ? "text-green-500"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      } ${className}`}
      title="Copy"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
