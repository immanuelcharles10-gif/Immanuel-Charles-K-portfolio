import type { Metadata, Viewport } from "next";
import "./globals.css";
import SmoothScroller from "@/components/SmoothScroller";
import CustomCursor from "@/components/CustomCursor";
import BackgroundCanvas from "@/components/BackgroundCanvas";
import LoadingScreen from "@/components/LoadingScreen";
import Navigation from "@/components/Navigation";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Immanuel Charles K — Creative Technologist",
  description: "Portfolio of Immanuel Charles K — video editor, colorist, motion designer, full-stack developer and problem solver.",
  openGraph: {
    title: "Immanuel Charles K — Creative Technologist",
    description: "Portfolio of Immanuel Charles K — video editor, colorist, motion designer, full-stack developer and problem solver.",
    url: "https://immanuelcharles.com",
    siteName: "Immanuel Charles K Portfolio",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LoadingScreen />
        <CustomCursor />
        <BackgroundCanvas />
        <Navigation />
        <SmoothScroller>
          {children}
        </SmoothScroller>
      </body>
    </html>
  );
}
