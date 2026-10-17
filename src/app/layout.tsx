import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goodwin Grow CRM — Enterprise Multi-Tenant SaaS",
  description: "Advanced Multi-Tenant Customer Relationship Management SaaS by Goodwin Grow AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
