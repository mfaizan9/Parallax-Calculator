# Parallax Calculator — conversion notes

Source: `parallaxDiagram001.swf` / `parallaxDiagram001.fla` (Flash 6, AS1,
720 × 380 stage, 12 fps, a single frame), decompiled with JPEXS/FFDec.

## Behaviour model

The Parallax Calculator is a one-frame, static-diagram calculator. A labelled,
not-to-scale diagram shows the Earth's orbit at the left, two lines of sight
running from opposite sides of that orbit past a nearby star and out to the
celestial sphere at the right, the parallax half-angle π marked at the star and
again on the sphere, a brace labelling the distance *d*, and a brace marking the
star's displacement on the sphere. Beneath the diagram the relation
*d* = 1 / π″ is printed with three editable boxes in it: the parallax angle in
arcseconds, the distance in parsecs, and the distance in lightyears. Typing in
any one box immediately recomputes the other two to three significant digits
(pc = 1 / arcsec, ly = 3.26 × pc), writing the literal string `...` into a box
whose value cannot be computed. Nothing animates and nothing else is
interactive; the diagram never changes.

## Source inventory

| Decompiled item | Role |
| --- | --- |
| `scripts/frame_1/DoAction.as` | The entire simulation: `ly_in_pc`, the three `onChanged` handlers, the three `onSetFocus` handlers, the `restrict` masks, and `Math.toSigDigits` |
| `DefineEditText` 24 / 26 / 30 | `parsecField`, `lightyearField`, `arcsecField` — bordered, centred, `maxLength=5`, initial text `1` / `3.26` / `1` |
| Shapes 1, 4, 9, 11, 14 | Earth's orbit circle; lines of sight + baseline + angle ticks + celestial-sphere arc and dashes; the brace over *d*; the two leader lines and the displacement brace; the star |
| Shapes 27, 31 | The two fraction rules in the printed formula |
| `DefineText` 3, 8, 10, 12, 13, 18, 19, 20, 21, 22, 23, 25, 28, 29, 32 | Every static label and the printed formula's symbols |
| Fonts 2 / 7 (Verdana), 5 / 16 / 17 ("WP Greek Century") | The Greek-font characters are the two π glyphs in the diagram and the π in the formula and in the footnote |
| `frames/1.png` | Reference screenshot of the running original (matches the screenshot supplied in the sim folder) |

## ActionScript → HTML5 mapping

| ActionScript | HTML5 |
| --- | --- |
| `ly_in_pc = 3.26` | `LY_IN_PC = 3.26` in `simulation.js` — used verbatim, never rounded |
| `arcsecField.restrict = "0123456789."` | `applyRestrict()` strips anything outside `[0-9.]` on every `input` event (typing *and* paste), preserving the caret |
| `maxLength = 5` | `maxlength="5"` on each field. As in Flash, the limit constrains typing only; computed values written into a field are not truncated |
| `arcsecField.onChanged` | `arcsecChanged()` — `tmp = 1 / parseFloat(text)`, then `toSigDigits(tmp, 3)` and `toSigDigits(3.26 * tmp, 3)`, else `"..."` in both boxes |
| `parsecField.onChanged` | `parsecChanged()` — including the special case `tmp == 0` → arcsec `"..."`, lightyears `"0"` |
| `lightyearField.onChanged` | `lightyearChanged()` — including `tmp == 0` → arcsec `"..."`, parsecs `"0"` |
| `*.onSetFocus` clearing `"..."` | `focus` listener that blanks a field showing `"..."` |
| `Math.toSigDigits` | `toSigDigits()` — a line-for-line port, including `Math.log(num) / 2.302585092994046` for log₁₀, the `digs > 15` clamp, the sign split, and the `num == 0 → 0` early return |
| Number → text assignment | `String(value)`; ECMAScript number formatting is the same in AS1 and JS at these precisions |
| `updateAfterEvent()` | Dropped (no-op outside Flash) |
| Static stage art | Reused exported SVG shapes, composited in an inline `<svg>` at the original stage coordinates |
| Static stage text | Rebuilt as HTML (see below), text verbatim |

`onChanged` in Flash fires only for user edits, never when a field's text is set
from script; the DOM `input` event has exactly the same rule, so the three
handlers cannot loop.

### Parity spot-checks

Every value below was computed independently from the ActionScript and then
read back out of the running page:

| Typed | arcsec ″ | pc | ly |
| --- | --- | --- | --- |
| arcsec `1` | 1 | 1 | 3.26 |
| arcsec `0.5` | 0.5 | 2 | 6.52 |
| arcsec `0.005` | 0.005 | 200 | 652 |
| arcsec `0.377` | 0.377 | 2.65 | 8.65 |
| arcsec `0` | 0 | ... | ... |
| arcsec `` (empty) | | ... | ... |
| pc `3.26` | 0.307 | 3.26 | 10.6 |
| pc `100` | 0.01 | 100 | 326 |
| pc `0` | ... | 0 | 0 |
| ly `10` | 0.326 | 3.07 | 10 |
| ly `652` | 0.005 | 200 | 652 |
| ly `0` | ... | 0 | 0 |

## Assets: reused vs. rebuilt

Reused **as-is** from the JPEXS export and copied into `assets/`, then placed in
an inline `<svg>` at their original stage coordinates and z-order:

