import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/dashboard/tickets">
        <Button variant="secondary" className="w-full justify-start">
          My Tickets
        </Button>
      </Link>
      <Link href="/dashboard/organizer">
        <Button variant="secondary" className="w-full justify-start">
          Organizer
        </Button>
      </Link>
      <Link href="/admin">
        <Button variant="secondary" className="w-full justify-start">
          Admin
        </Button>
      </Link>
    </div>
  );
}
