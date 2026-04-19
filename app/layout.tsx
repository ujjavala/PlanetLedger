import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";


import "./globals.css";
import { AuthProvider } from "../components/auth-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

export const metadata: Metadata = {
  title: "PlanetLedger",
  description: "AI-powered sustainability finance dashboard with Auth0 agent context",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-[family-name:var(--font-space-grotesk)]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
