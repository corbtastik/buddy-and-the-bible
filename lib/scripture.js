/* Scripture reference parsing, shared by the build-time linker in
 * eleventy.config.js and the scripture index in src/_data/scriptureIndex.js.
 *
 * Both need to agree on exactly which strings count as a reference and how
 * they normalise, or the index would list verses the pages do not link, and
 * the other way round. Keeping it in one place is the point of this file. */

// Canonical order, Genesis to Revelation. Drives the ordering of the index.
export const BOOK_ORDER = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua",
  "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
  "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
  "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah",
  "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai",
  "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus",
  "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation",
];

/* Short labels for the book grid squares, at most four characters so they
 * fit one line at the size the squares come out.
 *
 * Deliberately NOT derived from ALIASES below: those exist to parse what he
 * wrote, so they are inconsistent by design -- Psalms carries three of them
 * and Ruth none. These are display text and want the opposite, one obvious
 * form per book. The throw keeps the two lists in step: BOOK_ORDER is the
 * source of truth and every book in it has to have a label. */
const ABBR = {
  Genesis: "Gen", Exodus: "Ex", Leviticus: "Lev", Numbers: "Num",
  Deuteronomy: "Deut", Joshua: "Josh", Judges: "Judg", Ruth: "Ruth",
  "1 Samuel": "1Sa", "2 Samuel": "2Sa", "1 Kings": "1Ki", "2 Kings": "2Ki",
  "1 Chronicles": "1Ch", "2 Chronicles": "2Ch", Ezra: "Ezra",
  Nehemiah: "Neh", Esther: "Est", Job: "Job", Psalms: "Ps", Proverbs: "Prov",
  Ecclesiastes: "Eccl", "Song of Solomon": "Song", Isaiah: "Isa",
  Jeremiah: "Jer", Lamentations: "Lam", Ezekiel: "Ezek", Daniel: "Dan",
  Hosea: "Hos", Joel: "Joel", Amos: "Amos", Obadiah: "Obad", Jonah: "Jon",
  Micah: "Mic", Nahum: "Nah", Habakkuk: "Hab", Zephaniah: "Zeph",
  Haggai: "Hag", Zechariah: "Zech", Malachi: "Mal",
  Matthew: "Matt", Mark: "Mark", Luke: "Luke", John: "John", Acts: "Acts",
  Romans: "Rom", "1 Corinthians": "1Co", "2 Corinthians": "2Co",
  Galatians: "Gal", Ephesians: "Eph", Philippians: "Phil", Colossians: "Col",
  "1 Thessalonians": "1Th", "2 Thessalonians": "2Th", "1 Timothy": "1Ti",
  "2 Timothy": "2Ti", Titus: "Tit", Philemon: "Phlm", Hebrews: "Heb",
  James: "Jas", "1 Peter": "1Pe", "2 Peter": "2Pe", "1 John": "1Jn",
  "2 John": "2Jn", "3 John": "3Jn", Jude: "Jude", Revelation: "Rev",
};

export const abbrFor = (book) => {
  const a = ABBR[book];
  if (!a) throw new Error(`No grid abbreviation for "${book}"`);
  return a;
};

// Fails the build on a book with no label, rather than on the one page view
// that happens to reach it.
for (const book of BOOK_ORDER) abbrFor(book);

/* The traditional divisions, as the rows of the book grid on /scripture/.
 *
 * Declared as sizes rather than lists of books, and sliced straight out of
 * BOOK_ORDER below, so a division cannot name a book that is not there,
 * repeat one, or fall out of canonical order -- the grid and the index are
 * reading the same array. The throw catches the one mistake this shape still
 * allows: sizes that do not add up to 66.
 *
 * The widest row is Prophets at 17, which is what makes the grid fit the
 * 408px column without scrolling -- the same reasoning as the activity
 * graph's months-as-rows, where the bound is 31. Any regrouping has to keep
 * that ceiling low. */
const DIVISION_SIZES = [
  ["Law", 5],         // Genesis -- Deuteronomy
  ["History", 12],    // Joshua -- Esther
  ["Poetry", 5],      // Job -- Song of Solomon
  ["Prophets", 17],   // Isaiah -- Malachi
  ["Gospels", 5],     // Matthew -- Acts
  ["Paul", 13],       // Romans -- Philemon
  ["Letters", 8],     // Hebrews -- Jude
  ["Revelation", 1],  // Revelation
];

export const DIVISIONS = (() => {
  const total = DIVISION_SIZES.reduce((n, [, size]) => n + size, 0);
  if (total !== BOOK_ORDER.length) {
    throw new Error(
      `DIVISION_SIZES covers ${total} books, BOOK_ORDER has ${BOOK_ORDER.length}`
    );
  }
  let at = 0;
  return DIVISION_SIZES.map(([name, size]) => ({
    name,
    books: BOOK_ORDER.slice(at, (at += size)),
  }));
})();

