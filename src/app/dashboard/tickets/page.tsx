import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type TicketWithRelations = {
  id: string;
  checkedIn: boolean;
  event: { title: string };
  ticketTier: { name: string };
};

export default async function AttendeeTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/user/tickets`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div>
        <h2 className="text-xl font-semibold">My Tickets</h2>
        <p className="mt-2 text-muted-foreground">Failed to load tickets.</p>
      </div>
    );
  }

  const json = (await res.json()) as {
    success: boolean;
    data: TicketWithRelations[];
  };
  const tickets = json.data ?? [];

  return (
    <div>
      <h2 className="text-xl font-semibold">My Tickets</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Event</th>
              <th className="text-left py-2">Ticket</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Ticket</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b">
                <td className="py-2">{ticket.event.title}</td>
                <td className="py-2">{ticket.ticketTier.name}</td>
                <td className="py-2">
                  {ticket.checkedIn ? "Checked In" : "Not checked in"}
                </td>
                <td className="py-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/api/tickets/${ticket.id}/download`}>
                      Download PDF
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-muted-foreground">
                  No tickets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
