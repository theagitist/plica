#!/usr/bin/env node
// Plica CLI — Zero-Waste Zine Imposition Engine
// Thin I/O wrapper around lib/plica-core.js (shared with plica.html).
// Usage: node plica.js <input.pdf> [options]

const fs = require('fs');
const path = require('path');
const PDFLib = require(path.join(__dirname, 'lib', 'pdf-lib.min.js'));
const PlicaCore = require(path.join(__dirname, 'lib', 'plica-core.js'));

function printHelp() {
  console.log(`Plica — Zero-Waste Zine Imposition Engine

Usage:
  plica <input.pdf> [options]

Options:
  -o, --output <file>      Output PDF path (default: plica_<name>_booklet.pdf)
  -s, --size <LETTER|A4>   Target paper size (default: LETTER)
  -f, --from <n>           First source page to include (1-indexed)
  -t, --to <n>             Last source page to include (1-indexed, inclusive)
      --fold-line          Draw a dashed center fold line on every sheet
      --trim-marks         Draw trim marks on the cover sheet
  -h, --help               Show this help

Examples:
  plica zine.pdf
  plica zine.pdf -s A4 -o out.pdf
  plica zine.pdf --from 3 --to 18 --fold-line
`);
}

function parseArgs(argv) {
  const opts = {
    input: null,
    output: null,
    targetSize: 'LETTER',
    pageFrom: null,
    pageTo: null,
    showFoldLine: false,
    showTrimMarks: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '-h': case '--help': opts.help = true; break;
      case '-o': case '--output': opts.output = next(); break;
      case '-s': case '--size': opts.targetSize = next().toUpperCase(); break;
      case '-f': case '--from': opts.pageFrom = parseInt(next(), 10); break;
      case '-t': case '--to': opts.pageTo = parseInt(next(), 10); break;
      case '--fold-line': opts.showFoldLine = true; break;
      case '--no-fold-line': opts.showFoldLine = false; break;
      case '--trim-marks': opts.showTrimMarks = true; break;
      case '--no-trim-marks': opts.showTrimMarks = false; break;
      default:
        if (a.startsWith('-')) {
          throw new Error(`Unknown option: ${a}`);
        }
        if (opts.input) throw new Error(`Unexpected argument: ${a}`);
        opts.input = a;
    }
  }
  return opts;
}

(async () => {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`[X] ${e.message}`);
    printHelp();
    process.exit(2);
  }
  if (opts.help || !opts.input) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }
  if (!fs.existsSync(opts.input)) {
    console.error(`[X] Input file not found: ${opts.input}`);
    process.exit(1);
  }

  try {
    const bytes = fs.readFileSync(opts.input);
    const srcDoc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
    const { outDoc, sourcePages, padded, sheets } = await PlicaCore.imposeBooklet(PDFLib, srcDoc, {
      targetSize: opts.targetSize,
      pageFrom: opts.pageFrom,
      pageTo: opts.pageTo,
      showFoldLine: opts.showFoldLine,
      showTrimMarks: opts.showTrimMarks,
    });
    const pdfBytes = await outDoc.save();
    const outPath = opts.output || `plica_${path.basename(opts.input, '.pdf')}_booklet.pdf`;
    fs.writeFileSync(outPath, pdfBytes);
    if (padded > 0) {
      console.warn(`[!] ${sourcePages} pages is not divisible by 4 — ${padded} blank page(s) appended to complete the signature.`);
    }
    console.log(`[OK] ${sourcePages} pages -> ${sheets} sheet(s)`);
    console.log(`[->] ${outPath}`);
  } catch (e) {
    console.error(`[X] Architecture Failure: ${e.message}`);
    process.exit(1);
  }
})();
