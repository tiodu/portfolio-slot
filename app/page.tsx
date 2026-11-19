import { CaseStudyList } from "@/components/case-study-list";
import { CabinetHero } from "@/components/cabinet/hero";
import { caseStudies } from "@/lib/case-studies";

export default function HomePage() {
  return (
    <>
      <CabinetHero />
      <CaseStudyList studies={caseStudies} />
    </>
  );
}
