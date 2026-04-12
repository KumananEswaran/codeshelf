import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ItemDrawerDetailsProps {
  createdAt: Date;
  updatedAt: Date;
}

export default function ItemDrawerDetails({
  createdAt,
  updatedAt,
}: ItemDrawerDetailsProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="text-sm font-medium">Details</h4>
      </div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <span className="text-muted-foreground">Created</span>
        <span>{formatDate(createdAt)}</span>
        <span className="text-muted-foreground">Updated</span>
        <span>{formatDate(updatedAt)}</span>
      </div>
    </div>
  );
}
