import { Button } from "@/components/ui/button";
import { Highlighter, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Highlighter className="h-7 w-7" />
      </div>
      <p className="mt-8 text-6xl font-bold tracking-tight text-foreground">404</p>
      <h1 className="mt-3 text-xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Button className="mt-8" render={<Link href="/" />}>
        <Home className="h-4 w-4" />
        Back to home
      </Button>
    </div>
  );
}
