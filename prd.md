# PART I: STRATEGIC VISION

## Executive Summary

Plica is a "Zero-Waste" imposition utility designed for the independent publishing community. Unlike commercial PDF viewers that over-scale and waste margins, Plica provides surgical control over page placement for saddle-stitched (stapled) booklets. It transforms a standard portrait PDF into a landscape "Print-Ready" PDF, reordering pages for a physical fold while maximizing the printable area without distorting the original artwork's aspect ratio.

## Target Audience & Success Metrics

- **Primary Persona:** Zine-makers, poets, and community organizers.
    
- **Pain Point:** Inefficient scaling in standard "Booklet" print settings and the "mental tax" of manual page reordering.
    
- **KPIs:**
    
    - **Margin Efficiency:** >95% utilization of the target sheet area (excluding hardware-enforced printer margins).
        
    - **Zero-Server Footprint:** 100% of PDF processing happens in the browser's memory.
        
    - **Speed to Print:** <10s processing time for a 32-page PDF.
        

## User Experience Story

The user has a 12-page PDF of their poetry. They drag it into Plica. The app immediately confirms the page count is a multiple of 4 (or adds blanks). The user sees a simple list of "Sheets" (e.g., Sheet 1 Front: Pages 12 & 1). They enable "Trim Marks for Covers" to help with post-print cutting. They click "Generate Print PDF," and a new landscape file downloads. When they print this double-sided (flip on short-edge), they fold the stack, staple the spine, trim the edges using the guides, and their zine is complete.

## Decolonial Design, Ethics & Vibe

- **Agency:** No "Account Required" or "Cloud Saving." The user owns their data.
    
- **Vibe:** "Industrial Brutalist" – High utility, mono-spaced fonts, clear borders, and high-contrast UI (WCAG 2.1 AAA).
    
- **Accessibility:** Large click-targets for file uploads; keyboard-navigable interface.
    

# PART II: TECHNICAL EXECUTION

## Functional Requirements & Acceptance Criteria

|ID|Feature|Description|Acceptance Criteria (AC)|
|---|---|---|---|
|F01|**WASM PDF Engine**|Use `pdf-lib` for client-side manipulation.|No data sent to any server; works offline after load.|
|F02|**Signature Logic**|Reorder pages for saddle-stitch (4-page signatures).|Page order: [Last, 1, 2, Last-1] etc.|
|F03|**Smart Padding**|Auto-inject blank pages at the end.|Final page count MUST be `Math.ceil(count / 4) * 4`.|
|F04|**Aspect-Ratio Scaling**|Maximize page size while preserving original proportions.|Use `Math.min(targetW/sourceW, targetH/sourceH)` for scale factor.|
|F05|**Validation Guard**|Orientation and size consistency check.|Error toast if pages differ in size/orientation.|
|F06|**Fold Guideline**|Optional 0.25pt dashed center line.|Toggleable; center-aligned on the landscape sheet.|
|F07|**Faithful Trim Marks**|Optional crop marks on Sheet 1 Front (Cover/Back).|Only appears on the outermost sheet; placed exactly at the 4 corners of the original page dimensions (no offset).|

## Architectural Diagrams (Mermaid)

### Imposition Logic Flow

```
graph TD
    A[Upload PDF] --> B{Valid Size/Orientation?}
    B -- No --> C[Error: Mixed Dimensions]
    B -- Yes --> D[Calculate Blanks]
    D --> E[Generate Signature Map]
    E --> F[PDF-lib: Create New Doc]
    F --> G[Calculate Max Scale Factor]
    G --> H[Draw Pages & Rotate 90deg]
    H --> I{Cover Sheet?}
    I -- Yes --> J[Add Exact-Edge Trim Marks]
    I -- No --> K[Continue]
    J --> L[Add Optional Fold Line]
    K --> L
    L --> M[Trigger Browser Download]
```

### Data Schema (In-Memory Only)

```
erDiagram
    SOURCE_PDF {
        int total_pages
        float width
        float height
        float aspect_ratio
    }
    IMPOSITION_MAP {
        int sheet_index
        string side "Front/Back"
        int left_page_index
        int right_page_index
        bool is_cover_sheet
    }
    SOURCE_PDF ||--o{ IMPOSITION_MAP : "mapped_to"
```

## Logic, State & Edge Cases

- **Imposition Formula:** - For sheet `i` (starting at 0) and total pages `N`:
    
    - **Front Side:** Left = `N - (2*i)`, Right = `(2*i) + 1` (If `i=0`, this is the cover sheet).
        
    - **Back Side:** Left = `(2*i) + 2`, Right = `N - (2*i) - 1`.
        
- **Scaling Logic:**
    
    - Source: `[sw, sh]` (Portrait). Target: `[tw/2, th]` (Half of landscape sheet).
        
    - `Scale = Math.min((tw/2) / sw, th / sh)`.
        
    - Centering: Calculate `x_offset` and `y_offset` based on the delta between scaled source and target half-sheet.
        
- **Trim Marks Logic:**
    
    - Only applied if `sheet_index === 0` AND `side === 'Front'`.
        
    - Draws 10mm L-shaped marks (0.5pt thickness) at the four corners of the combined "Cover + Back" area. Marks are flush with the calculated page edges.
        
- **Printing Logic:** Default to "Flip on Short Edge" logic. All pages face the same orientation (no 180-degree rotation needed for back sides).
    

## Data Model (Client-Side State)

- `FileState`: `{ name: string, size: number, pageCount: number, dimensions: {w, h} }`
    
- `ProcessingOptions`: `{ showFoldLine: boolean, showTrimMarks: boolean, targetSize: 'A4' | 'Letter' }`
    

## Technical Stack

- **Framework:** Next.js 14 (App Router).
    
- **PDF Library:** `pdf-lib`.
    
- **Styling:** Tailwind CSS.
    
- **Deployment:** Vercel or GitHub Pages.
    

## Testing & Documentation Plan

- **Unit Test:** Verify scale calculation for various aspect ratios (e.g., Square source to Letter landscape).
    
- **Logic Test:** Ensure `is_cover_sheet` flag is only true for the first sheet generated.
    
- **Documentation:** Explicit instructions for the "Short-Edge" printing setting to ensure layout consistency.
    

## Development Roadmap

- **Phase 1:** Core PDF upload + Signature logic + Aspect-ratio scaling.
    
- **Phase 2:** Toggleable UI for Fold Lines and Cover Trim Marks.
    
- **Phase 3:** Visual preview of Sheet 1 to confirm trim mark placement.
