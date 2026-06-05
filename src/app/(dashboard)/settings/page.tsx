import { PageHeader } from "@/components/common/PageHeader";
import { CreateOrganizationForm } from "@/components/projects/CreateOrganizationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const organizations = await db.organization.findMany({
    where: { memberships: { some: { userId: session!.user.id } } },
    include: { memberships: { include: { user: true } }, invitations: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Account, organization, and team management."
      />
      <Card className="border border-sidebar-border shadow-sm dark:bg-[#1a1d21]">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="account-name">Name</Label>
            <Input id="account-name" value={session!.user.name ?? ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" value={session!.user.email ?? ""} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" placeholder="New password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input id="confirm-password" type="password" placeholder="Confirm password" />
          </div>
        </CardContent>
      </Card>
      <CreateOrganizationForm />
      {organizations.map((org) => (
        <Card key={org.id} className="border border-sidebar-border shadow-sm dark:bg-[#1a1d21]">
          <CardHeader>
            <CardTitle>{org.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Team members</h3>
            <div className="divide-y divide-sidebar-border overflow-hidden rounded-xl border border-sidebar-border">
              {org.memberships.map((membership) => (
                <div key={membership.id} className="flex items-center justify-between p-3 text-sm">
                  <span className="text-foreground">{membership.user.email}</span>
                  <span className="text-muted-foreground">{membership.role.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
