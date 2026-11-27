# Slice 5: Aero

Branch: `poc/slice-5`, stacked on `poc/slice-4`. One PR. Model: Opus. Read `PRD.md` first.

Eduardo reviews Vegas, Command and Aero together after this slice.

## Goal

Rebuild the Aero cabinet from the refs (`refs/aero-front.webp`, `-side`, `-34`): a rounded glass shell, a thick chrome window frame, a chrome band on bun feet with a tray, a green knob and soap bubbles. The theme's page tokens already exist; only its cabinet changes.

## Decisions

- Fake glass, as the PRD says: a thin transparent tint plus a Fresnel rim shader, no transmission. Real transmission only if the phone holds the frame rate, and it is not needed for this look.
- Bubbles are scene atmosphere (like the floor glow): they sit outside the envelope check.
- The modelling refs (front, side, three-quarter) win over the mood render, which shows a silver face instead of glass.

## Concepts to teach (brief, in the PR description)

- Fresnel: surfaces seen edge-on reflect more, so glass is bright at its silhouette and clear face-on. One small shader draws only that.
- Transparency costs order, not pixels: transparent objects are sorted back to front and do not write depth, which is why the glass layers need a render order.

## Checks

As slices 3 and 4.

## Stop and ask if

- The glass needs real transmission to read as glass.
- The frame rate drops visibly on the preview.
