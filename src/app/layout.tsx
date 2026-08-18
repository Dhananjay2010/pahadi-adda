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

export const metadata: Metadata = {
  title: "Pahadi Adda",
  description:
    "A live listening room for Garhwali & Kumaoni pahadi songs, styled after Uttarakhand's hill temples.",
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
