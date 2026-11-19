import type { Metadata } from "next";
import { ProceduralStage } from "@/components/spike/procedural-stage";
import { scriptFont } from "../script-font";

export const metadata: Metadata = {
  title: "Spike: procedural cabinet",
  description:
    "Throwaway spike. A three-reel cabinet built in react-three-fiber. Not for production.",
};

export default function ProceduralSpikePage() {
  return (
    <ProceduralStage
      scriptFamily={scriptFont.style.fontFamily}
      scriptClassName={scriptFont.className}
    />
  );
}
