export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("src/assets");

  // Curly quotes and proper dashes, so pasted-in text reads like the original
  // message rather than like typewriter output.
  eleventyConfig.amendLibrary("md", (md) =>
    md.set({ html: true, linkify: true, typographer: true })
  );

  // Devos, newest first.
  eleventyConfig.addCollection("devos", (collection) =>
    collection.getFilteredByGlob("src/devos/*.md").sort((a, b) => b.date - a.date)
  );

  // Dates come from front matter as plain YYYY-MM-DD, so format in UTC to
  // avoid the local timezone pulling a devo back onto the previous day.
  const fmt = (date, opts) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(date);

  eleventyConfig.addFilter("weekday", (d) => fmt(d, { weekday: "long" }));
  eleventyConfig.addFilter("longDate", (d) =>
    fmt(d, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  );
  eleventyConfig.addFilter("shortDate", (d) =>
    fmt(d, { month: "numeric", day: "numeric", year: "2-digit" })
  );
  eleventyConfig.addFilter("isoDate", (d) => d.toISOString().slice(0, 10));

  // A long devo arrives as several texts in a row. Authors split them with a
  // `***` thematic break; each chunk becomes its own bubble.
  eleventyConfig.addFilter("bubbles", (html) =>
    String(html)
      .split(/<hr\s*\/?>/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
  );

  // Strip markup down to plain text.
  const plain = (html) =>
    String(html)
      .replace(/<[^>]+>/g, " ")
      .replace(/&#8203;|&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

  // Plain-text preview for the conversation list.
  eleventyConfig.addFilter("preview", (html, max = 140) => {
    const text = plain(html);
    return text.length > max ? text.slice(0, max).trimEnd() + "\u2026" : text;
  });

  // Everything the client-side search matches against, lowercased once at
  // build time so filtering never has to case-fold every devo per keystroke.
  eleventyConfig.addFilter("searchText", (...parts) =>
    plain(parts.filter(Boolean).join(" ")).toLowerCase()
  );


  /* ---------- external links and scripture references ----------
   *
   * Two passes over the rendered devo pages, both operating only on text
   * that sits outside an existing <a>, <script> or <style>:
   *
   *   1. turn scripture references into BibleGateway links (NKJV, which is
   *      the translation he quotes), and
   *   2. give every external link target=_blank and rel=noopener.
   *
   * Doing this at build time rather than in the Markdown keeps his files
   * plain text, so the next month's devos get linked without extra work. */

  const BOOKS = {};
  const addBook = (canonical, ...aliases) => {
    [canonical, ...aliases].forEach((a) => {
      BOOKS[a.toLowerCase().replace(/[\s.]/g, "")] = canonical;
    });
  };
  // Only books that actually appear, plus the abbreviations he uses.
  addBook("Genesis", "Gen");            addBook("Exodus", "Ex", "Exod");
  addBook("Leviticus", "Lev");          addBook("Numbers", "Num");
  addBook("Deuteronomy", "Deut");       addBook("Joshua", "Josh");
  addBook("Judges", "Judg");            addBook("Ruth");
  addBook("1 Samuel", "1Sam");          addBook("2 Samuel", "2Sam");
  addBook("1 Kings", "1Kgs");           addBook("2 Kings", "2Kgs");
  addBook("1 Chronicles", "1Chr");      addBook("2 Chronicles", "2Chr");
  addBook("Ezra");                      addBook("Nehemiah", "Neh");
  addBook("Esther", "Esth");            addBook("Job");
  addBook("Psalms", "Psalm", "Psa", "Ps");
  addBook("Proverbs", "Prov");          addBook("Ecclesiastes", "Eccl", "Eccles");
  addBook("Isaiah", "Isa");             addBook("Jeremiah", "Jer");
  addBook("Ezekiel", "Ezek");           addBook("Daniel", "Dan");
  addBook("Hosea", "Hos");              addBook("Joel");
  addBook("Amos");                      addBook("Jonah");
  addBook("Micah", "Mic");              addBook("Habakkuk", "Hab");
  addBook("Zechariah", "Zech");         addBook("Malachi", "Mal");
  addBook("Matthew", "Matt", "Mt");     addBook("Mark", "Mk");
  addBook("Luke", "Lk");                addBook("John", "Jn");
  addBook("Acts");                      addBook("Romans", "Rom");
  addBook("1 Corinthians", "1Cor");     addBook("2 Corinthians", "2Cor");
  addBook("Galatians", "Gal");          addBook("Ephesians", "Eph");
  addBook("Philippians", "Phil");       addBook("Colossians", "Col");
  addBook("1 Thessalonians", "1Thess"); addBook("2 Thessalonians", "2Thess");
  addBook("1 Timothy", "1Tim");         addBook("2 Timothy", "2Tim");
  addBook("Titus");                     addBook("Philemon", "Phlm");
  addBook("Hebrews", "Heb");            addBook("James", "Jas");
  addBook("1 Peter", "1Pet");           addBook("2 Peter", "2Pet");
  addBook("1 John", "1Jn");             addBook("2 John", "2Jn");
  addBook("3 John", "3Jn");             addBook("Jude");
  addBook("Revelation", "Rev");

  // Book, then chapter:verse, optionally a range, optionally his "ff" or a
  // verse letter. A bare "Peter 1:6-7" has no book number and so no entry in
  // BOOKS -- it stays plain text rather than guessing between 1 and 2 Peter.
  const REF = new RegExp(
    "\\b((?:[1-3]\\s*)?[A-Z][a-z]+\\.?)\\s*(\\d{1,3}):(\\d{1,3})" +
      "(?:\\s*[-\u2013]\\s*(\\d{1,3}))?(?:ff\\b|[ab]\\b)?",
    "g"
  );

  const bgUrl = (book, ch, v1, v2) => {
    const passage = `${book} ${ch}:${v1}${v2 ? "-" + v2 : ""}`;
    return (
      "https://www.biblegateway.com/passage/?search=" +
      encodeURIComponent(passage) +
      "&amp;version=NKJV"
    );
  };

  function linkRefsInText(text) {
    return text.replace(REF, (whole, rawBook, ch, v1, v2) => {
      const key = rawBook.toLowerCase().replace(/[\s.]/g, "");
      const book = BOOKS[key];
      if (!book) return whole; // unknown book: leave his text alone
      return `<a href="${bgUrl(book, ch, v1, v2)}">${whole}</a>`;
    });
  }

  // Walk the markup, skipping anything already inside a link, a script or a
  // style, so references are never linked twice or rewritten inside code.
  function onTextNodes(html, fn) {
    let depth = 0;
    return html
      .split(/(<[^>]+>)/)
      .map((part) => {
        if (part.startsWith("<")) {
          if (/^<(a|script|style)\b/i.test(part)) depth++;
          else if (/^<\/(a|script|style)>/i.test(part)) depth = Math.max(0, depth - 1);
          return part;
        }
        return depth ? part : fn(part);
      })
      .join("");
  }

  eleventyConfig.addTransform("scriptureLinks", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    if (!(this.page.url || "").startsWith("/devos/")) return content;
    return onTextNodes(content, linkRefsInText);
  });

  // Every link that leaves the site opens in a new tab. Runs after the pass
  // above so the BibleGateway links it created are covered too.
  eleventyConfig.addTransform("externalLinks", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    return content.replace(/<a\s+href="(https?:\/\/[^"]*)"([^>]*)>/g, (m, href, rest) => {
      if (/target=/.test(rest)) return m;
      return `<a href="${href}"${rest} target="_blank" rel="noopener">`;
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
