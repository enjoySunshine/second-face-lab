/**
 * Selecting one face out of the faces stacked in a collection (TTC or DFont).
 *
 * A face can be named by its PostScript name, by its subfamily or full name
 * ("Regular", "Bold Italic"), or by the style it stands for ("regular",
 * "italic", "bold"). When no face is named, the collection selects the
 * regular face, so the same data can be drawn as body text without naming
 * which of the four faces to use.
 */

const STYLES = {
  regular: { bold: false, italic: false },
  normal: { bold: false, italic: false },
  roman: { bold: false, italic: false },
  upright: { bold: false, italic: false },
  book: { bold: false, italic: false },
  italic: { bold: false, italic: true },
  oblique: { bold: false, italic: true },
  bold: { bold: true, italic: false },
  boldregular: { bold: true, italic: false },
  bolditalic: { bold: true, italic: true },
  boldoblique: { bold: true, italic: true },
};

function normalizeName(name) {
  return name.toLowerCase().replace(/[\s_-]+/g, '');
}

/**
 * Reads the bold and italic bits of a face from its OS/2 table, falling back
 * to the macStyle bits in its head table.
 * @private
 */
export function fontStyle(font) {
  let fsSelection = font['OS/2'] && font['OS/2'].fsSelection;
  let macStyle = font.head && font.head.macStyle;
  return {
    bold: !!(fsSelection ? fsSelection.bold : macStyle && macStyle.bold),
    italic: !!(fsSelection ? fsSelection.italic : macStyle && macStyle.italic),
  };
}

/**
 * Whether a face is the unstyled, upright, non-bold one: the face used when
 * the text does not ask for another.
 * @private
 */
export function isRegularFace(font) {
  let fsSelection = font['OS/2'] && font['OS/2'].fsSelection;
  if (fsSelection && fsSelection.regular) {
    return true;
  }

  let subfamily = font.subfamilyName;
  if (typeof subfamily === 'string' && normalizeName(subfamily) === 'regular') {
    return true;
  }

  let { bold, italic } = fontStyle(font);
  return !bold && !italic;
}

function matchesPostscriptName(font, name) {
  let postscriptName = font.postscriptName;
  if (postscriptName === name) {
    return true;
  }

  return (
    postscriptName instanceof Uint8Array &&
    name instanceof Uint8Array &&
    postscriptName.length === name.length &&
    postscriptName.every((value, i) => value === name[i])
  );
}

function matchesName(font, name) {
  let wanted = name.trim().toLowerCase();
  for (let value of [font.subfamilyName, font.fullName]) {
    if (typeof value === 'string' && value.trim().toLowerCase() === wanted) {
      return true;
    }
  }

  return false;
}

/**
 * Selects a face from `fonts` by PostScript name or style name. With no name,
 * selects the regular face.
 * @private
 */
export function selectFace(fonts, name) {
  if (name == null) {
    return fonts.find(isRegularFace) || fonts[0] || null;
  }

  if (name instanceof Uint8Array || typeof name === 'string') {
    let face = fonts.find((font) => matchesPostscriptName(font, name));
    if (face) {
      return face;
    }

    if (typeof name !== 'string') {
      return null;
    }

    face = fonts.find((font) => matchesName(font, name));
    if (face) {
      return face;
    }

    let key = normalizeName(name);
    let style = Object.hasOwn(STYLES, key) ? STYLES[key] : null;
    if (style) {
      return (
        fonts.find((font) => {
          let actual = fontStyle(font);
          return actual.bold === style.bold && actual.italic === style.italic;
        }) || null
      );
    }
  }

  return null;
}
