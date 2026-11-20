"use client";

import { Leva, useControls } from "leva";
import { useEffect } from "react";
import { stripDefaults, type StripControls } from "@/lib/cabinet/strip-shader";

export function StripDevPanel({
  onChange,
}: {
  onChange: (value: StripControls) => void;
}) {
  const controls = useControls("Strip", {
    hazeAmount: {
      value: stripDefaults.hazeAmount,
      min: 0,
      max: 0.05,
      step: 0.001,
    },
    hazeSpeed: {
      value: stripDefaults.hazeSpeed,
      min: 0,
      max: 1,
      step: 0.01,
    },
    smearAmount: {
      value: stripDefaults.smearAmount,
      min: 0,
      max: 0.05,
      step: 0.001,
    },
    tint: stripDefaults.tint,
  });

  useEffect(() => {
    onChange(controls);
  }, [controls, onChange]);

  return <Leva collapsed titleBar={{ title: "Strip" }} />;
}
