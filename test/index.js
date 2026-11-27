import * as fontkit from 'fontkit';
import assert from 'assert';

describe('fontkit', function () {
  it('should open a font asynchronously', async () => {
    let font = await fontkit.open(
      new URL('data/OpenSans/OpenSans-Regular.ttf', import.meta.url),
    );
    assert.equal(font.type, 'TTF');
  });

  it('should open a font synchronously', function () {
    let font = fontkit.openSync(
      new URL('data/OpenSans/OpenSans-Regular.ttf', import.meta.url),
    );
    return assert.equal(font.type, 'TTF');
  });

  it('should open fonts of different formats', function () {
    let font = fontkit.openSync(
      new URL('data/OpenSans/OpenSans-Regular.ttf', import.meta.url),
    );
    assert.equal(font.type, 'TTF');

    font = fontkit.openSync(
      new URL('data/SourceSansPro/SourceSansPro-Regular.otf', import.meta.url),
    );
    assert.equal(font.type, 'TTF');

    font = fontkit.openSync(
      new URL('data/NotoSans/NotoSans.ttc', import.meta.url),
    );
    assert.equal(font.type, 'TTC');

    font = fontkit.openSync(
      new URL('data/NotoSans/NotoSans.ttc', import.meta.url),
      'NotoSans',
    );
    assert.equal(font.type, 'TTF');

    font = fontkit.openSync(
      new URL('data/NotoSans/NotoSans.dfont', import.meta.url),
    );
    assert.equal(font.type, 'DFont');

    font = fontkit.openSync(
      new URL('data/NotoSans/NotoSans.dfont', import.meta.url),
      'NotoSans',
    );
    assert.equal(font.type, 'TTF');

    font = fontkit.openSync(
      new URL('data/SourceSansPro/SourceSansPro-Regular.woff', import.meta.url),
    );
    assert.equal(font.type, 'WOFF');

    font = fontkit.openSync(
      new URL(
        'data/SourceSansPro/SourceSansPro-Regular.woff2',
        import.meta.url,
      ),
    );
    assert.equal(font.type, 'WOFF2');
  });

  it('should open fonts lacking PostScript name', function () {
    let font = fontkit.openSync(
      new URL('data/Mada/Mada-Regular.subset1.ttf', import.meta.url),
    );
    assert.equal(font.postscriptName, null);
  });

  it('should error when opening an invalid font asynchronously', async function () {
    assert.rejects(
      fontkit.open(new URL(import.meta.url)),
      'Unknown font format',
    );
  });

  it('should error when opening an invalid font synchronously', function () {
    assert.throws(
      () => fontkit.openSync(new URL(import.meta.url)),
      /Unknown font format/,
    );
  });

  it('should get collection objects for ttc fonts', function () {
    let collection = fontkit.openSync(
      new URL('data/NotoSans/NotoSans.ttc', import.meta.url),
    );
    assert.equal(collection.type, 'TTC');

    let names = collection.fonts.map((f) => f.postscriptName);
    assert.deepEqual(names, [
      'NotoSans-Bold',
      'NotoSans',
      'NotoSans-Italic',
      'NotoSans-BoldItalic',
    ]);

    let font = collection.getFont('NotoSans-Italic');
    return assert.equal(font.postscriptName, 'NotoSans-Italic');
  });

  it('should select the regular face when none is named for ttc fonts', function () {
    let collection = fontkit.openSync(
      new URL('data/NotoSans/NotoSans.ttc', import.meta.url),
    );

    let font = collection.getFont();
    assert.equal(font.postscriptName, 'NotoSans');

    // The regular face is narrower than the first face in the file.
    let bold = collection.getFont('NotoSans-Bold');
    let regular = font.glyphForCodePoint(0x41);
    let boldA = bold.glyphForCodePoint(0x41);
    assert.equal(regular.advanceWidth, 1309);
    assert.equal(boldA.advanceWidth, 1413);
    assert.deepEqual(regular.path.commands[0].args, [1116, 0]);
    assert.deepEqual(boldA.path.commands[0].args, [1079, 0]);
  });

  it('should select faces by style for ttc fonts', function () {
    let collection = fontkit.openSync(
      new URL('data/NotoSans/NotoSans.ttc', import.meta.url),
    );

    assert.equal(collection.getFont('regular').postscriptName, 'NotoSans');
    assert.equal(
      collection.getFont('italic').postscriptName,
      'NotoSans-Italic',
    );
    assert.equal(collection.getFont('bold').postscriptName, 'NotoSans-Bold');
    assert.equal(
      collection.getFont('Bold Italic').postscriptName,
      'NotoSans-BoldItalic',
    );
    assert.equal(collection.getFont('NotoSans-Bold Italic'), null);
  });

  it('should advance and outline italic A as its own face', function () {
    let collection = fontkit.openSync(
      new URL('data/NotoSans/NotoSans.ttc', import.meta.url),
    );
    let font = collection.getFont('italic');
    let A = font.glyphForCodePoint(0x41);
    let V = font.glyphForCodePoint(0x56);

    assert.equal(A.advanceWidth, 1151);
    assert.equal(A.bbox.minX, -117);
    assert.equal(A.bbox.maxX, 1051);
    assert.equal(A.bbox.maxY, 1462);
    assert.equal(V.advanceWidth, 1130);
    assert.equal(V.bbox.minX, 188);

    // The next glyph starts at the advance, not at the outline's right edge.
    let run = font.layout('AV', { kern: false });
    assert.equal(run.advanceWidth, 2281);
    assert.deepEqual(
      run.positions.map((p) => p.xAdvance),
      [1151, 1130],
    );
  });

  it('should get collection objects for dfonts', function () {
    let collection = fontkit.openSync(
      new URL('data/NotoSans/NotoSans.dfont', import.meta.url),
    );
    assert.equal(collection.type, 'DFont');

    let names = collection.fonts.map((f) => f.postscriptName);
    assert.deepEqual(names, [
      'NotoSans',
      'NotoSans-Bold',
      'NotoSans-Italic',
      'NotoSans-BoldItalic',
    ]);

    let font = collection.getFont('NotoSans-Italic');
    assert.equal(font.postscriptName, 'NotoSans-Italic');

    // Neither naming a face nor naming a style changes how the faces read.
    assert.equal(collection.getFont().postscriptName, 'NotoSans');
    assert.equal(
      collection.getFont('italic').postscriptName,
      'NotoSans-Italic',
    );
    assert.equal(
      collection.getFont().glyphForCodePoint(0x41).advanceWidth,
      1309,
    );
    assert.equal(
      collection.getFont('italic').glyphForCodePoint(0x41).advanceWidth,
      1151,
    );
  });
});
