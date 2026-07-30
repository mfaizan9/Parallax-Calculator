# Parallax Calculator — HTML5

**This simulation must be served over HTTP. It will not run from a
double-clicked `index.html` (a `file://` path).**

## Why

The shared KL-UNL masthead (`foundation/kl-unl-masthead.js`) loads the
simulation's title and its Help / About text with
`fetch('foundation/contents.json')`. Browsers block `fetch()` of local files
under the `file://` protocol for security (the same-origin policy), so opening
`index.html` directly gives you a page with an empty or broken masthead and a
CORS error in the console. Served over HTTP the fetch succeeds and everything
loads normally.

## How to run it locally

Run one of these from **inside this `html5/` folder**:

```bash
python3 -m http.server 8123
```

```bash
npx serve
```

```bash
npx http-server
```

Then open <http://localhost:8123/> (or whatever port the tool prints).

Because the server is started from inside `html5/`, the simulation is at the
**server root** — the URL is `http://localhost:8123/`, not
`http://localhost:8123/html5/index.html`.

In VS Code you can instead right-click `index.html` and choose **Open with Live
Server** (the "Live Server" extension), which serves the folder over HTTP for
you.

## Production

Deployed to the cloud host — served over HTTP or HTTPS — it just works. The
`file://` limitation only affects local double-clicking.

## What is in this folder

| Path | Contents |
| --- | --- |
| `index.html` | Page scaffold: `.app-shell`, `<kl-unl-masthead>`, the diagram panel and the calculator panel |
| `foundation/` | The shared KL-UNL files, copied in **unchanged** (`kl-unl-masthead.js`, `kl-unl.css`, `kl-unl.js`, `contents.json`, favicons) |
| `styles/styles.css` | Simulation-specific styles only; the foundation is never edited |
| `simulation.js` | All simulation logic — the port of the original ActionScript |
| `assets/` | The exported Flash vector art, reused as-is, plus a local copy of MathJax |
| `CONVERSION_NOTES.md` | Behaviour model, ActionScript → HTML5 mapping, deviations |
| `ACCESSIBILITY.md` | WCAG 2.1 AA affordances, keyboard map, screen-reader wording |

There is no build step and there are no external dependencies. The only network
requests the page makes are for its own local files.
