import { CaseStudyList } from "@/components/case-study-list";
import { CabinetHero } from "@/components/cabinet/hero";
import { StudyFade } from "@/components/study-fade";
import { caseStudies } from "@/content/case-studies";

export default function HomePage() {
  return (
    <StudyFade name="home">
      <CabinetHero />
      <CaseStudyList studies={caseStudies} />
      <section id="about" className="placeholder-section" aria-label="About">
        <div className="shell">[TODO] About: copy to come from the live site.</div>
      </section>
      <section id="contact" className="placeholder-section" aria-label="Contact">
        <div className="shell">[TODO] Contact: copy to come from the live site.</div>
      </section>
    </StudyFade>
  );
}
