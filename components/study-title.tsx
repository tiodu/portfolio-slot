"use client";

import { useEffect, useRef } from "react";

export function StudyTitle({ title }: { title: string }) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [title]);

  return (
    <h1 ref={heading} tabIndex={-1} className="study-title">
      {title}
    </h1>
  );
}
