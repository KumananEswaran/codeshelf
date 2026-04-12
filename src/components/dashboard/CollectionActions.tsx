"use client";

import { Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditCollectionDialog from "./EditCollectionDialog";
import CollectionDeleteDialog from "./CollectionDeleteDialog";
import { useCollectionActions } from "@/hooks/useCollectionActions";

interface CollectionActionsProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}

export default function CollectionActions({ collection }: CollectionActionsProps) {
  const {
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    deleting,
    isFavorite,
    togglingFav,
    handleToggleFavorite,
    handleDelete,
  } = useCollectionActions(collection);

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
          onClick={() => handleToggleFavorite()}
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

      <CollectionDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        name={collection.name}
        deleting={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
