import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

export default async function AdminPage() {
  const user = await getSessionUser();

  const pendingOrganizers = await prisma.user.findMany({
    where: { role: "ORGANIZER", approved: false },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  const events = await prisma.event.findMany({
    include: {
      organizer: { select: { name: true, email: true } },
      _count: { select: { tickets: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Logged in as {user.email}
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Pending Organizer Approvals</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Registered</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrganizers.map((organizer) => (
                <tr key={organizer.id} className="border-b">
                  <td className="py-2">{organizer.name}</td>
                  <td className="py-2">{organizer.email}</td>
                  <td className="py-2">
                    {new Date(organizer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <form
                      className="flex items-center gap-2"
                      action={`/api/admin/organizers/${organizer.id}/approve`}
                      method="POST"
                    >
                      <input type="hidden" name="action" value="approve" />
                      <Button type="submit" size="sm">
                        Approve
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {pendingOrganizers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-muted-foreground">
                    No pending organizers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">All Events</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Organizer</th>
                <th className="text-left py-2">Tickets</th>
                <th className="text-left py-2">Orders</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b">
                  <td className="py-2">{event.title}</td>
                  <td className="py-2">{event.organizer.name}</td>
                  <td className="py-2">{event._count.tickets}</td>
                  <td className="py-2">{event._count.orders}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-muted-foreground">
                    No events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
