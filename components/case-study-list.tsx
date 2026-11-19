import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies";

export function CaseStudyList({
  studies,
}: {
  studies: readonly CaseStudy[];
}) {
  return (
    <section
      className="case-studies"
      id="case-studies"
      aria-labelledby="case-studies-heading"
    >
      <div className="shell">
        <h1 id="case-studies-heading" className="section-label">
          Case studies
        </h1>
        <ul className="case-study-list">
          {studies.map((study) => (
            <li key={study.slug} className="case-study">
              <h2>
                <Link href={`/work/${study.slug}`}>{study.title}</Link>
              </h2>
              <p>{study.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
