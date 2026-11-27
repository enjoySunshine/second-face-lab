import fs from 'node:fs';
import { openSync } from '../src/node.js';
import Path from '../src/glyph/Path.js';

// The collection holds four faces of the same typeface. Unless a face is
// named, `getFont()` selects the regular one; naming "italic" selects the
// italic face, and nothing else.
const COLLECTION = new URL(
  '../test/data/NotoSans/NotoSans.ttc',
  import.meta.url,
);
const TEXT = 'AV';

function parseArgs(argv) {
  let options = { face: null, style: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    if (arg === '--face') options.face = argv[++i];
    else if (arg === '--style') options.style = argv[++i];
    else if (arg === '--out') options.out = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

// Either selects the face while opening the file (--face), or opens the
// collection and selects it while drawing (--style, or nothing at all).
function openFace({ face, style }) {
  if (face) {
    return openSync(COLLECTION, face);
  }

  let collection = openSync(COLLECTION);
  return collection.getFont(style ?? undefined);
}

function setupFace(font, text) {
  // Lay out the line with the faces' own advance widths: the next glyph
  // starts at the previous glyph's advance, not at the edge of its outline.
  let run = font.layout(text, { kern: false });

  // Draw the line as one path: the second glyph is translated by the
  // advance of the first, and both outlines share these commands.
  let path = new Path();
  let pen = 0;
  for (let i = 0; i < run.glyphs.length; i++) {
    let glyph = run.glyphs[i];
    let offsetX = pen + run.positions[i].xOffset;
    let offsetY = run.positions[i].yOffset;
    for (let command of glyph.path.commands) {
      let args = [];
      for (let j = 0; j < command.args.length; j += 2) {
        args.push(command.args[j] + offsetX, command.args[j + 1] + offsetY);
      }

      path[command.command](...args);
    }

    pen += run.positions[i].xAdvance;
  }

  let first = run.glyphs[0];
  let second = run.glyphs[1];
  let secondPen = run.positions[0].xAdvance + (run.positions[1].xOffset ?? 0);
  let firstOrigin = first.path.commands[0];

  return {
    font,
    run,
    path,
    line: {
      text,
      advance: pen,
      bbox: path.bbox,
      glyphStart: firstOrigin,
      glyphBox: first.bbox,
      nextStart: secondPen,
      nextBox: second.bbox,
    },
  };
}

function svg({ line, path }) {
  let box = line.bbox;
  let width = Math.max(1, Math.ceil(box.maxX - box.minX));
  let height = Math.max(1, Math.ceil(box.maxY - box.minY));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.minX} ${-box.maxY} ${width} ${height}" width="${width * 2}" height="${height * 2}">
  <rect x="${box.minX}" y="${-box.maxY}" width="${width}" height="${height}" fill="#111"/>
  <path d="${path.toSVG()}" transform="scale(1,-1)" fill="#f4f1ea"/>
</svg>
`;
}

function main() {
  let options = parseArgs(process.argv.slice(2));
  let font = openFace(options);
  if (!font) {
    throw new Error('No face selected');
  }

  let selected = setupFace(font, TEXT);
  let out = options.out
    ? new URL(options.out, import.meta.url)
    : new URL('./out.svg', import.meta.url);
  fs.writeFileSync(out, svg(selected));

  let l = selected.line;
  console.log(`face: ${font.postscriptName}`);
  console.log(
    `line "${l.text}": total advance ${l.advance}, ` +
      `bbox ${l.bbox.minX} ${l.bbox.minY} ${l.bbox.maxX} ${l.bbox.maxY}`,
  );
  console.log(
    `  ${l.text[0]}: advance ${selected.run.positions[0].xAdvance}, ` +
      `starts at ${l.glyphStart.args.join(', ')}, ` +
      `outline spans ${l.glyphBox.minX}..${l.glyphBox.maxX}, ` +
      `height ${l.glyphBox.maxY}`,
  );
  console.log(
    `  ${l.text[1]}: starts at ${l.nextStart}, ` +
      `outline spans ${l.nextBox.minX}..${l.nextBox.maxX}, ` +
      `height ${l.nextBox.maxY}`,
  );
  console.log(`wrote ${out.pathname}`);
}

main();
