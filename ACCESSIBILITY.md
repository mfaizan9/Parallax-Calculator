# Parallax Calculator — accessibility notes

Target: WCAG 2.1 AA, ADA Title II. Built on the shared KL-UNL foundation
(`foundation/kl-unl.css`, `foundation/kl-unl.js`, `foundation/kl-unl-masthead.js`),
which is used unmodified.

## Structure and semantics

* `<html lang="en">`; a "Skip to main content" link is the first focusable item.
* Exactly one `<h1>` — rendered by `<kl-unl-masthead>` from `contents.json`. The
  page adds no competing `<h1>`.
* Two `<section>` landmarks inside `<main class="app-shell">`, each labelled by
  its own `<h2>`: **Parallax Diagram** and **Distance Calculator**. Heading
  levels do not skip.
* The three value boxes live in a `<fieldset>` with a
  `<legend>`: "Parallax angle and distance". The fieldset's `aria-describedby`
  points at a visually-hidden paragraph giving the operating instructions —
  which box to type in, what is accepted, and the arrow-key / wheel stepping.
  Sighted users get the same information from the formula itself, from the
  boxes' visible unit marks, and from the masthead's Help dialog.

## Text alternatives

* The artwork is one inline `<svg role="img">` with a `<title>` ("Geometry of
  stellar parallax, not to scale") and `aria-describedby` pointing at a
  visually-hidden paragraph that describes the whole figure in prose — the orbit,
  the two lines of sight, the parallax half-angle marked twice, the distance
  brace, and the displacement brace — and states that the figure does not change
  as the calculator is used.
* The layer of positioned diagram labels is `aria-hidden="true"`. Its content is
  already carried by that description, so screen readers do not hear the labels
  twice, out of spatial context. The labels remain real, selectable, zoomable
  text on screen, and the mathematical ones are still MathJax objects.
* The formula carries a visually-hidden spoken description, written through the
  foundation helper `klunlShowEquation()`: *"The distance d to a star equals 1
  divided by its parallax angle measured in arcseconds. The result is in
  parsecs; multiplying it by 3.26 gives the distance in lightyears."*

## Mathematics

* **Every** mathematical symbol in the interface is typeset by MathJax from
  LaTeX — the `d`, all four `=` signs, both `1` numerators, `π″` in the printed
  fraction, the `″`, `pc` and `ly` unit marks beside the boxes, both `π` labels
  and the `d` and `1 AU` labels in the diagram, and both footnotes. Nothing is
  an image, ASCII art, hand-built `<sub>`/`<sup>`, or text painted into a canvas.
  Right-clicking any of it opens MathJax's own menu ("Show Math As → TeX /
  MathML"); the menu is neither disabled nor overridden, and no `contextmenu`
  handler is attached anywhere.
* All 18 typeset expressions are set to `tabindex="-1"` after typesetting, so
  none of them is a tab stop, while the context menu and the assistive MathML
  both keep working. Verified in the browser: the only tabbable elements on the
  page are the skip link, the masthead's Reset / Help / About buttons, and the
  three value boxes.
* The unit marks beside the boxes (`″`, `pc`, `ly`) are visible **and** are the
  boxes' `<label>` elements. The typeset symbol inside each label is
  `aria-hidden`, and a `.sr-only` sibling supplies the spoken name, so clicking
  "pc" focuses the parsec box while a screen reader announces "Distance in
  parsecs".

## Colour and contrast

* Palette comes entirely from the foundation's custom properties. Body text is
  `--foreground-color` (#1a1a1a) on `--background-color` (#ffffff): over 16 : 1.
* The exported line art is black on white.
* Field borders use `--border-color` (#767676) on white: 4.5 : 1, above the
  3 : 1 needed for a control boundary. The focused field also takes the
  `--outline-color` border in addition to the foundation's focus ring, so focus
  is never signalled by colour alone.
* No original colour needed remapping, and no state anywhere in this simulation
  is encoded by colour.
* A `forced-colors` rule keeps the field borders visible in Windows
  high-contrast mode.

## Keyboard

| Key | Effect |
| --- | --- |
| `Tab` / `Shift+Tab` | Move between the skip link, the masthead buttons and the three value boxes, in reading order. No traps. |
| Typing | Only digits and `.` are accepted, up to 5 characters — the original's `restrict` and `maxLength`. |
| `↑` / `↓` | Step the focused box up or down. |
| `Page Up` / `Page Down` | Step ten times as far. |
| Mouse wheel | Same step as `↑` / `↓`, and only while the box has focus, so scrolling the page over a box never changes it. |
| `Escape` | Closes the masthead's Help / About dialog (handled by the component). |

The step is one unit in the second significant digit, so it scales with the
value: 1 → 1.1, but 0.005 → 0.0051. That keeps the arrow keys useful whether
the reader is working in thousandths of an arcsecond or in hundreds of parsecs.
Values are clamped at zero (the original accepts no minus sign). `Home`/`End`
are not bound: the fields have no meaningful minimum or maximum.

Stepping and typing both run through the same three handlers, so the pointer
path and the keyboard path can never disagree.

`:focus-visible` styling comes from the foundation. The masthead dialog manages
its own focus trapping and restoration; nothing here interferes with it.

## Screen-reader narration (NVDA and VoiceOver)

* A `aria-live="polite"`, `aria-atomic="true"` status region announces the full
  state after a change has settled — 700 ms after the last keystroke, wheel tick
  or arrow press, never on every character:

  > "Parallax angle 0.5 arcseconds. Distance 2 parsecs, or 6.52 lightyears."

  Reset announces "Calculator reset." followed by the same sentence.
* **Units are always spoken with the number, along with the quantity's name.**
  Nothing is announced as a bare number. Units are spelled as full words
  ("arcseconds", "parsecs", "lightyears") rather than left as symbols that a
  screen reader would skip or mispronounce, and singular forms are used at a
  value of 1. A box that cannot be computed is announced as "not defined"
  rather than as the literal `...` shown on screen.
* Each box's accessible name is its full quantity and unit — "Parallax angle in
  arcseconds", "Distance in parsecs", "Distance in lightyears" — so moving focus
  through the fields reads a clear name plus value plus unit for each, in both
  NVDA and VoiceOver, without depending on the adjacent visual unit mark.
* The footnote "π measured in arcseconds (")" is spoken as "pi measured in
  arcseconds (the double prime symbol)".

## Zoom, reflow and responsiveness

* Body copy is 1.125 rem and everything is sized in rem, %, `fr`, `em` or
  container units — no fixed pixel heights that could crop text.
* The artwork keeps the original internal coordinate system and is scaled by
  CSS with its aspect ratio preserved, so it reflows without any change to the
  drawing or arithmetic.
* Verified at 1280 px, at 640 px (equivalent to 1280 px at 200 % browser zoom)
  and at 390 px phone portrait: no horizontal scrolling, nothing clipped, and no
  two diagram labels overlap at any of those widths.
* Layout is a single stacked column at every width, matching the original's
  reading order; the formula wraps as a whole rather than overflowing. The
  foundation's own 56 rem collapse rule is left intact; the extra 48 rem and
  32 rem breakpoints live only in `styles/styles.css`.
* Every value box is 2.75 rem (44 px) tall, meeting the touch-target minimum,
  and all three share one width and height. No control depends on hover.

### Known limitation

On a phone in portrait the diagram is only about 370 px wide, so its labels are
allowed to shrink to roughly 10 px rather than collide with each other. Nothing
is lost: the complete description of the figure is in the screen-reader
description, and browser or pinch zoom enlarges the whole figure — labels and
artwork together — because both scale from the same container.

## Motion

The simulation has no animation, no timing, and nothing that flashes, so no
Pause control is needed (2.2.2 and 2.3.3 are met by construction). A
`prefers-reduced-motion` rule is present anyway so that no future transition can
be introduced without honouring the preference.

## Still required

Automated and structural checking only goes so far. **Human screen-reader QA is
still required** — at minimum NVDA with Chrome and Firefox on Windows, and
VoiceOver with Safari and Chrome on macOS and iOS — to confirm that the live
region fires when expected, that announcements are neither duplicated nor
truncated, and that the MathJax assistive MathML reads sensibly in each
combination.
