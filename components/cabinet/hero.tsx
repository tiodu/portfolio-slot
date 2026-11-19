import { CabinetStage } from "./stage";

export function CabinetHero() {
  return (
    <section className="hero" aria-label="Hero">
      <div className="hero-street" aria-hidden="true">
        {/* Static plate for the later background shader. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/strip-bg.webp" alt="" />
        <div className="hero-street-fade" />
      </div>
      <div className="hero-stage">
        <CabinetStage />
      </div>
    </section>
  );
}
