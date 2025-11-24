export const metadata = {
  title: "Cyber Container Icon ? 3D Isometric",
  description:
    "Dark glass shipping container with neon numbers and gold coins ? export up to 8K.",
  icons: {
    icon: "/favicon.ico"
  },
  themeColor: "#020617"
};

import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

