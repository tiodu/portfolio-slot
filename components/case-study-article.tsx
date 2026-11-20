import Link from "next/link";
import { Fragment } from "react";
import type { CaseStudy, InlinePart, StudyBlock } from "@/content/case-studies";
import { studyNeighbours } from "@/content/case-studies";
import { StudyTitle } from "@/components/study-title";
import { studyFadeTypes } from "@/lib/study-fade";

const sections = [
  { id: "problem", heading: "Problem", key: "problem" },
  { id: "role", heading: "Role", key: "roleBody" },
  { id: "process", heading: "Process", key: "process" },
  { id: "outcome", heading: "Outcome", key: "outcome" },
] as const;

function Inline({ parts }: { parts: readonly InlinePart[] }) {
  return parts.map((part, index) => {
    if (typeof part === "string") {
      return <Fragment key={index}>{part}</Fragment>;
    }

    if (part.href.startsWith("/")) {
      return (
        <Link
          key={index}
          href={part.href}
          transitionTypes={[...studyFadeTypes]}
        >
          {part.text}
        </Link>
      );
    }

    return (
      <a
        key={index}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {part.text}
      </a>
    );
  });
}

function Blocks({ blocks }: { blocks: readonly StudyBlock[] }) {
  return blocks.map((block, index) => {
    switch (block.kind) {
      case "h":
        return <h3 key={index}>{block.text}</h3>;
      case "ul":
        return (
          <ul key={index}>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      case "pairs":
        return (
          <ul key={index} className="study-pairs">
            {block.items.map((item) => (
              <li key={item.before}>
                <p>
                  <span className="study-pair-label">Before</span>
                  {item.before}
                </p>
                <p>
                  <span className="study-pair-label">After</span>
                  {item.after}
                </p>
              </li>
            ))}
          </ul>
        );
      case "todo":
        return (
          <p key={index} className="todo">
            {block.text}
          </p>
        );
      default:
        return (
          <p key={index}>
            <Inline parts={block.parts} />
          </p>
        );
    }
  });
}

function ReelLink({
  study,
  label,
  align,
}: {
  study: CaseStudy;
  label: "Previous reel" | "Next reel";
  align: "start" | "end";
}) {
  return (
    <Link
      href={`/work/${study.slug}`}
      transitionTypes={[...studyFadeTypes]}
      className={align === "end" ? "study-reel study-reel-next" : "study-reel"}
    >
      <span className="study-reel-label">{label}</span>
      <span className="study-reel-title">{study.title}</span>
    </Link>
  );
}

export function CaseStudyArticle({ study }: { study: CaseStudy }) {
  const { previous, next } = studyNeighbours(study.slug);
  const meta = [
    ["Role", study.role],
    ["Team", study.team],
    ["Duration", study.duration],
    ["Year", study.year],
  ] as const;

  return (
    <article className="study">
      <header className="study-bar">
        <div className="shell study-bar-inner">
          <Link href="/" transitionTypes={[...studyFadeTypes]}>
            Back to the machine
          </Link>
          <nav aria-label="Case study sections">
            <ul>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.heading}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <div className="shell study-body">
        <ul className="study-tags">
          {study.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <StudyTitle title={study.title} />
        <dl className="study-meta">
          {meta.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <ul className="study-strip">
          {study.thumbnails.map((caption, index) => (
            <li key={`${study.slug}-${index}`}>
              <figure>
                <div className="study-tile" aria-hidden="true">
                  <span>Placeholder</span>
                </div>
                <figcaption className={caption.startsWith("[TODO]") ? "todo" : undefined}>
                  {caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="study-section"
          >
            <h2 id={`${section.id}-heading`}>{section.heading}</h2>
            <Blocks blocks={study[section.key]} />
          </section>
        ))}
        <nav className="study-reels" aria-label="More case studies">
          {previous ? (
            <ReelLink study={previous} label="Previous reel" align="start" />
          ) : (
            <span />
          )}
          {next ? (
            <ReelLink study={next} label="Next reel" align="end" />
          ) : null}
        </nav>
      </div>
    </article>
  );
}
