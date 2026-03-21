import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NewItemDialog from "@/components/dashboard/NewItemDialog";

export default function TopBar() {
  return (
    <div className="flex items-center justify-between flex-1 min-w-0">
      <div className="relative max-w-sm w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search items..." className="pl-9" />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
        <NewItemDialog />
      </div>
    </div>
  );
}
