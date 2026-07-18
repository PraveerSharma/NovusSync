import "@fontsource-variable/manrope/index.css";
import "@fontsource-variable/newsreader/index.css";
import "./styles/globals.css";
import { APP_NAME } from "@novussync/config";
import type { ReactNode } from "react";

function resolveMetadataBase(): URL {
  const vercelHost = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (process.env.VERCEL === "1" && vercelHost) {
    return new URL(`https://${vercelHost}`);
  }

  return new URL(process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000");
}

export const metadata = {
  metadataBase: resolveMetadataBase(),
  title: APP_NAME,
  description: "Approval-controlled marketing operations, from campaign to outcome.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
