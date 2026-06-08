import type { Metadata } from "next";
import { Web3Provider } from "@/components/web3/Web3Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velora AI Public Beta | AI-Powered Stablecoin Actions on Arc",
  description: "Velora AI Public Beta helps users send, swap, bridge, claim faucet, and check rewards with natural language on Arc.",
  applicationName: "Velora AI",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "Velora AI",
    description: "Experience AI-powered stablecoin actions on Arc.",
    siteName: "Velora AI",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Velora AI",
    description: "Talk to your wallet with Velora AI Public Beta."
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
