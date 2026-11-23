import { CabinetStage } from "./stage";
import { LeverHint } from "./lever-hint";
import { ParallaxLayer } from "./parallax-layer";
import { StripBackground } from "./strip-bg";

/*
  Layers: z0 the street (parallax), z1 the cabinet canvas (portalled in by the stage),
  z2 the DOM text and buttons. Text is never drawn in the canvas.
*/
export function CabinetHero() {
  return (
    <section className="hero" aria-label="Hero">
      <div className="hero-street" aria-hidden="true">
        <ParallaxLayer>
          <StripBackground />
        </ParallaxLayer>
        <div className="hero-street-fade" />
      </div>
      <h1 className="sr-only">Eduardo de Souza</h1>
      <div className="hero-layout">
        <div className="hero-stage">
          <CabinetStage />
          <LeverHint />
          {/* Mirrored, blurred copy of the still: the wet street under the cabinet. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-reflection" src="/cabinet-still.webp" alt="" aria-hidden="true" />
        </div>
        <p className="hero-description">
          Product Design Manager, iGaming UX. Moving into design engineering.
          Based in Ireland.
        </p>
      </div>
    </section>
  );
}
