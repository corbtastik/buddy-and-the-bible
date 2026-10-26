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
