// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { ServiceProvider } from "@/app/context/ServiceContext";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Krownbraids - Luxury Hair & Beauty Studio",
  description: "Krownbraids is a premium salon booking platform for hair, makeup, and nail services. Book your appointment today.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#172554",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${sora.variable} h-full`}>
      <body className="min-h-dvh h-full antialiased">
        <ServiceProvider>
          {children}
        </ServiceProvider>
      </body>
    </html>
  );
}