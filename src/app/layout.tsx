import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Banasthali Vidyapith CRM",
  description:
    "University CRM & Student Engagement Portal for Banasthali Vidyapith — lead-to-enrolment, ERP handoff, post-admission engagement, AI assistant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
