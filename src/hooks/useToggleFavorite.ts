"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ToggleAction = (id: string) => Promise<{ success: boolean }>;

export function useToggleFavorite(
  id: string,
  initialValue: boolean,
  toggleAction: ToggleAction
) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialValue);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setIsFavorite(initialValue);
  }, [initialValue]);

  async function handleToggleFavorite(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (toggling) return;
    const previous = isFavorite;
    setIsFavorite(!previous);
    setToggling(true);
    const result = await toggleAction(id);
    setToggling(false);

    if (!result.success) {
      setIsFavorite(previous);
      toast.error("Failed to toggle favorite");
      return;
    }
    router.refresh();
  }

  return { isFavorite, toggling, handleToggleFavorite };
}
