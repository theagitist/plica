# CLAUDE.md — Plica Project Context

## Build & Development

- **No build step required.** Open `plica.html` directly in a browser, or run `./plica <file.pdf>` for the CLI.
- **Dependencies:** All bundled locally in `lib/`. No internet connection needed, no `npm install`.
- **Engine:** pdf-lib v1.17.1 loaded from `lib/pdf-lib.min.js`.
- **Shared core:** `lib/plica-core.js` is a UMD module containing the imposition logic. It is the single source of truth — both `plica.html` (browser) and `plica.js` (Node CLI) consume it. The wrappers only handle I/O; never duplicate imposition logic in them.

## Technical Standards

- **Architecture:** Standalone HTML with inline React (via Babel standalone). No framework, no server.
- **Styling:** Tailwind CSS only (no custom CSS files).
- **Design System:** "Industrial Brutalist"
    - Font: JetBrains Mono or standard system monospace.
    - Palette: High-contrast Zinc-900 (#18181b) and White (#ffffff).
    - UI Elements: 4px borders, 8px hard shadows, no rounded corners.
    - Icons: none (no icon fonts or SVG icons); the design is text-only brutalist. Use text-based indicators (e.g., [X], ->, +) or ASCII/UTF-8 symbols.
- **Privacy:** 100% Client-side. Do not implement server-side PDF processing.

## Domain Logic: Zine Imposition

- **Signatures:** Saddle-stitched booklet (all sheets nest together, staple at spine).
- **Imposition Formula:**
    - N_real = actual PDF page count (after page-range slicing).
    - If N_real is not a multiple of 4, blank pages are auto-appended to reach the next multiple. Callers receive `padded` count and should surface a warning to the user (toast in browser, stderr in CLI), but the booklet is still generated.
    - N = N_real + padded. Physical sheets = N / 4. All sheets are printed, folded, nested, and stapled.
    - For Sheet `s` (0-indexed):
        - Front-Left: `N - 1 - 2*s` (counts inward from last page)
        - Front-Right: `2*s` (counts inward from first page)
        - Back-Left: `N - 2 - 2*s` (pairs with Front-Left when folded)
        - Back-Right: `2*s + 1` (pairs with Front-Right when folded)
- **Back pages:** Rotated 180 degrees (negative xScale/yScale) for short-edge duplex printing.
- **Scaling:** Maximize area while preserving aspect ratio.
    - `ScaleFactor = Math.min(targetHalfWidth / sourceWidth, targetHeight / sourceHeight)`.
    - Offsets < 1pt are snapped to 0 to avoid sub-pixel margins.
- **Trim Marks:** Light gray dotted marks on Sheet 0 (Cover) only. Includes fold-line T-guides at center.

## Code Style

- Use `pdf-lib` for all document manipulation.
- Prefer explicit state management for processing steps.
- Error Handling: Use high-visibility custom toast components, never `alert()`.
