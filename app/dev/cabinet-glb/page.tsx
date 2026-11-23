import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlbTest } from "@/components/cabinet/glb-test";

export const metadata: Metadata = {
  title: "Cabinet GLB test",
  robots: { index: false, follow: false },
};

// A dev and preview page only: it exists to check the exported Blender cabinet in the browser.
export default function CabinetGlbTestPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return <GlbTest />;
}
