import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import type { ReactNode } from "react";
import { ZoomLayer } from "@/components/zoom-layer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-geist",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: {
    default: "Eduardo de Souza — Product Design Manager",
    template: "%s — Eduardo de Souza",
  },
  description:
    "Eduardo de Souza, Product Design Manager. Case studies in iGaming UX and product design.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${geist.variable} ${bricolage.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <ZoomLayer />
      </body>
    </html>
  );
}
