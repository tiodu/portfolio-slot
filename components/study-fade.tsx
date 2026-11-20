import { ViewTransition, type ReactNode } from "react";

const fade = {
  "study-fade": "study-fade",
  default: "none",
} as const;

/**
 * Crossfades the page on case-study navigations. Each page has its own
 * name so the browser fades instead of morphing one frame into the next.
 * Browsers without the View Transitions API swap the pages with no animation.
 */
export function StudyFade({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition name={name} enter={fade} exit={fade} default="none">
      <div className="study-fade-root">{children}</div>
    </ViewTransition>
  );
}
