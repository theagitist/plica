# PLICA

**Zero-Waste Zine Imposition Engine**

Plica (Latin for _fold_) is a surgical-grade utility designed to eliminate the "technical tax" of self-publishing. It transforms standard portrait-oriented PDFs into print-ready landscape booklets using precise signature imposition logic.

Unlike commercial "booklet" print settings that over-scale and waste margins, Plica maximizes every millimeter of your paper while maintaining your original aspect ratio.

## Strategic Vision

- **Zero-Waste:** Maximizes printable area (>95% efficiency).
- **Sovereignty:** 100% client-side. Your data never leaves your browser.
- **Precision:** Faithful trim marks and optional fold guidelines.
- **Accessibility:** Industrial Brutalist UI designed for high contrast and utility.

## Key Features

- **Signature Mapping:** Automatic reordering for saddle-stitched (stapled) booklets.
- **Smart Padding:** Injects blank pages to ensure a multiple-of-4 page count.
- **Aspect-Ratio Locking:** Prevents distortion by maximizing size within boundaries.
- **Duplex-Ready:** Back pages are rotated 180 degrees for short-edge duplex printing.
- **Trim Marks:** Optional crop marks on the cover sheet with fold-line alignment guides.
- **Format Support:** US Letter and A4 landscape output.

## Technical Stack

- **Runtime:** Standalone HTML — no build step, no server, no installation.
- **Engine:** pdf-lib v1.17.1 (client-side PDF manipulation)
- **UI:** React v18.3.1 + Tailwind CSS v3.4.17 (via Babel standalone v7.26.10)
- **Dependencies:** All bundled locally in `lib/` — works fully offline.

## Usage

### Browser (GUI)

Open `plica.html` in any modern browser. No server or build step required.

1. Upload a portrait-oriented PDF.
2. Choose your output format (US Letter or A4).
3. Toggle trim marks and fold line as needed.
4. Click **Execute Plica** — the booklet is downloaded and previewed.

### Command Line (CLI)

Plica also ships as a Node.js script for scripting and batch use. It shares the same imposition engine (`lib/plica-core.js`) as the browser app.

```sh
./plica zine.pdf                                  # default: LETTER, no marks
./plica zine.pdf -s A4 --fold-line --trim-marks   # A4 with guides
./plica zine.pdf --from 3 --to 18 -o booklet.pdf  # page range + custom output
./plica --help                                    # full options
```

**Requirements:** Node.js (any recent version). No `npm install` needed — `lib/pdf-lib.min.js` is bundled.

**Install globally** (optional) by symlinking the wrapper into your `PATH`:

```sh
ln -s "$(pwd)/plica" /usr/local/bin/plica
plica zine.pdf                                    # now usable from anywhere
```

The bash wrapper resolves symlinks correctly, so it can live anywhere on your `PATH`.

## Printing Protocol

To achieve the intended result, follow these physical printing instructions:

1. **Scale:** Set your printer to **Actual Size** or **100% Scale**. Do not "Fit to Page."
2. **Duplex:** Enable double-sided printing.
3. **Orientation:** Select **Flip on Short Edge** (sometimes called "Head-to-Head").
4. **Finish:** Stack the sheets in the order they were printed, fold the stack in half, and staple along the spine.

## Ethics & Privacy

Plica is designed with a decolonial lens on data sovereignty. There is no "Cloud." There are no accounts. The tool is a standalone utility that respects the rhythm of the creator's intent and the privacy of their content.

_"The fold is the smallest unit of agency."_

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
