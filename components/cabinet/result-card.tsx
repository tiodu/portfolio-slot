"use client";

import Link from "next/link";
import type { Ref } from "react";
import type { ResultCard as ResultCardData } from "@/lib/cabinet/bus";

export function ResultCard({
  result,
  cardRef,
  onClose,
}: {
  result: ResultCardData;
  cardRef: Ref<HTMLDivElement>;
  onClose: () => void;
}) {
  return (
    <div
      className="spin-result"
      role="region"
      aria-labelledby="spin-result-title"
      tabIndex={-1}
      ref={cardRef}
      data-result={result.kind}
    >
      <p id="spin-result-title" className="spin-result-title">
        {result.title}
      </p>
      <p>{result.body}</p>
      <div className="spin-result-actions">
        {result.href ? (
          <Link href={result.href}>Read the case study</Link>
        ) : null}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
