import type { Metadata } from "next";
import { Manrope, Yatra_One } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

// Devanagari display face for headings only (site title, song names, panel
// headers) — a hand-painted signboard character that fits an "अड्डा"
// (village gathering spot). Everything else stays on Manrope, unchanged.
const yatraOne = Yatra_One({
  variable: "--font-devanagari-display",
  subsets: ["devanagari"],
  weight: ["400"],
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
      className={`${manrope.variable} ${yatraOne.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
