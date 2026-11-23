import { CabinetStage } from "./stage";
import { StripBackground } from "./strip-bg";

export function CabinetHero() {
  return (
    <section className="hero" aria-label="Hero">
      <div className="hero-street" aria-hidden="true">
        <StripBackground />
        <div className="hero-street-fade" />
      </div>
      <h1 className="sr-only">Eduardo de Souza</h1>
      <div className="hero-stage">
        <CabinetStage />
      </div>
      <p className="hero-description">
        Product Design Manager, iGaming UX. Moving into design engineering.
        Based in Ireland.
      </p>
    </section>
  );
}
