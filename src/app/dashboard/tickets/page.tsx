import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function AttendeeTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const tickets = user
    ? await prisma.ticket.findMany({
        where: { userId: user.id },
        include: {
          event: { select: { title: true } },
          ticketTier: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

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
