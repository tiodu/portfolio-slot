import type { Metadata } from "next";
import { StudyFade } from "@/components/study-fade";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <StudyFade name="about">
      <div className="shell about-page">
        <h1 className="about-title">About</h1>
        <p>[TODO] About copy: to come from the Info page on the live site.</p>
      </div>
    </StudyFade>
  );
}
