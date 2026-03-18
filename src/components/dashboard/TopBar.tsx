import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-6 h-14.25 border-b border-border bg-background shrink-0">
      <div className="relative max-w-sm w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Item
        </Button>
      </div>
    </header>
  );
}
