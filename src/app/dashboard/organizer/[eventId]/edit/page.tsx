"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.string().min(1),
  time: z.string().min(1),
  venue: z.string().min(2),
  category: z.string().min(2),
});

type EventInput = z.infer<typeof eventSchema>;

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const form = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
  });

  useEffect(() => {
    fetch(`/api/organizer/events/${params.eventId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const e = json.data;
          form.reset({
            title: e.title,
            description: e.description,
            date: e.date.slice(0, 10),
            time: e.time,
            venue: e.venue,
            category: e.category,
          });
        }
      })
      .catch(() => setError("Failed to load event"))
      .finally(() => setLoaded(true));
  }, [params.eventId, form]);

  const onSubmit = async (values: EventInput) => {
    setError(null);
    setIsLoading(true);

    const fileInput = document.getElementById("image") as HTMLInputElement | null;
    let image: string | undefined;

    if (fileInput?.files?.[0]) {
      const uploadData = new FormData();
      uploadData.append("file", fileInput.files[0]);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const uploadResult = await uploadRes.json();
      if (!uploadRes.ok || !uploadResult.success) {
        setError(uploadResult.error ?? "Image upload failed");
        setIsLoading(false);
        return;
      }
      image = uploadResult.data.url;
    }

    const response = await fetch(`/api/organizer/events/${params.eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, image }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setError(result.error ?? "Failed to update event");
      setIsLoading(false);
      return;
    }

    router.push(`/dashboard/organizer/${params.eventId}`);
  };

  if (!loaded) {
    return <div className="mx-auto max-w-2xl px-4 py-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
          <CardDescription>Update the event details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...form.register("description")} />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...form.register("date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" {...form.register("time")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" {...form.register("venue")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...form.register("category")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Event Image (optional)</Label>
              <Input id="image" type="file" accept="image/*" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
