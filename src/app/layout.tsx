import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cockpit",
  description: "One screen for everything I need to deal with today.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-bg text-text">{children}</body>
    </html>
  );
}
