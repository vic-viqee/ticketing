"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        router.push("/dashboard/organizer");
      } else {
        alert(json.error ?? "Failed to delete event");
      }
    } catch {
      alert("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? "Deleting..." : "Delete"}
    </Button>
  );
}