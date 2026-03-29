"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface CollectionOption {
  id: string;
  name: string;
}

interface CollectionPickerProps {
  collections: CollectionOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function CollectionPicker({
  collections,
  selectedIds,
  onChange,
}: CollectionPickerProps) {
  function toggleCollection(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  const selectedNames = collections
    .filter((c) => selectedIds.includes(c.id))
    .map((c) => c.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className="truncate">
          {selectedNames.length > 0
            ? selectedNames.join(", ")
            : "None"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--trigger-width)">
        {collections.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            checked={selectedIds.includes(col.id)}
            onCheckedChange={() => toggleCollection(col.id)}
          >
            {col.name}
          </DropdownMenuCheckboxItem>
        ))}
        {collections.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No collections
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
