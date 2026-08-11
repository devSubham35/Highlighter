import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await db.workspace.findFirst({
    where: {
      deletedAt: null,
      memberships: { some: { userId: session.user.id, suspended: false } },
    },
    orderBy: { name: "asc" },
    select: { id: true },
  });

  redirect(workspace ? `/workspaces/${workspace.id}/settings` : "/workspaces");
}
