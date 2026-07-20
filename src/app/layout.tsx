import "./globals.css";
import { Providers } from "@/app/providers";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Google_Sans, Roboto } from "next/font/google";

const poppins = Google_Sans({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "Highlighter",
  description: "Visual bug reporting SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        poppins.variable
      )}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}