| File | Original symbol | Placement (original stage px) |
| --- | --- | --- |
| `parallax-rays.svg` | Shape 4 | x 72.4, y 16.95, 519 × 264.9 |
| `earth-orbit-circle.svg` | Shape 1 | x 20.2, y 103.65, 105.4 × 105.4 |
| `distance-brace.svg` | Shape 9 | x 72.45, y 132.2, 347.15 × 20.3 |
| `leader-lines-and-brace.svg` | Shape 11 | x 113.45, y 104.8, 492.45 × 76.35 |
| `star-dot.svg` | Shape 14 | x 413.1, y 150.35, 12 × 12 |

None of this art was traced or redrawn. There are no bitmaps in the export that
the simulation uses, and there is no code-drawn (`createEmptyMovieClip` /
`beginFill` / `drawArc`) art at all — the original builds nothing at runtime.

Not reused:

* **Shapes 27 and 31**, the two 1.5 px fraction rules in the printed formula.
  The formula is rebuilt as MathJax-typeset HTML around live form controls
  (required by the accessibility rules — see `ACCESSIBILITY.md`), so the rules
  are CSS borders that scale with the typeset text instead of fixed-size
  images. Their function and position are unchanged.
* **The `DefineText` glyph shapes.** Flash bakes static text into glyph
  outlines. Reusing them would freeze the labels at one size and hide them from
  screen readers and from MathJax. All label text is therefore real HTML,
  verbatim from the source, positioned over the artwork at the original stage
  coordinates. Verified in the browser: each label's box lands within about a
  pixel of the original — for example the four-line "star's displacement on the
  celestial sphere" block occupies stage x 616.1 … 706.1 against the original's
  615.45 … 706.65.

Verbatim label text carried over: `earth's orbit`, `1 AU`, `d`, `star`,
`star's displacement on the celestial sphere`, `diagram not to scale`,
`π measured in arcseconds (")`, `1 parsec (pc) = 3.26 lightyears (ly)`.

## Layout

Original stage: 720 × 380. The diagram occupies roughly x 14 … 712,
y 12 … 288; the formula and the two footnotes sit below it. The port keeps that
reading order:

1. masthead (title, Reset, Help, About)
2. **Parallax Diagram** panel — the artwork, at the original internal
   coordinates (`viewBox="14 12 698 276"`), scaled by CSS with its aspect ratio
   preserved
3. **Distance Calculator** panel — the formula with its three boxes, then the
   two footnotes

Both panels are full width and stacked, as in the original. The diagram's
drawing coordinates are never recomputed from the rendered size; only the CSS
scale changes, so nothing can drift from the source geometry.

Divergences from the screenshot, all forced by the higher-priority rules:

* The KL-UNL masthead and palette replace the original's bare white stage.
* The formula is centred in its panel rather than sitting at the original's
  left-of-centre x ≈ 90; the three boxes are 6 rem × 2.75 rem (the 44 px
  minimum touch target) rather than the original 67 × 21 px.
* Text is larger throughout and sized in rem, per the pipeline's type rules.
* At phone-portrait widths the diagram labels shrink with the artwork so that
  they never collide; the full description remains available to screen readers
  and the whole figure can be zoomed.

## contents.json

**No edit was required.** The shared `contents.json` already carries a
`parallaxdiag` entry (`meta.title` "Parallax Calculator", `meta.version` "2.0",
with Help and About text). The file was copied into `html5/foundation/`
byte-for-byte along with the rest of the foundation, and `index.html` addresses
it with `sim-id="parallaxdiag"` and `json-url="foundation/contents.json"`.
`kl-unl-masthead.js`, `kl-unl.css` and `kl-unl.js` are likewise unmodified.

If the project treats `contents.json` as a single shared file rather than a
per-sim copy, nothing needs to be pasted anywhere — the entry is already there.

## Deviations from the original behaviour

1. **Reset.** The original has no Reset. The masthead provides one; the
   `sim-reset` listener restores the exact initial field contents
   (`1` / `1` / `3.26`).
2. **Keyboard and wheel stepping.** Added so the numeric fields are operable
   without a pointer (see `ACCESSIBILITY.md`). Stepped values go through the
   same three handlers as typing, so the arithmetic is unchanged.
3. **Everything else is unchanged**: the same constant, the same rounding, the
   same `"..."` strings, the same zero special-cases, the same 5-character typing
   limit, the same digits-and-point restriction, and the same clear-on-focus
   behaviour.

## Cross-browser notes

* No Chrome-only APIs, no vendor-prefix-only CSS, no build step, no CDN.
* `container-type: inline-size` scales the diagram labels with the artwork. It
  needs Safari 16+/Chrome 105+/Firefox 110+; every rule that uses a `cqw` value
  is preceded by a plain `rem` declaration, so older engines simply get the
  fallback size.
* `aspect-ratio`, `inset`, flex/grid `gap` and `:focus-visible` are all used in
  their standard forms and are supported across current Chrome, Edge, Firefox
  and Safari (desktop and iOS).
* `<image href="…" xlink:href="…">` carries both attributes so the exported SVGs
  load in older WebKit as well.
* MathJax is served from `assets/mathjax/tex-svg.js`; nothing is fetched from a
  CDN, so rendering does not vary with network or locale.
