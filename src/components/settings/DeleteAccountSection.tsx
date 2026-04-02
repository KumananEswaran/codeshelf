"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (confirmation !== "DELETE") return;

    setLoading(true);

    try {
      const res = await fetch("/api/profile/delete-account", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      await signOut({ callbackUrl: "/sign-in" });
    } catch {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-base text-destructive">
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={<Button variant="destructive" />}
          >
            Delete Account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This will permanently delete your account, all your items,
                collections, and tags. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <span className="font-mono font-bold">DELETE</span> to
                confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setConfirmation("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmation !== "DELETE" || loading}
              >
                {loading ? "Deleting..." : "Delete Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
