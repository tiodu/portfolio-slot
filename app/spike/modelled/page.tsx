import type { Metadata } from "next";
import { ModelledStage } from "@/components/spike/modelled-stage";
import { scriptFont } from "../script-font";

export const metadata: Metadata = {
  title: "Spike: modelled cabinet",
  description:
    "Throwaway spike. The same three-reel cabinet loaded from a generated GLB. Not for production.",
};

export default function ModelledSpikePage() {
  return (
    <ModelledStage
      scriptFamily={scriptFont.style.fontFamily}
      scriptClassName={scriptFont.className}
    />
  );
}
