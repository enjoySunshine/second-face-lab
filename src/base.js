import { registerFormat, registerShaper } from './core.js';
import { TTFFont } from './TTFFont.js';
import { WOFFFont } from './WOFFFont.js';
import { WOFF2Font } from './WOFF2Font.js';
import { TrueTypeCollection } from './TrueTypeCollection.js';
import { DFont } from './DFont.js';
import { UniversalShaper } from './opentype/shapers/UniversalShaper.js';
import { ArabicShaper } from './opentype/shapers/ArabicShaper.js';
import { IndicShaper } from './opentype/shapers/IndicShaper.js';
import { HangulShaper } from './opentype/shapers/HangulShaper.js';
import { HebrewShaper } from './opentype/shapers/HebrewShaper.js';
import { MyanmarShaper } from './opentype/shapers/MyanmarShaper.js';
import { ThaiShaper } from './opentype/shapers/ThaiShaper.js';

// Register font formats
registerFormat(TTFFont);
registerFormat(WOFFFont);
registerFormat(WOFF2Font);
registerFormat(TrueTypeCollection);
registerFormat(DFont);

// Register all specialized shapers
registerShaper(UniversalShaper);
registerShaper(ArabicShaper);
registerShaper(IndicShaper);
registerShaper(HangulShaper);
registerShaper(HebrewShaper);
registerShaper(MyanmarShaper);
registerShaper(ThaiShaper);

export * from './core.js';
