"use client";

import { MoreHorizontal, Pencil, Trash2, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditCollectionDialog from "./EditCollectionDialog";
import CollectionDeleteDialog from "./CollectionDeleteDialog";
import { useCollectionActions } from "@/hooks/useCollectionActions";

interface CollectionCardMenuProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}

export default function CollectionCardMenu({ collection }: CollectionCardMenuProps) {
  const {
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    deleting,
    isFavorite,
    handleToggleFavorite,
    handleDelete,
  } = useCollectionActions(collection);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="text-muted-foreground hover:text-foreground shrink-0 p-1 rounded-md hover:bg-accent"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleToggleFavorite()}>
            <Star className={`h-4 w-4 mr-2 ${isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
            {isFavorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
