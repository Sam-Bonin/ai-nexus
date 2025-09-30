import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude AI Clone",
  description: "A clone of Claude.ai built with Next.js and OpenRouter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}