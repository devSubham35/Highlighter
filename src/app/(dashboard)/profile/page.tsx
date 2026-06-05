import { ContentContainer } from "@/components/common/ContentContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <ContentContainer>
      <div className="space-y-6">
        <PageHeader title="Profile" description="Your account information." />
        <Card className="border border-sidebar-border shadow-sm dark:bg-surface-elevated">
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
      </div>
    </ContentContainer>
  );
}
