"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCollection, toggleCollectionFavorite } from "@/actions/collections";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";

interface Collection {
  id: string;
  isFavorite: boolean;
}

export function useCollectionActions(collection: Collection) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const {
    isFavorite,
    toggling: togglingFav,
    handleToggleFavorite,
  } = useToggleFavorite(collection.id, collection.isFavorite, toggleCollectionFavorite);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCollection(collection.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete collection");
      return;
    }

    setDeleteOpen(false);
    toast.success("Collection deleted");
    router.push("/dashboard/collections");
    router.refresh();
  }

  return {
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    deleting,
    isFavorite,
    togglingFav,
    handleToggleFavorite,
    handleDelete,
  };
}
