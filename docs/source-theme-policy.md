# Independent named-theme paint policy

Source pin: `1fb7869866dd619168d840291c9c54b4f129758b`.
`fidelity/theme-source-policy.ts` independently transcribes literal constants and
formulas into standalone CSS HSL arithmetic. It imports no Mermaid module,
parser, model, renderer, SVG, output receipt or image. Directly executing the
public theme helper was used initially as a consistency diagnostic only;
those helper results are not the policy or test oracle.

The native theme identifier remains source/native metadata. The observable
contract consists of the following owned paint effects. A named look/layout
identifier likewise cannot be required as literal drawing text.

## Palette derivation

All paths below are under `packages/mermaid/src/` in the pinned public source.

| Theme | Literal/formula provenance | Independent palette formula |
| --- | --- | --- |
| base | `themes/theme-base.js:19`, `:36–38`, `:156–174`, `:192–195` | Primary `#fff4dd`; secondary hue −120°; tertiary hue +180°, lightness +5; scale slots3..6 hue +30,+60,+90,+120; subtract25 lightness points from all slots; foreground `#333` |
| forest | `themes/theme-forest.js:12–24`, `:126–158` | Primary `#cde498`; secondary `#cdffb2`; tertiary primary lightness +10; slots3..6 rotate primary +30,+60,+90,+120; subtract10 lightness points; black foreground |
| default | `themes/theme-default.js:12–18`, `:144–190`, `:503` | Primary `#ececff`, secondary `#ffffde`, tertiary primary hue −160; slots3..6 rotate +30,+60,+90,+120. Constructor and explicit calculate pass each subtract10 lightness points, total20. Foregrounds white at0/3, black elsewhere |
| dark | `themes/theme-dark.js:7`, `:191–199`, `:236–244` | Literal scale `#1f2020,#0b0000,#4d1037,#3f5258,#4f2f1b,#6e0a0a,#3b0048`; foreground lightgrey `#d3d3d3` |
| neutral | `themes/theme-neutral.js:152–184` | Literal scale `#555,#f4f4f4,#555,#bbb,#777,#999,#ddd`; foreground `#f4f4f4` at0/2 and `#333` elsewhere |

Explicit source `cScaleN`/`cScaleLabelN`/`gitN`/`gitBranchLabelN` overrides
win after derivation (`calculate` copies overrides after updateColors).
RGB observations allow one channel unit of raster quantization. The policy
retains unrounded HSL channels so a near-half-unit conversion does not turn
source `93.5` into an artificial exact `93` versus `94` requirement.

## Timeline444–450

`diagrams/timeline/timelineRenderer.ts:78,289–300,318,334–335` starts at slot0,
uses a period's slot for its events, and advances per unsectioned period unless
`disableMulticolor` is true. With sections, slot order follows sections.
`diagrams/timeline/svgDraw.js:500–507` and `styles.js:108–116` map these semantic
ordinals to scale and foreground tokens. No CSS class spelling is required.

**Events additionally have brightness120%** (`styles.js:197–198`), so their
painted RGB channels are the owning period color ×1.2, clamped255. Header and
event pixels are therefore deliberately different. Case444 holds all periods
and events at base slot0;445 uses its explicit red/green/blue overrides;446–450
use base/forest/dark/default/neutral palettes respectively. A theme background
variable is a derivation input, not by itself a promise that a standalone SVG
paints an opaque canvas background.

## Treemap468–469

`diagrams/treemap/renderer.ts:80–124,164–225,339–358` puts the synthetic root in
the transparent palette slot, then assigns stable descending-aggregate-weight section traversal order to cScale0,1… (`renderer.ts:144–147`);
leaves inherit their immediate parent section's color. Group fill alpha is0.6,
leaf fill alpha0.3 over that group, yielding combined alpha0.72 over white when
there is one group level. Leaf border uses the parent color at width3. These
are distinct foreground/background/alpha obligations; do not compare the
flattened leaf pixel directly with opaque cScale RGB.

`docs/syntax/treemap.md:131,156` defines diagramPadding as padding around the
entire diagram. `renderer.ts:525–526` applies it to the viewport. Case469's200
requires the corresponding actual content-to-canvas margin, not printed text.

## Usecase490–491

`docs/syntax/usecase.md:374–403,426–457` explicitly documents role colors,
independent source-order boundary numbering, and actor-first/usecase-second
rotation. Literal role/palette colors are in `themes/theme-redux-color.js:61–108`;
font and width effects are in `diagrams/usecase/styles.ts:233–310`.

Case490: Customer uses violet role fill/stroke; Browse and Checkout use teal
role fill/stroke. Catalogue takes palette slot0 (pale fuchsia/fuchsia), Payment
slot1 (pale teal/teal). Include stroke is sky blue. Case491: Customer, Auditor,
Browse, Checkout take slots0,1,2,3 respectively, with no boundary cycle to alter
that order. Text is `#28253D`; actor size14, use case size12; visible glyph/shape
roles establish ownership. Raw theme/class identifiers supply no credit.

## Git graph

`themes/theme-base.js:371–414`, `theme-default.js:402–443`,
`theme-forest.js:375–415`, `theme-dark.js:382–409`, and
`theme-neutral.js:390–417` give branch token formulas.
`diagrams/git/styles.js:103–116` maps branch semantic ordinal modulo8 to normal
commit fill/stroke, route stroke and branch-label backdrop. Branch label text
uses the paired foreground. Explicit source color/label overrides remain
independent required effects; actor/commit identities are never read from
renderer CSS classes or generated IDs. Highlight/reverse/merge inner glyph
paint has its own source rules and must not borrow normal commit-color credit.

Git special glyphs use separate owned layers. `diagrams/git/styles.js:110`
uses `gitInvN` for the highlight outer outline; `:147–165` uses primaryColor
for merge inner dots, reverse inner marks (width3), and highlight inner marks.
`gitInverse` independently computes RGB complements. Default theme preserves
its constructor's first-pass inverse tokens (`theme-default.js:429–436` uses
`||`) while its second pass darkens normal git colors again; inverse slot0
additionally darkens25. This yields default slot0 inverse `(19,19,0)` within
one channel unit, not the complement of the final normal darkblue slot.
Other themes derive the complement from their single initial git palette.
Explicit `gitInvN` overrides win. `gitSpecial` retains primary inner paint,
commit/tag caption foreground and backdrop; commit-caption backdrop opacity
is the literal0.5 in `styles.js:141`. These roles must be bound to the actual
outer/inner shapes and caption backdrops separately.

Treemap group stroke opacity is the literal0.4 in
`diagrams/treemap/renderer.ts:212`; default group stroke width2 and fill alpha0.6
remain distinct from opaque leaf borders. Authored stroke/color overrides
inherit these alphas unless the source overrides opacity explicitly.

Scale `peer`/`peerChannels` are independently transcribed border colors:
forest/default reserve peer1=secondary darkened45 and peer2=tertiary darkened40
(`theme-forest.js:138–143`, `theme-default.js:164–169`). Their other peers are
first scale pass darkened25; default preserves that constructor first pass.
Base/neutral peers darken the scale10; dark peers lighten10. Explicit
cScalePeerN overrides remain final. These peer colors own group borders,
while treemap leaf borders use the immediate parent group's fill color.
