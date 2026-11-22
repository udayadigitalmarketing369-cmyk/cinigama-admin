import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventSnap AI - Facial Recognition Photo Finder",
  description: "Find your photos from events instantly using AI facial recognition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

