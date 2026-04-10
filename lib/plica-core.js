// Plica Core — shared imposition engine
// Used by both plica.html (browser) and plica.js (Node CLI).
// UMD wrapper: works as <script> tag (window.PlicaCore) or CommonJS (module.exports).
// Takes PDFLib as a parameter so callers control how pdf-lib is loaded.

(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else {
    root.PlicaCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PAGE_SIZES = {
    LETTER: { width: 792, height: 612 },
    A4: { width: 841.89, height: 595.28 },
  };

  function drawTrimMarks(PDFLib, page, x, y, width, height, pageWidth, pageHeight) {
    const { rgb } = PDFLib;
    const lineLen = 20;
    const thickness = 0.5;
    const color = rgb(0.7, 0.7, 0.7);
    const dashArray = [2, 2];

    page.drawLine({ start: { x: 0, y: y + height }, end: { x: lineLen, y: y + height }, thickness, color, dashArray });
    page.drawLine({ start: { x: pageWidth - lineLen, y: y + height }, end: { x: pageWidth, y: y + height }, thickness, color, dashArray });
    page.drawLine({ start: { x: 0, y }, end: { x: lineLen, y }, thickness, color, dashArray });
    page.drawLine({ start: { x: pageWidth - lineLen, y }, end: { x: pageWidth, y }, thickness, color, dashArray });

    const center = pageWidth / 2;
    page.drawLine({ start: { x: center - lineLen / 2, y: y + height }, end: { x: center + lineLen / 2, y: y + height }, thickness, color, dashArray });
    page.drawLine({ start: { x: center, y: y + height }, end: { x: center, y: y + height + lineLen }, thickness, color, dashArray });
    page.drawLine({ start: { x: center - lineLen / 2, y }, end: { x: center + lineLen / 2, y }, thickness, color, dashArray });
    page.drawLine({ start: { x: center, y }, end: { x: center, y: y - lineLen }, thickness, color, dashArray });
  }

  // imposeBooklet — produces a saddle-stitched booklet PDF from a source PDFDocument.
  //
  // Args:
  //   PDFLib  — the loaded pdf-lib module (window.PDFLib in browser, require('pdf-lib') in Node)
  //   srcDoc  — a pdf-lib PDFDocument already loaded from the source bytes
  //   options — { targetSize?: 'LETTER'|'A4', pageFrom?: number, pageTo?: number,
  //               showFoldLine?: boolean, showTrimMarks?: boolean }
  //             pageFrom/pageTo are 1-indexed and inclusive. Omit for full document.
  //
  // Returns: { outDoc, sourcePages, padded, sheets }
  //   outDoc      — new PDFDocument; caller saves it
  //   sourcePages — number of source pages used (after page-range slicing)
  //   padded      — number of blank pages auto-appended to reach a multiple of 4
  //   sheets      — physical sheets in the booklet
  async function imposeBooklet(PDFLib, srcDoc, options) {
    const { PDFDocument, rgb } = PDFLib;
    const opts = Object.assign({
      targetSize: 'LETTER',
      pageFrom: null,
      pageTo: null,
      showFoldLine: false,
      showTrimMarks: false,
    }, options || {});

    if (!PAGE_SIZES[opts.targetSize]) {
      throw new Error(`Invalid size: ${opts.targetSize}. Use LETTER or A4.`);
    }

    const allPages = srcDoc.getPages();
    const fromIdx = opts.pageFrom ? Math.max(0, parseInt(opts.pageFrom, 10) - 1) : 0;
    const toIdx = opts.pageTo ? Math.min(allPages.length, parseInt(opts.pageTo, 10)) : allPages.length;
    if (fromIdx >= toIdx) throw new Error('Invalid page range.');
    const srcPages = allPages.slice(fromIdx, toIdx);

    const firstPage = srcPages[0].getSize();
    srcPages.forEach((p, i) => {
      const s = p.getSize();
      if (Math.abs(s.width - firstPage.width) > 2 || Math.abs(s.height - firstPage.height) > 2) {
        throw new Error(`Inconsistent page size at page ${i + 1}. All pages must be identical.`);
      }
    });

    const N_real = srcPages.length;
    // Pad to a multiple of 4 with blank pages so the signature is complete.
    // Indices >= N_real are treated as blank during imposition.
    const padded = (4 - (N_real % 4)) % 4;
    const N = N_real + padded;
    const physicalSheets = Math.ceil(N / 4);
    const isBlank = (idx) => idx >= N_real;

    const outDoc = await PDFDocument.create();
    const targetDim = PAGE_SIZES[opts.targetSize];
    const halfWidth = targetDim.width / 2;
    const halfHeight = targetDim.height;

    const scale = Math.min(halfWidth / firstPage.width, halfHeight / firstPage.height);
    const scaledW = firstPage.width * scale;
    const scaledH = firstPage.height * scale;
    const xOffset = Math.abs(halfWidth - scaledW) < 1 ? 0 : (halfWidth - scaledW) / 2;
    const yOffset = Math.abs(halfHeight - scaledH) < 1 ? 0 : (halfHeight - scaledH) / 2;

    for (let s = 0; s < physicalSheets; s++) {
      const fLeftIdx = N - 1 - 2 * s;
      const fRightIdx = 2 * s;
      const bLeftIdx = N - 2 - 2 * s;
      const bRightIdx = 2 * s + 1;
      const placed = new Set();

      const frontPage = outDoc.addPage([targetDim.width, targetDim.height]);
      if (fLeftIdx >= 0 && fLeftIdx < N && !placed.has(fLeftIdx)) {
        placed.add(fLeftIdx);
        if (!isBlank(fLeftIdx)) {
          const [embedded] = await outDoc.embedPages([srcPages[fLeftIdx]]);
          frontPage.drawPage(embedded, { x: xOffset, y: yOffset, width: scaledW, height: scaledH });
        }
      }
      if (fRightIdx >= 0 && fRightIdx < N && !placed.has(fRightIdx)) {
        placed.add(fRightIdx);
        if (!isBlank(fRightIdx)) {
          const [embedded] = await outDoc.embedPages([srcPages[fRightIdx]]);
          frontPage.drawPage(embedded, { x: halfWidth + xOffset, y: yOffset, width: scaledW, height: scaledH });
        }
      }
      if (opts.showTrimMarks && s === 0) {
        drawTrimMarks(PDFLib, frontPage, xOffset, yOffset, scaledW, scaledH, targetDim.width, targetDim.height);
      }
      if (opts.showFoldLine) {
        frontPage.drawLine({
          start: { x: halfWidth, y: 10 },
          end: { x: halfWidth, y: targetDim.height - 10 },
          thickness: 0.25,
          dashArray: [2, 2],
          color: rgb(0.8, 0.8, 0.8),
        });
      }

      const hasBackLeft = bLeftIdx >= 0 && bLeftIdx < N && !placed.has(bLeftIdx);
      const hasBackRight = bRightIdx >= 0 && bRightIdx < N && !placed.has(bRightIdx);
      if (hasBackLeft || hasBackRight) {
        const backPage = outDoc.addPage([targetDim.width, targetDim.height]);
        if (hasBackLeft) {
          placed.add(bLeftIdx);
          if (!isBlank(bLeftIdx)) {
            const [embedded] = await outDoc.embedPages([srcPages[bLeftIdx]]);
            backPage.drawPage(embedded, {
              x: xOffset + scaledW,
              y: yOffset + scaledH,
              xScale: -scale,
              yScale: -scale,
            });
          }
        }
        if (hasBackRight) {
          placed.add(bRightIdx);
          if (!isBlank(bRightIdx)) {
            const [embedded] = await outDoc.embedPages([srcPages[bRightIdx]]);
            backPage.drawPage(embedded, {
              x: halfWidth + xOffset + scaledW,
              y: yOffset + scaledH,
              xScale: -scale,
              yScale: -scale,
            });
          }
        }
        if (opts.showFoldLine) {
          backPage.drawLine({
            start: { x: halfWidth, y: 10 },
            end: { x: halfWidth, y: targetDim.height - 10 },
            thickness: 0.25,
            dashArray: [2, 2],
            color: rgb(0.8, 0.8, 0.8),
          });
        }
      }
    }

    return { outDoc, sourcePages: N_real, padded, sheets: physicalSheets };
  }

  return { PAGE_SIZES, imposeBooklet };
}));
