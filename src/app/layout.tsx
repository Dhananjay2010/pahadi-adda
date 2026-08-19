import type { Metadata } from "next";
import { Manrope, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Pahadi Adda",
  description:
    "A live listening room for Garhwali & Kumaoni pahadi songs, styled after Uttarakhand's hill temples.",
  openGraph: {
    title: "पहाड़ी अड्डा — Pahadi Adda",
    description:
      "A live listening room for Garhwali & Kumaoni pahadi songs — everyone hears the same song, sees who's around, and can chat.",
    url: siteUrl,
    siteName: "Pahadi Adda",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "पहाड़ी अड्डा — Pahadi Adda",
    description:
      "A live listening room for Garhwali & Kumaoni pahadi songs — everyone hears the same song, sees who's around, and can chat.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="hi"
      className={`${manrope.variable} ${notoSerifDevanagari.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
