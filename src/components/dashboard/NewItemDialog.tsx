"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import CollectionPicker from "@/components/dashboard/CollectionPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { FileUpload } from "@/components/ui/file-upload";
import { CODE_LANGUAGES } from "@/lib/languages";
import {
  Plus,
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  FileIcon,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createItem } from "@/actions/items";
import SuggestTagsButton from "@/components/dashboard/SuggestTagsButton";
import SuggestDescriptionButton from "@/components/dashboard/SuggestDescriptionButton";

const ITEM_TYPES = [
  { value: "snippet" as const, label: "Snippet", color: "#3b82f6", icon: Code },
  { value: "prompt" as const, label: "Prompt", color: "#8b5cf6", icon: Sparkles },
  { value: "command" as const, label: "Command", color: "#f97316", icon: Terminal },
  { value: "note" as const, label: "Note", color: "#fde047", icon: StickyNote },
  { value: "file" as const, label: "File", color: "#6b7280", icon: FileIcon },
  { value: "image" as const, label: "Image", color: "#ec4899", icon: ImageIcon },
  { value: "link" as const, label: "Link", color: "#10b981", icon: LinkIcon },
];

export type ItemType = (typeof ITEM_TYPES)[number]["value"];

interface NewItemDialogProps {
  defaultType?: ItemType;
  children?: React.ReactNode;
  isPro?: boolean;
}

export default function NewItemDialog({ defaultType, children, isPro = false }: NewItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typeName, setTypeName] = useState<ItemType>(defaultType ?? "snippet");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);

  function resetForm() {
    setTypeName(defaultType ?? "snippet");
    setTitle("");
    setDescription("");
    setContent("");
    setLanguage("plaintext");
    setUrl("");
    setTagsInput("");
    setFileUrl("");
    setFileName("");
    setFileSize(0);
    setCollectionIds([]);
  }

  function fetchCollections() {
    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => setCollections(data))
      .catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const isFileType = typeName === "file" || typeName === "image";

    if (isFileType && !fileUrl) {
      toast.error("Please upload a file first");
      setLoading(false);
      return;
    }

    const result = await createItem({
      title,
      description: description || null,
      content: content || null,
      language: language || null,
      url: url || null,
      typeName,
      tags,
      fileUrl: isFileType ? fileUrl : null,
      fileName: isFileType ? fileName : null,
      fileSize: isFileType ? fileSize : null,
      collectionIds,
    });

    setLoading(false);

    if (!result.success) {
      const errorMsg =
        typeof result.error === "string"
          ? result.error
          : "Please check your input";
      toast.error(errorMsg);
      return;
    }

    toast.success("Item created");
    setOpen(false);
    resetForm();
    router.refresh();
  }

  const isFileType = typeName === "file" || typeName === "image";
  const showContent = !isFileType && typeName !== "link";
  const showLanguage = typeName === "snippet" || typeName === "command";
  const showUrl = typeName === "link";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) fetchCollections();
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger render={<Button />}>
        {children ?? (
          <>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">New Item</span>
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            {(() => {
              const selected = ITEM_TYPES.find((t) => t.value === typeName);
              if (!selected) return null;
              const Icon = selected.icon;
              return <Icon className="h-5 w-5" style={{ color: selected.color }} />;
            })()}
            New Item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={typeName}
              onValueChange={(val) => setTypeName(val as ItemType)}
            >
              <SelectTrigger id="type">
                {(() => {
                  const selected = ITEM_TYPES.find((t) => t.value === typeName);
                  if (!selected) return <SelectValue />;
                  const Icon = selected.icon;
                  return (
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" style={{ color: selected.color }} />
                      <SelectValue />
                    </span>
                  );
                })()}
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <t.icon className="h-4 w-4" style={{ color: t.color }} />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item title"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              {isPro && (
                <SuggestDescriptionButton
                  title={title}
                  content={content}
                  url={url}
                  fileName={fileName}
                  typeName={typeName}
                  onAccept={setDescription}
                />
              )}
            </div>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>

          {showLanguage && (
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(val) => setLanguage(val ?? "plaintext")}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showContent && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              {showLanguage ? (
                <CodeEditor
                  value={content}
                  onChange={setContent}
                  language={language}
                />
              ) : (
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                />
              )}
            </div>
          )}

          {showUrl && (
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
          )}

          {isFileType && (
            <div className="space-y-2">
              <Label>{typeName === "image" ? "Image" : "File"} *</Label>
              <FileUpload
                itemType={typeName as "file" | "image"}
                onUploadComplete={({ fileUrl, fileName, fileSize }) => {
                  setFileUrl(fileUrl);
                  setFileName(fileName);
                  setFileSize(fileSize);
                }}
                onUploadError={(error) => toast.error(error)}
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tags">Tags</Label>
              {isPro && (
                <SuggestTagsButton
                  title={title}
                  content={content}
                  existingTags={tagsInput
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)}
                  onAccept={(tag) => {
                    const current = tagsInput
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    if (current.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
                    setTagsInput([...current, tag].join(", "));
                  }}
                />
              )}
            </div>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Comma-separated tags"
            />
          </div>

          {collections.length > 0 && (
            <div className="space-y-2">
              <Label>Collections</Label>
              <CollectionPicker
                collections={collections}
                selectedIds={collectionIds}
                onChange={setCollectionIds}
              />
            </div>
          )}

          </div>

          <div className="flex justify-end gap-2 border-t bg-muted/50 p-4 rounded-b-xl">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
