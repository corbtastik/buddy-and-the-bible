# Morning Devo

A static site for Buddy Payne's morning devotionals, built with
[Eleventy](https://www.11ty.dev/). Each devo is rendered as an iOS Messages
thread — the way they actually arrive.

The design is a port of the Claude artifact at
<https://claude.ai/artifact/D4u4Fw7qNXtypVck2Ceh4p>. The original single-page
export is kept in [`archive/`](archive/) as the reference for pixel details.

## Running it

```sh
npm install
npm start     # dev server with live reload at http://localhost:8080
npm run build # writes the static site to _site/
```

## Adding a devo

Copy [`docs/TEMPLATE.md`](docs/TEMPLATE.md) into `src/devos/` and name it
`YYYY-MM-DD-short-slug.md`. The date prefix is stripped from the URL, so
`2026-10-19-they-think-it-strange.md` publishes at
`/devos/they-think-it-strange/`.

Front matter:

| Field       | Required | Notes                                                     |
| ----------- | -------- | --------------------------------------------------------- |
| `title`     | yes      | Shown in the list and the page title                       |
| `date`      | yes      | `YYYY-MM-DD`; drives sort order and the thread timestamp   |
| `time`      | no       | Free text, e.g. `9:08 AM`, shown next to the date          |
| `author`    | no       | Defaults to `site.author`                                  |
| `scripture` | no       | Reference only; not rendered yet                           |
| `summary`   | no       | Used for the link preview when the page is texted or shared |

The body is Markdown. Blockquotes render as indented scripture blocks inside
the bubble. A `***` thematic break splits the devo into separate message
bubbles, the way a long text arrives as several messages in a row — only the
last bubble gets the tail and avatar.

## Layout

```
src/
  index.njk            conversation list (home)
  _data/site.json      title, author, description, url
  _includes/
    base.njk           <head>, meta and social tags
    devo.njk           the Messages thread
    theme-toggle.njk   the appearance button, used by both
  assets/css/app.css   all styles
  assets/js/search.js  list filtering, typed dates, sort, arrow keys
  assets/js/theme.js   the appearance toggle
  assets/img/          avatar and group-cluster images
  devos/
    devos.json         layout, tag and permalink for every devo
    *.md               one file per devo
docs/TEMPLATE.md       starting point for a new devo
references/            source screenshots, by month (see the log below)
archive/               the original design export
firebase.json          hosting config, pinned to the morning-devos site
```

## Searching the list

The home page filters client-side as you type. Dates go in the same box as the
text -- there is no date picker:

| Typed                      | Effect                                  |
| -------------------------- | --------------------------------------- |
| `humility`                 | devos containing the word               |
| `haman humility`           | devos containing *both* words           |
| `5/21/26`                  | that single day                         |
| `5/1/26 to 5/15/26`        | that range, inclusive                   |
| `love 5/1/26 to 5/15/26`   | text and range together                 |

`to`, `-`, `–`, `..` and `through` all work as range separators, as does
writing two dates side by side. A reversed range is read the same as a forward
one. A string that looks like a date but is not one (`2/31/26`) stays a plain
text term rather than silently filtering. The result line echoes the dates it
understood, so a mistyped filter is visible. The one button reverses the sort.

From the search box, Down jumps to the top match and Down/Up walk the
matches in the order shown (so it follows the sort); Up from the top match
returns to the box, Enter opens the devo, Escape clears the search.

Each row carries its searchable text in a `data-text` attribute, so the index
is the page itself -- no extra request, and the list still renders unfiltered
with JavaScript off. At 45 devos that index is about 64 KB of a 104 KB page;
past roughly 300 devos it would be worth moving it to a separate fetched
`search.json`.

## Light and dark

Follows the system appearance the way Messages does, and the icon in the
header pins either one. The choice is kept in `localStorage` and applied by a
small inline script in `<head>` before first paint; picking whatever the
system is already showing drops the override rather than pinning it, so the
page goes back to following the system.

Every colour is a token, defined on `:root` for light and repeated in two
dark blocks -- one under `@media (prefers-color-scheme: dark)` and one under
`:root[data-theme="dark"]`. Those two must stay identical. Forcing a theme
also sets `color-scheme`, without which the browser keeps painting native
controls and scrollbars for the system appearance.

## Typography

iOS Messages renders in SF Pro. On Apple devices `-apple-system` *is* SF Pro,
so the thread matches the original screenshots exactly with no download.
Apple's licence forbids web-embedding SF Pro, so other platforms fall back to
[Inter](https://rsms.me/inter/), which was drawn as an open stand-in for it,
loaded from Google Fonts.

Order matters in that stack: current Chrome normalises `BlinkMacSystemFont`
to `system-ui` on *every* platform, so it has to sit after `Inter` -- ahead of
it, Windows would get Segoe UI and Android would get Roboto. Drop the Google
Fonts `<link>` in `src/_includes/base.njk` if you would rather have no
external dependency; Apple devices are unaffected either way.

## Deploying

Live at <https://morning-devos.web.app>, a Firebase Hosting site inside the
`corbs-cloud` project. After adding devos:

```sh
npm run build && firebase deploy --only hosting
```

`firebase.json` pins the target to the `morning-devos` site -- that project
has several, so an unqualified deploy would be ambiguous. HTML revalidates on
every request, css/js cache for ten minutes, images for a year. The HTML rule
needs explicit `/` and `**/` sources: permalinks are directory-style, so
`**/*.html` never matches a real request path and the pages would otherwise
pick up Firebase's one-hour default.

`url` in `src/_data/site.json` is what enables the canonical, `og:url` and
`og:image` tags; they are omitted while it is blank, since link previews need
absolute URLs. `_site/` is a plain static directory, so Netlify, Cloudflare
Pages or GitHub Pages would work just as well.

## Where the devos came from

`references/` holds the original iMessage screenshots the devos were
transcribed from, kept as provenance so any transcription can be checked
against the source. One folder per month, named for the month it covers:
`references/apr-may-2026/`, `references/june-2026/`.

### Transcription log

**Every month added gets an entry below**, recording what was assumed, what
was changed, and what was deliberately left alone, so the batch can be
reviewed later against the screenshots. Use these headings in this order:

- *Assumptions* — anything inferred rather than read off the screenshots,
  most often the year, which they never show.
- *Coverage* — the date range and count, and any day with no screenshot.
- *Corrections applied* — every change to his text, however small.
- *Left as written — worth a look* — oddities reproduced rather than fixed,
  so you can decide. Cite the devo date for each.
- *Notes* — editorial calls that are not corrections: structure, slugs,
  nested quotations. Omit if there were none.

If a month needed no judgment calls at all, say so under the heading rather
than dropping it -- silence should never be ambiguous.

The standing policy: his wording, spelling, capitalisation and emphasis are
reproduced as written. Formatting (scripture into blockquotes, paragraph
breaks) is ours. Anything beyond that is a correction and belongs under
*Corrections* below, never applied silently.

---

#### April--May 2026 — 22 devos — `references/apr-may-2026/`

*Assumptions*

- **The year is not in the screenshots.** They show `Wed, Apr 29 at 6:37 AM`
  with no year. 2020 and 2026 fit the weekdays *identically* -- March through
  December align in both -- so the dates alone could not settle it. Confirmed
  as 2026 by the author.
- **`2026-10-19` (They Think It Strange)** came from the original artifact
  export rather than this batch. It showed only "Monday 9:08 AM"; iOS prints
  a bare weekday only within the past week, and the export file is dated
  2026-10-25, so the preceding Monday is 2026-10-19. An earlier guess of
  2025-10-20 was wrong and was corrected.

*Coverage*

- Weekdays only, Apr 29 -- May 29: 2 in April, 20 in May.
- **May 22 (Friday) has no screenshot** and so has no devo. Unknown whether
  none was sent or the screenshot is just missing.

*Corrections applied*

- Numbered-book references were spaced: `1Peter` → `1 Peter`,
  `2Timothy` → `2 Timothy`, and so on, across the batch.

*Left as written — worth a look*

- `Hebrews 5:8-9` reads "though He was a Son, ye] He learned" (2026-05-07).
- `1 Peter 5:5` reads "submit yourselves to you] elders" (2026-05-26).
- 2026-05-13 names "Mr. Mitchell" for George Wilson, the man in the story.
- 2026-05-21 has "neverhave" run together.
- 2026-05-06 has "study to help ourselves grown".
- 2026-05-01 has "the same kind of action's in the church".
- 2026-05-12 ends "(Thanks Brad)", kept as his attribution.

---

#### June 2026 — 22 devos — `references/june-2026/`

*Assumptions*

- **Filename order is weekday order.** `Untitled.jpg` is Jun 1 and
  `Untitled 2`--`22` follow in sequence. Verified rather than trusted: every
  file's weekday *and* send time was checked back against the header line of
  its own screenshot, and all 22 matched.
- **The year is again absent** from the screenshots; taken as 2026 from the
  folder name, and consistent with all 22 weekdays.

*Coverage*

- Complete: all 22 weekdays of June 2026, Jun 1 -- Jun 30, no gaps.

*Corrections applied*

- Three stray characters removed from quoted scripture, where they looked
  like copy artifacts rather than anything he wrote: a `3` in John 3:15-16
  and a `1` in 1 John 5:3-4 (2026-06-15), and a `*` in 1 Thessalonians
  1:6-10 (2026-06-22).
- Numbered-book references spaced, as above.

*Left as written — worth a look*

- **2026-06-12 cites `Hebrews 12:15-16` for text that is actually Hebrews
  13:15-16.** The most substantive of these.
- 2026-06-18: "God is has appalled", and "had wondered away" for *wandered*.
- 2026-06-22: "the Lord's las message", and the song titled "The Worlds
  Bible".
- 2026-06-23: "ore the dictates" for *or*, and "the sate of facts" for
  *state*, both inside the John Adams quotation.
- 2026-06-17: the "Someone wrote," quotation is never closed in the source.

*Notes*

- 2026-06-25 opens with prose rather than scripture -- the only one in the
  batch that does -- and is left that way.
- 2026-06-15 nests a story written by his son Brad; it is set as its own
  quote so the two voices stay distinct.
- 2026-06-30 uses Matthew 7:13-14 again, which 2026-05-08 already took as
  `the-narrow-gate`, so it is slugged `the-one-choice`.

## Known gaps

- There is no search-engine-facing index, tag page or scripture index yet.
- The `scripture` front-matter field is captured but not displayed.
