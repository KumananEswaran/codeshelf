"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Pin,
  Copy,
  Pencil,
  Trash2,
  Tag,
  FolderOpen,
  Calendar,
  Loader2,
  Save,
  X,
  Download,
  FileIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CODE_LANGUAGES } from "@/lib/languages";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Separator } from "@/components/ui/separator";
import { getIcon } from "@/lib/icon-map";
import { formatDate, formatFileSize, getDownloadUrl } from "@/lib/utils";
import { updateItem, deleteItem, toggleItemFavorite, toggleItemPin } from "@/actions/items";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CollectionPicker from "@/components/dashboard/CollectionPicker";
import SuggestTagsButton from "@/components/dashboard/SuggestTagsButton";
import SuggestDescriptionButton from "@/components/dashboard/SuggestDescriptionButton";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerProps {
  itemId: string | null;
  onClose: () => void;
  isPro?: boolean;
}

const CONTENT_TYPES = ["snippet", "prompt", "command", "note"];
const LANGUAGE_TYPES = ["snippet", "command"];

export default function ItemDrawer({ itemId, onClose, isPro = false }: ItemDrawerProps) {
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      setEditing(false);
      return;
    }

    setLoading(true);
    fetch(`/api/items/${itemId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setItem({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [itemId]);

  function enterEditMode() {
    if (!item) return;
    setTitle(item.title);
    setDescription(item.description ?? "");
    setContent(item.content ?? "");
    setLanguage(item.language ?? "plaintext");
    setUrl(item.url ?? "");
    setTagsInput(item.tags.map((t) => t.name).join(", "));
    setCollectionIds(item.collections?.map((c) => c.id) ?? []);
    setEditing(true);

    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => setCollections(data))
      .catch(() => {});
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleSave() {
    if (!item) return;

    setSaving(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await updateItem(item.id, {
      title,
      description: description || null,
      content: content || null,
      language: language || null,
      url: url || null,
      tags,
      collectionIds,
    });

    setSaving(false);

    if (!result.success) {
      const errorMsg =
        typeof result.error === "string"
          ? result.error
          : "Validation failed. Check your inputs.";
      toast.error(errorMsg);
      return;
    }

    setItem({
      ...result.data,
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    });
    setEditing(false);
    toast.success("Item updated");
    router.refresh();
  }

  async function handleDelete() {
    if (!item) return;

    setDeleting(true);
    const result = await deleteItem(item.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete item");
      return;
    }

    toast.success("Item deleted");
    onClose();
    router.refresh();
  }

  const IconComponent = item ? getIcon(item.type.icon) : null;
  const typeName = item?.type.name ?? "";

  return (
    <Sheet open={!!itemId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : item ? (
          <>
            <SheetHeader className="pb-0">
              <div className="flex items-center gap-2 mb-1">
                {IconComponent && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1"
                    style={
                      item.type.color ? { color: item.type.color } : undefined
                    }
                  >
                    <IconComponent className="h-3 w-3" />
                    {item.type.name.charAt(0).toUpperCase() +
                      item.type.name.slice(1)}
                  </Badge>
                )}
                {item.language && !editing && (
                  <Badge variant="secondary" className="text-xs">
                    {item.language}
                  </Badge>
                )}
              </div>
              {editing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="text-lg font-semibold"
                />
              ) : (
                <SheetTitle className="text-lg">{item.title}</SheetTitle>
              )}
              <SheetDescription className="sr-only">
                Item details
              </SheetDescription>
            </SheetHeader>

            {/* Action Bar */}
            {editing ? (
              <div className="flex items-center gap-2 px-4">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    item.isFavorite
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  }
                  onClick={async () => {
                    const result = await toggleItemFavorite(item.id);
                    if (result.success) {
                      setItem({ ...item, isFavorite: !item.isFavorite });
                      router.refresh();
                    } else {
                      toast.error("Failed to toggle favorite");
                    }
                  }}
                >
                  <Star
                    className={`h-4 w-4 ${item.isFavorite ? "fill-yellow-500" : ""}`}
                  />
                  Favorite
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    item.isPinned
                      ? "text-blue-500"
                      : "text-muted-foreground"
                  }
                  onClick={async () => {
                    const prev = item.isPinned;
                    setItem({ ...item, isPinned: !prev });
                    const result = await toggleItemPin(item.id);
                    if (result.success) {
                      toast.success(prev ? "Unpinned" : "Pinned");
                      router.refresh();
                    } else {
                      setItem({ ...item, isPinned: prev });
                      toast.error("Failed to toggle pin");
                    }
                  }}
                >
                  <Pin
                    className={`h-4 w-4 ${item.isPinned ? "fill-blue-500" : ""}`}
                  />
                  {item.isPinned ? "Unpin" : "Pin"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={enterEditMode}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <div className="flex-1" />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={deleting}
                      />
                    }
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{item.title}&quot;.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            <Separator className="mx-4" />

            {/* Content */}
            <div className="px-4 space-y-4">
              {/* Description */}
              {editing ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">Description</h4>
                    {isPro && (
                      <SuggestDescriptionButton
                        title={title}
                        content={content}
                        url={url}
                        fileName={item.fileName ?? ""}
                        typeName={typeName}
                        onAccept={setDescription}
                      />
                    )}
                  </div>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
              ) : (
                item.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                )
              )}

              {/* Language (type-specific, edit mode — shown above content) */}
              {editing && LANGUAGE_TYPES.includes(typeName) ? (
                <div>
                  <h4 className="text-sm font-medium mb-1">Language</h4>
                  <Select value={language} onValueChange={(val) => setLanguage(val ?? "plaintext")}>
                    <SelectTrigger>
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
              ) : null}

              {/* Content (type-specific) */}
              {editing && CONTENT_TYPES.includes(typeName) ? (
                <div>
                  <h4 className="text-sm font-medium mb-1">Content</h4>
                  {LANGUAGE_TYPES.includes(typeName) ? (
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
              ) : (
                item.content && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Content</h4>
                    {LANGUAGE_TYPES.includes(typeName) ? (
                      <CodeEditor
                        value={item.content}
                        language={item.language ?? undefined}
                        readOnly
                        showExplain
                        isPro={isPro}
                        typeName={typeName as "snippet" | "command"}
                      />
                    ) : (
                      <MarkdownEditor
                        value={item.content}
                        readOnly
                        showOptimize={typeName === "prompt"}
                        isPro={isPro}
                        onAcceptOptimized={async (optimized) => {
                          const result = await updateItem(item.id, {
                            title: item.title,
                            description: item.description,
                            content: optimized,
                            language: item.language,
                            url: item.url,
                            tags: item.tags.map((t) => t.name),
                            collectionIds:
                              item.collections?.map((c) => c.id) ?? [],
                          });
                          if (!result.success) {
                            throw new Error("Update failed");
                          }
                          setItem({
                            ...result.data,
                            createdAt: new Date(result.data.createdAt),
                            updatedAt: new Date(result.data.updatedAt),
                          });
                          router.refresh();
                        }}
                      />
                    )}
                  </div>
                )
              )}

              {/* URL (type-specific) */}
              {editing && typeName === "link" ? (
                <div>
                  <h4 className="text-sm font-medium mb-1">URL</h4>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              ) : (
                item.url && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">URL</h4>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline break-all"
                    >
                      {item.url}
                    </a>
                  </div>
                )
              )}

              {/* Image Preview */}
              {item.fileUrl && typeName === "image" && !editing && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Preview</h4>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.fileUrl}
                    alt={item.fileName ?? item.title}
                    className="max-h-64 rounded-md object-contain border border-border"
                  />
                </div>
              )}

              {/* File Info & Download */}
              {item.fileName && !editing && (
                <div>
                  <h4 className="text-sm font-medium mb-2">File</h4>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
                    <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.fileName}
                      </p>
                      {item.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.fileSize)}
                        </p>
                      )}
                    </div>
                    {item.fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(getDownloadUrl(item.fileUrl!), "_blank");
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Collections */}
              {editing && collections.length > 0 ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Collections</h4>
                  </div>
                  <CollectionPicker
                    collections={collections}
                    selectedIds={collectionIds}
                    onChange={setCollectionIds}
                  />
                </div>
              ) : null}

              {/* Tags */}
              {editing ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      <h4 className="text-sm font-medium">Tags</h4>
                    </div>
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
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Comma-separated tags"
                  />
                </div>
              ) : (
                item.tags.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      <h4 className="text-sm font-medium">Tags</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag.name}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Collections (display only) */}
              {item.collections && item.collections.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Collections</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.collections.map((col) => (
                      <Badge key={col.id} variant="secondary" className="text-xs">
                        {col.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Details (display only) */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(item.createdAt)}</span>
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDate(item.updatedAt)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Item not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
