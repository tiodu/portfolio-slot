# portfolio-slot

Portfolio of Eduardo de Souza, Product Design Manager. This repository is the rebuild. The live site at eduardodesouza.me stays as it is until he explicitly says otherwise.

The homepage hero is a three-reel cabinet. A still of that cabinet stands in while the scene loads, and it stays in place when WebGL is unavailable or motion is reduced. The five case studies remain a plain list underneath. There is no CMS, backend, or analytics.

## Run it

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before a pull request:

```bash
npm run lint
npm run typecheck
npm run build
```

## Design tokens

Colour, type, spacing, corner radius, and motion are named once as CSS custom properties in `app/tokens.css`. Everything else refers to those names, so the look has a single source of truth. Visitors who prefer reduced motion get the same layout with the duration tokens set to zero, which turns transitions off.
