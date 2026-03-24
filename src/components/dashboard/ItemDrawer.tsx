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
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Separator } from "@/components/ui/separator";
import { getIcon } from "@/lib/icon-map";
import { formatDate } from "@/lib/utils";
import { updateItem, deleteItem } from "@/actions/items";
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
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerProps {
  itemId: string | null;
  onClose: () => void;
}

const CONTENT_TYPES = ["snippet", "prompt", "command", "note"];
const LANGUAGE_TYPES = ["snippet", "command"];

export default function ItemDrawer({ itemId, onClose }: ItemDrawerProps) {
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
    setLanguage(item.language ?? "");
    setUrl(item.url ?? "");
    setTagsInput(item.tags.map((t) => t.name).join(", "));
    setEditing(true);
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
                >
                  <Star
                    className={`h-4 w-4 ${item.isFavorite ? "fill-yellow-500" : ""}`}
                  />
                  Favorite
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <Pin className="h-4 w-4" />
                  Pin
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
                  <h4 className="text-sm font-medium mb-1">Description</h4>
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
                      />
                    ) : (
                      <MarkdownEditor
                        value={item.content}
                        readOnly
                      />
                    )}
                  </div>
                )
              )}

              {/* Language (type-specific) */}
              {editing && LANGUAGE_TYPES.includes(typeName) ? (
                <div>
                  <h4 className="text-sm font-medium mb-1">Language</h4>
                  <Input
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. javascript, python"
                  />
                </div>
              ) : null}

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

              {item.fileName && !editing && (
                <div>
                  <h4 className="text-sm font-medium mb-1">File</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.fileName}
                    {item.fileSize && (
                      <span className="ml-2">
                        ({(item.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Tags */}
              {editing ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Tags</h4>
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

              {/* Collection (display only) */}
              {item.collection && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Collection</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.collection.name}
                  </p>
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
