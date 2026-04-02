"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteCollection, toggleCollectionFavorite } from "@/actions/collections";
import EditCollectionDialog from "./EditCollectionDialog";

interface CollectionActionsProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}

export default function CollectionActions({ collection }: CollectionActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const [togglingFav, setTogglingFav] = useState(false);

  useEffect(() => {
    setIsFavorite(collection.isFavorite);
  }, [collection.isFavorite]);

  async function handleToggleFavorite() {
    setTogglingFav(true);
    setIsFavorite(!isFavorite);
    const result = await toggleCollectionFavorite(collection.id);
    setTogglingFav(false);

    if (!result.success) {
      setIsFavorite(isFavorite);
      toast.error("Failed to toggle favorite");
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCollection(collection.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete collection");
      return;
    }

    toast.success("Collection deleted");
    router.push("/dashboard/collections");
  }

  return (
    <>
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditOpen(true)}
          title="Edit collection"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          title="Delete collection"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${isFavorite ? "text-yellow-500" : ""}`}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={handleToggleFavorite}
          disabled={togglingFav}
        >
          <Star
            className={`h-4 w-4 ${isFavorite ? "fill-yellow-500" : ""}`}
          />
        </Button>
      </div>

      <EditCollectionDialog
        collection={collection}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete &ldquo;{collection.name}&rdquo;. Items in this
              collection will not be deleted — they will just no longer belong
              to this collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
