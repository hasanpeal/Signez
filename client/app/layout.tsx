"use client";
import type { Metadata } from "next";
import Head from "next/head";
import { EmailProvider } from "@/context/UserContext";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <title>Signez</title>
        <meta
          name="description"
          content="Signez is a real-time sign language learning platform that uses advanced machine learning models to provide accurate predictions."
        />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="antialiased">
        <EmailProvider>{children}</EmailProvider>
      </body>
    </html>
  );
}
