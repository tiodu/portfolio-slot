import { CaseStudyList } from "@/components/case-study-list";
import { HeroPlaceholder } from "@/components/hero-placeholder";
import { caseStudies } from "@/lib/case-studies";

export default function HomePage() {
  return (
    <>
      <HeroPlaceholder />
      <CaseStudyList studies={caseStudies} />
    </>
  );
}
