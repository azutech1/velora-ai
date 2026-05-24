import type { Metadata } from "next";
import { Web3Provider } from "@/components/web3/Web3Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velora AI | AI-Native Stablecoin OS on Arc",
  description: "Velora AI is the AI-native stablecoin operating system on Arc.",
  applicationName: "Velora AI",
  icons: {
    icon: "/favicon.ico"
  },
  openGraph: {
    title: "Velora AI",
    description: "AI-native stablecoin operating system on Arc.",
    siteName: "Velora AI",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Velora AI",
    description: "Smart stablecoin payments for the AI economy."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
