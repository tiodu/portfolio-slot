import { CabinetStage } from "./stage";
import { StripBackground } from "./strip-bg";

export function CabinetHero() {
  return (
    <section className="hero" aria-label="Hero">
      <div className="hero-street" aria-hidden="true">
        <StripBackground />
        <div className="hero-street-fade" />
      </div>
      <div className="hero-stage">
        <CabinetStage />
      </div>
    </section>
  );
}
