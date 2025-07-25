import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prompt of the Day",
  description: "Your daily dose of creative inspiration with curated prompts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;650;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.cdnfonts.com/css/ginto-copilot"
          rel="stylesheet"
        />
        <style>{`
          @import url('https://fonts.cdnfonts.com/css/ginto-copilot');
          
          * {
            font-family: 'Ginto Copilot Variable', 'Ginto Copilot', Inter, system-ui, -apple-system, sans-serif !important;
          }
          
          body, html {
            font-family: 'Ginto Copilot Variable', 'Ginto Copilot', Inter, system-ui, -apple-system, sans-serif !important;
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: 'Ginto Copilot Variable, Ginto Copilot, Inter, system-ui, -apple-system, sans-serif !important' }}
      >
        {children}
      </body>
    </html>
  );
}