// The widest division, which the grid uses as its column count.
export const DIVISION_MAX = Math.max(...DIVISIONS.map((d) => d.books.length));

/* Anchor ids for the per-book sections on /scripture/, and the grid squares
 * that jump to them. "1 Corinthians" -> "book-1-corinthians". */
export const bookSlug = (book) =>
  "book-" + book.toLowerCase().replace(/\s+/g, "-");

const ALIASES = {
  Genesis: ["Gen"], Exodus: ["Ex", "Exod"], Leviticus: ["Lev"],
  Numbers: ["Num"], Deuteronomy: ["Deut"], Joshua: ["Josh"], Judges: ["Judg"],
  "1 Samuel": ["1Sam"], "2 Samuel": ["2Sam"], "1 Kings": ["1Kgs"],
  "2 Kings": ["2Kgs"], "1 Chronicles": ["1Chr"], "2 Chronicles": ["2Chr"],
  Nehemiah: ["Neh"], Esther: ["Esth"], Psalms: ["Psalm", "Psa", "Ps"],
  Proverbs: ["Prov"], Ecclesiastes: ["Eccl", "Eccles"], Isaiah: ["Isa"],
  Jeremiah: ["Jer"], Ezekiel: ["Ezek"], Daniel: ["Dan"], Hosea: ["Hos"],
  Micah: ["Mic"], Habakkuk: ["Hab"], Zechariah: ["Zech"], Malachi: ["Mal"],
  Matthew: ["Matt", "Mt"], Mark: ["Mk"], Luke: ["Lk"], John: ["Jn"],
  Romans: ["Rom"], "1 Corinthians": ["1Cor"], "2 Corinthians": ["2Cor"],
  Galatians: ["Gal"], Ephesians: ["Eph"], Philippians: ["Phil"],
  Colossians: ["Col"], "1 Thessalonians": ["1Thess"],
  "2 Thessalonians": ["2Thess"], "1 Timothy": ["1Tim"], "2 Timothy": ["2Tim"],
  Philemon: ["Phlm"], Hebrews: ["Heb"], James: ["Jas"], "1 Peter": ["1Pet"],
  "2 Peter": ["2Pet"], "1 John": ["1Jn"], "2 John": ["2Jn"], "3 John": ["3Jn"],
  Revelation: ["Rev"],
};

const key = (s) => s.toLowerCase().replace(/[\s.]/g, "");

const BOOKS = {};
for (const book of BOOK_ORDER) BOOKS[key(book)] = book;
for (const [book, list] of Object.entries(ALIASES)) {
  for (const alias of list) BOOKS[key(alias)] = book;
}

/* Book, then chapter:verse, optionally a range, optionally his "ff" or a
 * trailing verse letter. A bare "Peter 1:6-7" carries no book number and so
 * has no entry here: it stays plain text rather than guessing between 1 and
 * 2 Peter and inventing a citation he never made. */
export const REF_SOURCE =
  "\\b((?:[1-3]\\s*)?[A-Z][a-z]+\\.?)\\s*(\\d{1,3}):(\\d{1,3})" +
  "(?:\\s*[-–]\\s*(\\d{1,3}))?(?:ff\\b|[ab]\\b)?";

export const newRefRegex = () => new RegExp(REF_SOURCE, "g");

// Returns the canonical book for whatever form he wrote, or null to skip.
export const bookFor = (raw) => BOOKS[key(raw)] || null;

export const passageOf = (book, ch, v1, v2) =>
  `${book} ${ch}:${v1}${v2 ? "-" + v2 : ""}`;

/* NKJV: the translation he quotes. ESV and NIV word these differently
 * enough that clicking through would not match the bubble. */
export const bibleGatewayUrl = (book, ch, v1, v2, amp = "&amp;") =>
  "https://www.biblegateway.com/passage/?search=" +
  encodeURIComponent(passageOf(book, ch, v1, v2)) +
  amp +
  "version=NKJV";

// Every reference in a chunk of text, de-duplicated, in order of appearance.
export function findRefs(text) {
  const out = [];
  const seen = new Set();
  const re = newRefRegex();
  let m;
  while ((m = re.exec(text)) !== null) {
    const book = bookFor(m[1]);
    if (!book) continue;
    const ch = Number(m[2]);
    const v1 = Number(m[3]);
    const v2 = m[4] ? Number(m[4]) : null;
    const id = `${book}|${ch}|${v1}|${v2 ?? ""}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ book, chapter: ch, verse: v1, verseEnd: v2, id });
  }
  return out;
}
