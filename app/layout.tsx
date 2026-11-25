import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kwlstudio.shop"),
  title: "KWL STUDIO",
  description: "Drop 001. Reversible star belt.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "KWL STUDIO",
    description: "Drop 001. Reversible star belt.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0D0D",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plex.variable}>
      <body>{children}</body>
    </html>
  );
}
