import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Latest Insights Studio",
  description: "Generate polished newsletters and blog articles from the latest headlines in minutes."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
