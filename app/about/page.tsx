import type { Metadata } from "next";
import { StudyFade } from "@/components/study-fade";

export const metadata: Metadata = {
  title: "About",
};

/* Copy is Eduardo's own, taken word for word from the Info page of the live site. */
const experience = [
  {
    role: "Product Design Manager",
    place: "WA Technology (formerly First International Media) — Remote (Ireland), 2021–Present",
    text: "Promoted to PDM in 2024. Led UX across sportsbook, casino, and fantasy for Pixbet, Esportes da Sorte, and Superbetin (Poligon). Shipped WA Fantasy Pick'em — Sports Provider of the Year 2024. Architected the Belloa Design System across component libraries, interaction patterns, and token sets. Drove design-engineering alignment via Figma token governance and UX metrics (betslip churn, CES). Led brand identity for FIM and WA Technology.",
  },
  {
    role: "Digital Designer",
    place: "Mansour — Los Angeles, USA, 2018–2019",
    text: "Owned all brand, digital, and marketing design — from e-commerce UX to campaign creative. Rebuilt the online retail presence, streamlining the shopping experience for a premium Persian rug brand.",
  },
  {
    role: "Visual Designer",
    place: "Fundação de Rotarianos de São Paulo — São Paulo, Brazil, 2011–2015, 2017–2018",
    text: "Delivered communications and visual design across print and digital for a major São Paulo non-profit — website, newsletters, publications, and event collateral.",
  },
];

export default function AboutPage() {
  return (
    <StudyFade name="about">
      <div className="shell about-page">
        <h1 className="about-title">About</h1>
        <p className="about-lead">
          Product Design Manager with 12 years of experience — specialising in
          iGaming UX across sportsbook, casino, and fantasy platforms. I lead
          design at WA Technology, where I&apos;ve built systems used by 3M+
          players globally across 15+ operators in Europe and Brazil. I
          represent the company at ICE, SiGMA, and EGR — the industry&apos;s
          defining events.
        </p>
        <p>
          Before iGaming, I worked across editorial, educational design for
          universities and private schools, luxury retail, and 3D production.
          Each shaped how I think about systems, scale, and the users on the
          other end of the screen.
        </p>
        <h2 className="about-heading">Experience</h2>
        <ul className="about-experience">
          {experience.map((job) => (
            <li key={job.role}>
              <h3>{job.role}</h3>
              <p className="about-place">{job.place}</p>
              <p>{job.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </StudyFade>
  );
}
