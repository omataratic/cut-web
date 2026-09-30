import type { Metadata } from "next";
import { IBM_Plex_Sans, Libre_Baskerville, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "./globals.css";

const cutSans = IBM_Plex_Sans({
  variable: "--font-cut-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const cutSerif = Libre_Baskerville({
  variable: "--font-cut-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const cutMono = Geist_Mono({
  variable: "--font-cut-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cut — Film crowdfunding on Robinhood Chain",
  description:
    "Cut ($CUT): experimental film preview crowdfunding. Pledge on Robinhood Chain. Not financial advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cutSans.variable} ${cutSerif.variable} ${cutMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cut-cream font-sans text-cut-charcoal">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
