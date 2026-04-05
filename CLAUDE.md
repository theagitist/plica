# CLAUDE.md — Plica Project Context

## Build & Development

- **No build step required.** Open `plica.html` directly in a browser.
- **Dependencies:** All bundled locally in `lib/`. No internet connection needed.
- **Engine:** pdf-lib v1.17.1 loaded from `lib/pdf-lib.min.js`.

## Technical Standards

- **Architecture:** Standalone HTML with inline React (via Babel standalone). No framework, no server.
- **Styling:** Tailwind CSS ONLY.
- **Design System:** "Industrial Brutalist"
    - Font: JetBrains Mono or standard system monospace.
    - Palette: High-contrast Zinc-900 (#18181b) and White (#ffffff).
    - UI Elements: 4px borders, 8px hard shadows, no rounded corners.
    - Icons: **STRICTLY FORBIDDEN**. Use text-based indicators (e.g., [X], ->, +) or ASCII/UTF-8 symbols.
- **Privacy:** 100% Client-side. Do not implement server-side PDF processing.

## Domain Logic: Zine Imposition

- **Signatures:** Always 4-page signatures (Saddle-Stitched logic).
- **Signature Formula:**
    - Total Pages (N) must be a multiple of 4 (pad with blanks).
    - For Sheet `i` (0-indexed):
        - Front-Left: `N - (2*i)`
        - Front-Right: `(2*i) + 1`
        - Back-Left: `(2*i) + 2`
        - Back-Right: `N - (2*i) - 1`
- **Back pages:** Rotated 180 degrees (negative xScale/yScale) for short-edge duplex printing.
- **Scaling:** Maximize area while preserving aspect ratio.
    - `ScaleFactor = Math.min(targetHalfWidth / sourceWidth, targetHeight / sourceHeight)`.
    - Offsets < 1pt are snapped to 0 to avoid sub-pixel margins.
- **Trim Marks:** Light gray dotted marks on Sheet 0 (Cover) only. Includes fold-line T-guides at center.

## Code Style

- Use `pdf-lib` for all document manipulation.
- Prefer explicit state management for processing steps.
- Error Handling: Use high-visibility custom toast components, never `alert()`.
