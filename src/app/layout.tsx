import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Canvas — AI Knowledge Workspace",
  description:
    "Transform research PDFs into interactive knowledge graphs and chat with the document context. Powered by Gemini.",
  metadataBase: new URL("https://research-canvas.local"),
  openGraph: {
    title: "Intelligent Research Canvas",
    description:
      "Upload a paper. Get a knowledge graph, structured insights, and a context-aware chat — instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-obsidian text-ink antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
