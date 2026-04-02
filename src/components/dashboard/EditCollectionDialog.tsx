"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { updateCollection } from "@/actions/collections";

interface EditCollectionDialogProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: EditCollectionDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");

  useEffect(() => {
    if (open) {
      setName(collection.name);
      setDescription(collection.description ?? "");
    }
  }, [open, collection.name, collection.description]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await updateCollection(collection.id, {
      name,
      description: description || null,
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

    toast.success("Collection updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Edit Collection
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-collection-name">Name *</Label>
            <Input
              id="edit-collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Collection name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-collection-description">Description</Label>
            <Textarea
              id="edit-collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection about?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
