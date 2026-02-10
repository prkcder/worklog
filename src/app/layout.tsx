import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "worklog",
  description: "Public notes, TILs, recipes, and workouts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
