import { AuthLayoutChrome } from "@/components/auth/AuthLayoutChrome";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutChrome>{children}</AuthLayoutChrome>;
}
