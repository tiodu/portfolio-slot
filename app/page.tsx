import { CaseStudyList } from "@/components/case-study-list";
import { CabinetHero } from "@/components/cabinet/hero";
import { StudyFade } from "@/components/study-fade";
import { caseStudies } from "@/content/case-studies";

export default function HomePage() {
  return (
    <StudyFade name="home">
      <CabinetHero />
      <CaseStudyList studies={caseStudies} />
    </StudyFade>
  );
}
