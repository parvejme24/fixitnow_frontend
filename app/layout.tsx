import type { Metadata } from "next";
import {
  Archivo_Black,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";
import AppProviders from "./providers/AppProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dispatch-display",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-dispatch-sans",
  adjustFontFallback: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-dispatch-mono",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-hivis-mono",
});

export const metadata: Metadata = {
  title: "FixItNow",
  description: "Book verified home technicians in Dhaka on fixed time slots",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
