import { CabinetStage } from "./stage";

export function CabinetHero() {
  return (
    <section className="hero" aria-label="Hero">
      <div className="shell">
        <CabinetStage />
      </div>
    </section>
  );
}
