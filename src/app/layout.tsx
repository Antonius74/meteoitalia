import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeteoItalia - Previsioni Meteo in Tempo Reale",
  description: "Previsioni meteo accurate per tutte le città italiane. Temperature, umidità, vento, precipitazioni e mappe interattive.",
  keywords: ["meteo", "previsioni", "Italia", "tempo", "temperature", "pioggia", "roma", "milano", "napoli"],
  authors: [{ name: "MeteoItalia" }],
  openGraph: {
    title: "MeteoItalia",
    description: "Previsioni meteo accurate per tutte le città italiane",
    type: "website",
    locale: "it_IT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
