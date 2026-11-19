# portfolio-slot

Portfolio of Eduardo de Souza, Product Design Manager. This repository is the rebuild. The live site at eduardodesouza.me stays as it is until he explicitly says otherwise.

This slice is the skeleton: a header, a placeholder frame for the future three-reel cabinet, and a plain list of five case studies. There is no 3D scene yet, and no CMS, backend, or analytics.

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
