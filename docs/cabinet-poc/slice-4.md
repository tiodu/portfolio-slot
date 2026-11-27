# Slice 4: Command

Branch: `poc/slice-4`, stacked on `poc/slice-3`. One PR. Model: Opus. Read `PRD.md` first.

Eduardo asked for Command and Aero before reviewing, so the go/no-go after slice 3 moves to the end: he reviews Vegas, Command and Aero together.

## Goal

Build the Command cabinet from the refs (`refs/command-front.webp`, `-side`, `-34`): chamfered purple armour, lime edge strips, hazard-stripe plates, a speaker grille, printed labels, a stepped base and a hinged guard over the lever. Purple, lime and hazard orange. No logos, no characters.

## Decisions

- Command is a new theme in `themes.js`, with page tokens as well as a cabinet. Its display and label face is Barlow Condensed (OFL, self-hosted, latin 500 and 600). [TODO] Eduardo to confirm the face.
- The guard is built by the cabinet, not the lever: it hangs from a hinge on the body and lifts with the lever's travel. The lever itself stays core.
- New parts stay generic: `body.corner: 'chamfer'`, armour `plates` on any face (with an optional hazard pattern), `edges` on chamfered corners, a round `grille`, free `labels`, a `satin` finish, and an LED colour.

## Concepts to teach (brief, in the PR description)

- UVs from shape coordinates: an extruded shape's caps carry its own coordinates as UVs, so one small stripe texture repeated per world unit gives even hazard stripes on any plate.
- A hinge is a parent group: rotate the group and everything hung on it swings round the hinge line.

## Checks

As slice 3, with four themes in the switcher and in the x50 cycle.

## Stop and ask if

- Command needs a theme-name conditional or a part only Command could use.
- The reel window or lever pivot would have to move.
