// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ClickEffect } from "@/components/ClickEffect";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PawLife Shelter Admin",
  description: "PawLife Shelter Admin",
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode; }) {
  return (
    <html lang="vi" className={beVietnamPro.variable} suppressHydrationWarning>
      <body className={`${beVietnamPro.className} font-sans antialiased bg-white text-gray-900`}>
        <ThemeProvider>
          {children}
          <ClickEffect />
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}