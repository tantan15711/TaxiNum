import type { Metadata } from "next";
import { headers } from "next/headers";
import type { Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#10B981",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = new URL(`${protocol}://${host}`);
  const description =
    "Perfil QR para que taxistas muestren su numero de transferencia de forma rapida.";

  return {
    title: "TaxiNum",
    description,
    applicationName: "TaxiNum",
    metadataBase,
    icons: {
      icon: [
        {
          url: "/favicon.svg",
          type: "image/svg+xml",
        },
      ],
      shortcut: "/favicon.svg",
      apple: "/favicon.svg",
    },
    appleWebApp: {
      capable: true,
      title: "TaxiNum",
      statusBarStyle: "black-translucent",
    },
    openGraph: {
      title: "TaxiNum",
      description,
      type: "website",
      images: [
        {
          url: new URL("/og.png", metadataBase).toString(),
          width: 1200,
          height: 630,
          alt: "TaxiNum: Escanea. Copia. Transfiere.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "TaxiNum",
      description,
      images: [new URL("/og.png", metadataBase).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
