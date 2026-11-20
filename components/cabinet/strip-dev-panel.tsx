"use client";

import { Leva, useControls } from "leva";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  stripDefaults,
  stripRanges,
  type StripControls,
} from "@/lib/cabinet/strip-shader";

export function StripDevPanel({
  onChange,
}: {
  onChange: (value: StripControls) => void;
}) {
  const controls = useControls("Strip", {
    hazeAmount: {
      value: stripDefaults.hazeAmount,
      ...stripRanges.hazeAmount,
    },
    hazeSpeed: {
      value: stripDefaults.hazeSpeed,
      ...stripRanges.hazeSpeed,
    },
    smearAmount: {
      value: stripDefaults.smearAmount,
      ...stripRanges.smearAmount,
    },
    smearPulseSpeed: {
      value: stripDefaults.smearPulseSpeed,
      ...stripRanges.smearPulseSpeed,
    },
    tint: stripDefaults.tint,
  });

  useEffect(() => {
    onChange(controls);
  }, [controls, onChange]);

  // Hero street uses pointer-events: none; portal so the panel can receive clicks.
  return createPortal(
    <div style={{ pointerEvents: "auto" }}>
      <Leva titleBar={{ title: "Strip" }} />
    </div>,
    document.body,
  );
}
