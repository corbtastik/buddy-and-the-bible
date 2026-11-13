# Morning Devo

A static site for Buddy Payne's morning devotionals, built with
[Eleventy](https://www.11ty.dev/). Each devo is rendered as an iOS Messages
thread — the way they actually arrive.

The design is a port of the Claude artifact at
<https://claude.ai/artifact/D4u4Fw7qNXtypVck2Ceh4p>. The original single-page
export is kept in [`archive/`](../archive/) as the reference for pixel details.

## Running it

```sh
npm install
npm start     # dev server with live reload at http://localhost:8080
npm run build # writes the static site to _site/
```

## Adding a devo

Copy [`docs/TEMPLATE.md`](TEMPLATE.md) into `src/devos/` and name it
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
  scripture.njk        the scripture index at /scripture/
  _data/scriptureIndex.js  builds that index from the devo Markdown
  _data/activity.js    builds the calendar grid for the activity graph
  _data/site.json      title, author, description, url
  _includes/
    base.njk           <head>, meta and social tags
    devo.njk           the Messages thread
    theme-toggle.njk   the appearance button, used by both
    to-top.njk         the back-to-top button, home and scripture index
  assets/css/app.css   all styles
  assets/js/search.js  list filtering, typed dates, sort, arrow keys
  assets/js/theme.js   the appearance toggle
  assets/js/to-top.js  the back-to-top button on both long pages
  assets/img/          avatar and group-cluster images
  devos/
    devos.json         layout, tag and permalink for every devo
    *.md               one file per devo
lib/scripture.js       book order, grid labels and reference parsing,
                       shared by the linker, the index and the book grid
docs/TEMPLATE.md       starting point for a new devo
docs/DOCS.md           this file
references/            source screenshots, by month (see the log below)
archive/               the original design export
firebase.json          hosting config, pinned to the buddy-and-the-bible site
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

## Activity graph

The home page opens with a calendar of the days he sent a devo: a row per
month, a column per day of the month. Selecting a day clears any active
filter and scrolls the list to that day, flashing the row so the eye lands
in the right place. Empty days are not interactive, and every day he sent
one is the same blue whatever the count -- the date and count are in each
square's tooltip and accessible name.

The first version copied GitHub's layout, a column per week across the
year. That shape assumes a wide page: 43 columns did not fit this site's
408px list column, so it needed horizontal scrolling and pinned day labels.
Months-as-rows is at most 31 columns, so `grid-template-columns:
repeat(31, 1fr)` makes it fit by construction at any width.

A back-to-top button appears bottom right once the page is scrolled past
320px, on the home page and on the scripture index -- the two long scrolling
pages.

It lives in `src/_includes/to-top.njk` with its own `to-top.js`, rather than
in `search.js` where it started. That script returns early when the devo
list is not on the page, so moving the markup to the scripture index without
moving the behaviour would have shipped a button that did nothing. The
include takes a `toTopFocus` variable naming an element to put the caret
back in after the scroll: the home page passes its search box, and the
scripture index passes nothing and simply scrolls.

## Scripture

Every reference on a devo page links to that passage on BibleGateway in
NKJV, the translation he quotes. Nothing is marked up by hand: a build-time
transform in `eleventy.config.js` finds references in the rendered HTML,
skipping anything already inside a link, a script or a style. A second
transform gives every off-site link `target="_blank"` and `rel="noopener"`.

His text is never changed. Where his wording and the URL have to differ the
link text keeps what he wrote and only the URL is normalised -- `Lk.` to
Luke, `Psalm` to Psalms, and his `ff` or trailing verse letters dropped,
since BibleGateway cannot parse them.

Two kinds of reference are deliberately left as plain text rather than
guessed at: `Peter 1:6-7` on 2026-07-07, which is missing its book number,
and `Psalms 119: (18)`, whose shape is too irregular to parse.

`/scripture/` lists all 369 references in canonical order, Genesis to
Revelation, each linking to the devo that quotes it -- or to each of them,
for the 40 verses cited more than once. It is linked from the home page
only. The page is built by `src/_data/scriptureIndex.js`, which reads the
Markdown directly rather than going through collections so it does not
depend on every devo having rendered first.

Both the linker and the index import their parsing rules from
`lib/scripture.js`. That is the whole reason the file exists: if they
drifted, the index would list verses the pages do not link, or the reverse.

### The book grid

The page opens with the scripture counterpart of the home page's activity
graph: one square per book of the Bible, in canonical order, Genesis to
Revelation. Selecting a book jumps to its section further down the page.

**All 66 books are drawn, not just the 42 he has cited.** The empties are
the point, exactly as they are in the calendar -- which books he returns to
and which he has never quoted is only legible if the unquoted ones take up
space. A cited book is a link; an uncited one is an inert square with its
name and "none" in the tooltip.

Each square carries the book's short label -- `Gen`, `1Th`, `Zeph` -- so
the grid reads as a list of books rather than as a heat map, and the colour
is doing one job only: saying whether he has ever cited that book.

It borrows the calendar's `--day-on` / `--day-off` fills so the two graphs
mean the same thing in the same visual language. The one token it adds is
`--day-on-text`, the label colour on a filled square; like every other
colour it is declared in `:root` and in both dark blocks, which is what
`assertDarkThemesMatch()` checks.

**The squares size themselves to their text, and the rows wrap.** This is
the one place the grid cannot copy the calendar. Cutting the column into a
fixed number of tracks is what makes the calendar fit, but 17 across would
leave about 18px to print "Zeph" in. `auto-fill` with a 38px floor inverts
the two: the square is first made big enough to read, and the number of
columns is whatever then fits -- nine, in a 408px column, so the 66 run to
eight rows.

**It is one flat grid, not a group per division of the Bible.** It began as
the latter, a labelled row each for Law, History, Poetry, Prophets, Gospels,
Paul, Letters and Revelation. That put a wider gap between the groups than
between the squares inside them, and the grid reads better as one even
field. Nothing about the arrangement was lost: canonical order already keeps
each division's books adjacent, so the grouping was only ever contributing
the labels and the gaps. Dropping it also took the grid from roughly 560px
tall to 365.

**The squares are anchor links, not buttons, and the grid is never hidden.**
The activity graph has to start `hidden` because its buttons do nothing
until `search.js` runs. Here the whole interaction is jumping to a section
of the same page, which the browser does natively, so there is no script at
all and the grid works with JavaScript off. The flash that marks where you
landed is `.book:target`, triggered by the hash change the anchor already
causes -- the CSS counterpart of the calendar's JS `.row-jumped`.

The labels live in `lib/scripture.js` beside `BOOK_ORDER`, and are
deliberately **not** derived from the parsing aliases in the same file.
Those exist to recognise what he wrote, so they are uneven by design --
Psalms carries three of them and Ruth none. Display text wants the opposite,
one obvious form per book, capped at four characters so it fits on one line.
The module throws on import if any book in `BOOK_ORDER` has no label, so a
book added without one fails the build rather than the page.

## Light and dark

Follows the system appearance the way Messages does, and the icon in the
header pins either one. The choice is kept in `localStorage` and applied by a
small inline script in `<head>` before first paint; picking whatever the
system is already showing drops the override rather than pinning it, so the
page goes back to following the system.

Every colour is a token, defined on `:root` for light and repeated in two
dark blocks -- one under `@media (prefers-color-scheme: dark)` and one under
`:root[data-theme="dark"]`. `assertDarkThemesMatch()` in
`eleventy.config.js` fails the build when they fall out of step, naming the
offending tokens. It checks two things, because both have already happened
while building the activity graph:

- the two dark blocks must match each other -- the graph's colours once
  landed in the media query only, so forcing dark through the toggle showed
  light-mode squares on black;
- they must declare the same token *names* as `:root` -- renaming a token in
  `:root` while both dark blocks kept the old name left them agreeing with
  each other and silently falling back to the light value.

Neither failed visibly, which is the reason the check exists. Keep all light
tokens in the single `:root` block; a second one would hide from the check. Forcing a theme
also sets `color-scheme`, without which the browser keeps painting native
controls and scrollbars for the system appearance.

## Global data and front matter

A file in `src/_data/` is exposed to every template under its own basename,
so `src/_data/foo.js` owns the name `foo`. If a devo also has `foo:` in its
front matter the two collide and the global object wins: the front-matter
value is gone, and nothing is logged.

That is why the scripture index lives in `scriptureIndex.js` rather than the
more obvious `scripture.js`. Under the obvious name it shadowed the
`scripture:` field on all 204 devos from the day the index was added. The
only trace was the literal string `[object Object]` sitting in every row's
search index, and the four devos whose front matter spells a book out in
full while the bubble abbreviates it -- `Hebrews 12:28-29` against
`Heb. 12:28` -- could not be found by the full name.

`assertNoDataKeyCollisions()` in `eleventy.config.js` now fails the build on
any such collision, naming the key, the data file and how many devos use it.
Rename the data file when it fires: a front-matter key is spread across
every devo, and the data file is one line.

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

### Dashes and quotes

Devo bodies go through markdown-it with `typographer` on, so `--` becomes an
en dash and straight quotes curl. Write them the typewriter way in the
Markdown and let the build do it.

`summary` does not get that, because front matter never goes through
markdown-it. It reached the conversation list and the `<meta>` description
exactly as typed, so 19 summaries read "children -- His word" while the
bubble beside them read "children – His word" -- and the same text is the
link preview when a devo is texted to someone, which is the one place it
really showed.

The `smart` filter applies the same substitutions by hand, and is used at
both places a summary surfaces: `src/index.njk` for the list row and
`src/_includes/base.njk` for the description and `og:description`. It is
idempotent, so the 18 summaries already written with real punctuation are
untouched.

**The search index deliberately does not get it.** `searchText` indexes the
raw summary, because the index is matched against what someone types and a
keyboard types straight quotes. Curling the summaries would make 44 of them
harder to find rather than easier.

That exposes an older gap worth knowing about: `src/assets/js/search.js`
folds case but not punctuation, and the body text in the index is already
curly. So typing `god's` matches nothing while `god’s` with a real
apostrophe matches 77 devos. Folding both to the same form in `searchText`
and in `search.js` would fix it; nothing does today.

## Deploying

Live at <https://buddy-and-the-bible.web.app>, a Firebase Hosting site inside
the `corbs-cloud` project. After adding devos:

```sh
npm run deploy    # builds, then deploys hosting
```

That is `npm run build && firebase deploy --only hosting` in one script, so the
build can't be skipped by accident -- deploying stale `_site/` is the one
mistake this command exists to prevent. `npm run preview` does the same thing
to a `preview` channel instead, which gets a temporary URL and leaves the live
site alone.

Two separate things pin what gets deployed where. `firebase.json` pins the
*site* to `buddy-and-the-bible` -- that project has several, so an unqualified
deploy would be ambiguous. `.firebaserc` pins the *project* to `corbs-cloud`.

`.firebaserc` is committed on purpose. Without it the Firebase CLI falls back
to the active project in its own global config at
`~/.config/configstore/firebase-tools.json`, which is keyed by absolute
directory path -- so it is per-machine, and it does not survive renaming the
directory or cloning the repo somewhere else. It did not survive this repo's
own rename: deploys ran for months out of `.../corbtastik/morning-devos`, and
the first deploy after the directory became `buddy-and-the-bible` failed with
"No currently active project" because that path had no entry. The committed
file makes the command above work from any checkout with no `--project` flag.

HTML revalidates on every request, css/js cache for ten minutes, images for a
year, all set in `firebase.json`. The HTML rule needs explicit `/` and `**/`
sources: permalinks are directory-style, so `**/*.html` never matches a real
request path and the pages would otherwise pick up Firebase's one-hour
default.

An earlier deploy lived at `morning-devos.web.app`. That site still exists
and still serves the last build made under the old name; it is being
retired by hand. Nothing in this repo points at it any more.

`url` in `src/_data/site.json` is what enables the canonical, `og:url` and
`og:image` tags; they are omitted while it is blank, since link previews need
absolute URLs. `_site/` is a plain static directory, so Netlify, Cloudflare
Pages or GitHub Pages would work just as well.

## Where the devos came from

`references/` holds what the devos were transcribed from, kept as provenance
so any transcription can be checked against the source. It is gitignored, so
none of it is committed.

There are two kinds of source in there. Most devos came from an iMessage
screenshot, and those live in one folder per month, named for the month it
covers: `references/jan-2026/`, `references/feb-2026/`,
`references/mar-2026/`, `references/apr-may-2026/`, `references/june-2026/`,
`references/july-2026/`, `references/august-2026/`, `references/sept-2026/`,
`references/oct-2026/`. One folder is not a month: `references/misc-2026/`
holds messages from other threads. There is no `references/nov-2026/` yet,
because November's four devos were hand-entered rather than captured.

The rest were typed or pasted in by hand, and they all live in one file --
`references/manual-devos.md`, described next.

He does not send a devo every weekday, so gaps in a month are normal. Each
entry below lists the days with none, so a gap is visibly accounted for
rather than looking like a transcription that got dropped.

Nor are they always sent in the morning. `time` records whatever the
screenshot says, afternoon included, so an odd hour is the source speaking
and not a typo.

### Hand-entered devos

`references/manual-devos.md` is the intake file for devos that arrive as text
rather than as a screenshot -- Messages collapses his longest posts, so those
get pasted in instead of captured. **One file for every year and month**;
entries are keyed by date, so they can be added in any order and a new month
needs no new file. The file carries its own instructions at the top.

One entry per devo, a `## YYYY-MM-DD` heading below the `## Entries` line:

```
## 2026-11-03

- time: 6:43 AM
- source: manual
- header: Tue, Nov 3rd 6:43 AM
- complete: yes
- tapbacks:
- note:

His message, pasted from the first line to the last.
```

The body runs to the next `## ` heading, so there is no closing delimiter.
`***` on its own line splits one message into separate bubbles, the same
marker the devo pages use. Only the date and `time` are needed; the rest are
optional, and each of them exists because of a judgment call this archive
actually had to make:

| Field      | Why it is there                                                  |
| ---------- | ---------------------------------------------------------------- |
| `## date`  | His headers never show the year, and twice the weekday and date in a header have disagreed. An ISO date ends the guessing |
| `header`   | The literal Messages header, so a disagreement with `date` can be *caught* rather than silently resolved -- see 2026-10-30 |
| `complete` | `yes`/`no`/`unsure`. Three of the four hospital-bed devos end where the paste looks to have given out; this says whether that is really the end |
| `tapbacks` | Recorded, not rendered -- the standing choice across the archive |
| `note`     | Free text, read every time. The override for anything else here  |
| `posted`   | Written back after publishing: the slug it became               |

An entry with no matching `src/devos/YYYY-MM-DD-*.md` is one that has not
been published yet; nothing else marks an entry as new.

The eight entries for Oct 8 -- Nov 3 2026 were migrated in from
`references/oct-2026/oct.txt`, the per-month text file this replaced, which
is now retired. Entries below that cite `oct.txt` are describing that same
pasted text; the headers and bodies carried over verbatim.

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

**His own remarks stay in.** Asides, credits, apologies and sign-offs are
part of the message he sent, not stray text to tidy away, and they are
often the most personal thing in a devo. Keep them where he put them.
Examples already in the archive:

- `I apologize for the late posting. b.` opening 2026-08-31
- `(Thanks Brad)` closing 2026-05-12, and `(copied)` on 2026-04-30,
  2026-07-17 and 2026-08-20, marking what he quoted from elsewhere
- `BTW it's an open book test.` ending 2026-08-06
- Named sources: `Brother Matt shared this quote with me` (2026-06-23),
  `Joy once told me a story of her grandmother` (2026-07-31),
  `Someone told me that this wasn't very comforting` (2026-08-10)
- Whole passages written by someone else, set as a quotation with the
  attribution he gave: his son Brad's story on 2026-06-15

---

#### January 2026 — 21 devos — `references/jan-2026/`

The earliest month in the archive, and the first to need two bubbles on one
page.

*Assumptions*

- **Filename order is weekday order**, checked as always against each
  header. It breaks twice: Jan 21 has no devo, and `Untitled 17.jpg` is a
  second message rather than a new day.
- **The year is absent** from the screenshots; taken as 2026 from the folder
  name and consistent with all 21 weekdays.

*Coverage*

- Jan 1 -- Jan 30. January 2026 has 22 weekdays and 21 have a devo.
- **No devo on Jan 21 (Wed).**

*Corrections applied*

- **Lost spaces restored.** Two devos came through with words run together
  throughout -- 2026-01-06 ("Throughout theBible there arenumerous
  accountswhere men chose todo things their ownway") and 2026-01-12 ("Life
  is aboutdecisions. Some ofthem are insignificant,like what we're goingto
  eat"). This is the capture dropping spaces, not his typing, and leaving it
  would make both unreadable, so the spaces are restored. Scattered single
  instances elsewhere in the month were restored the same way.
  **This is a change of practice.** Four isolated cases in earlier months
  were left as written and are still listed under their own entries
  ("Sunday eveningand", "criticismcan", "BUSreligion", "neverhave"). Say
  the word and they will be normalised to match.
- One stray verse number `14` removed from the Daniel 2:44 quotation on
  2026-01-08, the same copy artifact seen in June and October.
- 2026-01-02 arrived hard-wrapped mid-sentence; reflowed into paragraphs.
- Numbered-book references spaced, as in earlier batches.

*Left as written — worth a look*

- 2026-01-09 names the tract "Robert Turner's I've Ben Baptized" (*Been*).
- 2026-01-01 has "Any yet, the challenge" (*And*).
- 2026-01-26 has "an survivor of the D-day assault" and "many veteran's
  whose lives".
- 2026-01-28 has "our brothers of sisters" (*or*), "When in worship are
  doing your best" (*are you*), and "are your entertained" (*you*).
- 2026-01-16 ends the Earl Pitts quote "wake up Umerica!" -- that one is
  the radio character's catchphrase, not an error.

*Notes*

- **2026-01-23 holds two messages.** `Untitled 16.jpg` is the devo at
  6:58 AM; `Untitled 17.jpg` has no date header and no sender label, so it
  is a second message in the same group -- Psalms 147 and a poem, "When
  Winter Meets His Word", signed "From Uncle Dickie". Both are on the one
  page, split with `***` so they render as two bubbles with a single tail
  and avatar, the way iOS shows consecutive messages. This is the first use
  of that split.
- The Psalm and the poem are verse, so their lines carry markdown hard
  breaks; without them the lines fold into paragraphs.
- 2026-01-08 credits "Brother Warren Berkley", and 2026-01-23 "Uncle
  Dickie" -- kept, per the policy on his own remarks.
- 2026-01-16 includes three Wikipedia links he pasted in; kept, and they
  render as links.
- Several passages recur from later months and are slugged for their own
  illustration: Matthew 7:13-14 (2026-01-09 `coasting`), Romans 10:17
  (2026-01-14), Philippians 1:27 (2026-01-01), Hebrews 11:6 (2026-01-02)
  and Matthew 18:6-9 (2026-01-28).

---

#### February 2026 — 20 devos — `references/feb-2026/`

The only complete month so far: every February weekday has a devo.

*Assumptions*

- **Filename order is weekday order** for the 19 `Untitled` files, checked
  as always against each header. One file is named for its date instead --
  `Fri-Feb-20th-1010AM.jpg` -- because it was not the first message that day
  and so carries no date header of its own. Its name was taken as given and
  is consistent with Feb 20 being a Friday.
- **The year is absent** from the screenshots; taken as 2026 from the folder
  name and consistent with all 20 weekdays.

*Coverage*

- Feb 2 -- Feb 27, all 20 weekdays. No gaps.
- Feb 20's **first** message of the day is not in the folder; only the
  10:10 AM one was captured, so that is the Feb 20 devo.

*Corrections applied*

- Lost spaces restored, per the practice begun with January
  ("received strengthto conceive", "He is the Rock" and similar).
- Numbered-book references spaced, as in earlier batches.
- None to his wording.

*Left as written — worth a look*

- **Four citations point at the wrong passage.** 2026-02-06 cites
  `1 John 1:10` for what is 1 John 1:9; 2026-02-16 cites
  `Ephesians 3:15-16` for Ephesians 5:15-16; 2026-02-24 cites
  `Matthew 21:26` for Matthew 21:22; and 2026-02-17 runs Ephesians 4:17-18
  on after the Hebrews 5:12-14 quotation under the one reference.
- 2026-02-02 and 02-03 quote Romans 1:16 as "I not ashamed" (*I am not*).
- 2026-02-05 has "Wisdom is better that weapons of war" (*than*) and
  "bad companions corrupts good morals" (*corrupt*).
- 2026-02-13 has "walked up to the gentleman and to him that he was wasting
  his time" (*and told him*), and "the loss of a dear loved ones".
- 2026-02-24 has "what god expects it to be" (lowercase).

*Notes*

- **He sent the same devo twice.** 2026-02-02 at 7:28 AM and 2026-02-03 at
  6:10 AM are the Hebrews 11:11 devo, word for word. Two separate messages
  with their own headers, so both are kept and both carry the title
  "Strength Through Faith"; the second is slugged
  `strength-through-faith-resent`. They will sit next to each other in the
  list. Say the word if you would rather only one were published.
- 2026-02-10 ends with a short anonymous poem, set with hard line breaks
  like January's.
- 2026-02-04 is about his father and the Psalm he quoted in every prayer
  until his memory went; 2026-02-13 tells how Joy's parents met, and
  2026-02-05 mentions Joy's cinnamon rolls. Kept, per the policy on his own
  remarks.
- Several passages rework earlier devos and are slugged for their own
  illustration: Isaiah 59:1-2 (2026-02-11 against July's
  `sin-is-not-gods-fault`), the prayer devo (2026-02-24 against January's
  `a-blessing-and-a-responsibility`), Hebrews 11:6 (2026-02-25 against
  January's `diligently-seek-him`) and Psalm 39 (2026-02-16 against
  2026-02-04).

---

#### March 2026 — 23 devos — `references/mar-2026/`

Two firsts: a message sent on a Saturday, and a message from someone other
than Buddy.

*Assumptions*

- **Filename order is weekday order** for the 22 `Untitled` files, checked
  against each header. `Mon-Mar-9th-924AM.jpg` is named for its date because
  it was not the first message that day; the name was taken as given and
  Mar 9 is a Monday, which checks out.
- **The year is absent** from the screenshots; taken as 2026 from the folder
  name and consistent with every date.

*Coverage*

- Mar 2 -- Mar 31. 21 of March's 22 weekdays have a devo.
- **No devo on Mar 27 (Fri)** -- and he says why: the Mar 28 devo ends "I
  apologize for not getting this out yesterday. b".
- **Mar 28 is a Saturday**, the first non-weekday in the archive, and it
  carries two messages: his late devo at 6:46 AM and Brad's prayer at
  11:45 AM.
- Mar 9's earlier message is not in the folder, so the 9:24 AM one is that
  day's devo.

*Corrections applied*

- Lost spaces restored, per the practice begun with January.
- Numbered-book references spaced, as in earlier batches.
- None to his wording.

*Left as written — worth a look*

- 2026-03-16 has "not a leader in the since that" (*sense*) and "the quite
  unassuming person" (*quiet*).
- 2026-03-25 has "He wants or minds to be blinded" (*our*).
- 2026-03-30 has "nor act in bad taste" mid-sentence where the sense wants
  *nor would she act*.
- 2026-03-31 has "whether we are the heated properly".
- Brad's prayer has "to be humble like like Him" -- his words, left alone.

*Notes*

- **2026-03-28 carries a prayer written by Brad Payne, Buddy's son.** The
  screenshot's sender label reads "Brad Payne", so it is a separate page
  with `author: Brad Payne` rather than a second bubble on Buddy's devo --
  different senders cannot share a bubble group. It is the only devo in the
  archive not written by Buddy.
- **The avatar now depends on the author.** Showing Buddy's photo on Brad's
  prayer would be wrong, and there is no photo of Brad, so a devo whose
  `author` differs from `site.author` gets a neutral SF Symbols
  person.crop.circle.fill instead, in the thread and in the list. Buddy's
  own devos are unchanged. Drop a photo in and swap the `{% if %}` in
  `devo.njk` and `index.njk` if one turns up.
- 2026-03-16 is a remembrance of an unnamed man -- "He was a quiet man" --
  and reads as written for someone in particular.
- 2026-03-03 is his prayer for his children and grandchildren; 2026-03-24
  recalls them climbing into his lap; 2026-03-30 tells a story about Brad's
  high-school football and Joy speaking up at a pep rally. Kept, per the
  policy on his own remarks.
- Several passages rework earlier devos and are slugged for their own
  illustration: Matthew 7:13-14, Matthew 18:6-9, Romans 12:1, James 4:7-10,
  Romans 10:17 and 1 Corinthians 13:11.

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
- **May 22 (Friday) has no devo.** He does not send one every weekday, so a
  missing day is expected rather than a lost screenshot.

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

---

#### July 2026 — 21 devos — `references/july-2026/`

*Assumptions*

- **Filename order is weekday order**, as in June: `Untitled.jpg` is Jul 1,
  then `Untitled 2`--`21`. Checked rather than assumed -- every file's weekday
  and send time was read back off its own screenshot header, all 21 matched.
  This mattered more than usual here, because the count does not line up with
  the calendar (see below) and a sequential guess would have been wrong from
  Jul 24 onward.
- **The year is absent** from the screenshots again; taken as 2026 from the
  folder name and consistent with all 21 weekdays.

*Coverage*

- Jul 1 -- Jul 31. July 2026 has 23 weekdays and there are 21 devos.
- **No devo on Jul 22 (Wed) or Jul 23 (Thu).** Expected -- he does not send
  one every weekday.

*Corrections applied*

- Numbered-book references spaced, as in earlier batches.
- None to his wording.

*Left as written — worth a look*

- **Three scripture citations point at the wrong passage.** 2026-07-07 cites
  `James 1:3` for what is James 1:2-3, and `Peter 1:6-7` with the book number
  missing (1 Peter). 2026-07-08 cites `2 Corinthians 6:9-10` for what is
  actually 2 Corinthians 7:9-10.
- 2026-07-01 spells it "the accencion of Jesus" in the numbered list, then
  "ascension" correctly in the next paragraph.
- 2026-07-06 quotes the hymn as "my live, my joy" (*my life*), and ends
  "Jesus become all the world to us" (*becomes*).
- 2026-07-17 keeps his "(copied)" marker, and has "it up to us" (*it is*).
- 2026-07-21 ends "doing all God commands" (*God's*).
- 2026-07-29 opens "And old sailor" (*An*).

*Notes*

- 2026-07-27 lists his "behind & beside" examples one per line in the
  original; set as a bullet list.
- 2026-07-30 runs Galatians 2:20 and 5:24 together in one quotation, with
  "(5:24)" marking the join. Kept as one block, with the marker bolded.
- Two passages recur from earlier months and are slugged apart from them:
  John 3:15-16 on 2026-07-10 (June 15 holds `because-i-love-the-lord`), and
  James on 2026-07-07 and 2026-07-29, which are `faith-that-endures` and
  `rocks-and-shoals`.
- These screenshots were captured with Messages zoomed out, so their text is
  smaller than earlier batches. That affects the screenshots only -- the
  bubble renders at a fixed 17px like every other devo, so nothing about the
  site's type changed.

---

#### August 2026 — 20 devos — `references/august-2026/`

*Assumptions*

- **Filename order is weekday order**, as before, and checked the same way:
  every file's weekday and send time read back off its own screenshot header,
  all 20 matched. The sequence holds through Aug 26 and then skips, so a
  positional guess would have mis-dated the last two.
- **The year is absent** from the screenshots; taken as 2026 from the folder
  name and consistent with all 20 weekdays.

*Coverage*

- Aug 3 -- Aug 31. August 2026 has 21 weekdays and there are 20 devos.
- **No devo on Aug 27 (Thu).**
- Two were sent in the afternoon rather than the morning: Aug 5 at 2:08 PM
  and Aug 31 at 1:31 PM. Recorded as sent.

*Corrections applied*

- Numbered-book references spaced, as in earlier batches.
- None to his wording.

*Left as written — worth a look*

- **2026-08-12 cites `Matthew 19:41-44` for what is Luke 19:41-44.** The
  substantive one this month.
- 2026-08-13 has "could have done that will 400 mighty warriors" (*with*),
  "turn around and returned" (*turned*), and a sentence that reads "Do
  'shed blood' in anger and avenge yourself" where the sense needs *Don't*.
- 2026-08-14 spells the character both "Preachr Pile" and "Preacher Pile",
  has "Too which" (*To*), and "in matter of personal character" (*matters*).
- 2026-08-25 has "Sunday eveningand" run together and "our conscientious"
  (*conscience*).
- 2026-08-28 has "first ever day" (*every day*) and "the principle"
  (*principal*).
- 2026-08-10 has "If they did not to become sluggish or lazy!"
- 2026-08-07 runs two sentences together: "no one will live sinlessly It is
  because of our weakness".
- 2026-08-26 has "is they miss out on the good and wonderful blessings".

*Notes*

- 2026-08-26 opens with a hymn rather than scripture, as 2026-07-25 did;
  the two verses are set as a quotation.
- 2026-08-31 begins "I apologize for the late posting. b." -- his own note,
  kept as the first line since he sent it that way.
- 2026-08-05 is Luke 14:25-27, close to 2026-07-06's Luke 14:25-26, so it is
  slugged `the-cost-of-discipleship` against that one's `all-in-all`.
  Likewise Romans 12:1 on 2026-08-11 and Romans 12:1-2 on 2026-08-26.
- The folder arrived nested as `references/july-2026/august-2026/` and was
  moved up beside the others. July's 21 screenshots were untouched.

---

#### September 2026 — 20 devos — `references/sept-2026/`

*Assumptions*

- **Filename order is weekday order**, checked the same way: every file's
  weekday and send time read back off its own screenshot header, all 20
  matched. The sequence breaks twice here -- after Sep 3 and after Sep 11 --
  so positional guessing would have mis-dated most of the month.
- **The year is absent** from the screenshots; taken as 2026 from the folder
  name and consistent with all 20 weekdays.

*Coverage*

- Sep 1 -- Sep 30. September 2026 has 22 weekdays and there are 20 devos.
- **No devo on Sep 4 (Fri).** Sep 14 was empty in this batch too, but a
  message from another thread supplies it -- see the `misc-2026` entry.

*Corrections applied*

- Numbered-book references spaced, as in earlier batches.
- None to his wording.

*Left as written — worth a look*

- **2026-09-22 cites `Psalm 119:150` for what is Psalm 119:105** ("Your word
  is a lamp to my feet"). The substantive one this month.
- 2026-09-01 quotes James 3:5-6 as "the tongue is]a fire" -- the same stray
  bracket seen in the April--May batch -- and has "Our criticismcan destroy".
- 2026-09-21 quotes Psalm 27:1 as "HE LORD is my light" (*THE*).
- 2026-09-29 has "The law of you mouth" (*your*) and "more that gold"
  (*than*), both inside the Psalm 119 quotation, plus "Archaeologist, found
  and dug an ancient city".
- 2026-09-30 has "BUSreligion" run together and "were people only talk"
  (*where*).
- 2026-09-02 has "Somethings prevent hearing" (*Some things*).
- 2026-09-08 has "the new nature Christians have are recreated into".
- 2026-09-16 has "if we want it's benefits" (*its*).
- 2026-09-28 has "motivate his readers remain faithful" (*to remain*).

*Notes*

- Two open with prose rather than scripture, as 2026-07-25 and 2026-08-26
  did: 2026-09-10 (which then lists the three New Testament uses of the noun
  *Christian*, set as a list with its scripture between) and 2026-09-15.
- 2026-09-21 is Proverbs 3:5-6, which 2026-06-11 already took as
  `lean-not-on-your-own-understanding`, so it is slugged
  `fundamental-attitudes`. Likewise James 1 recurs on 2026-09-02, 09-18 and
  09-30, and Hebrews 6:4-6 on 2026-08-25 and 2026-09-28; each is slugged
  for its own illustration.
- 2026-09-02 names his "Papaw Williams" -- kept, per the policy on his own
  remarks.
- The folder arrived nested as `references/august-2026/sept-2026/`, the same
  way August did, and was moved up beside the others. August's 20
  screenshots were untouched.

---

#### October 2026 — 14 devos — `references/oct-2026/` and `references/manual-devos.md`

The first month with two kinds of source. Messages collapsed his longest
posts, so those four were pasted in as text instead, and the other eight are
screenshots as usual. Both were transcribed to the same format; nothing about
a devo's page says which it came from.

The pasted four, and the two appended later, were originally in
`references/oct-2026/oct.txt` -- entries separated by `---` and headed with
the day, time and any tapback. They now live in `references/manual-devos.md`
with the rest of the hand-entered devos, headers and bodies verbatim, so
`oct.txt` below means that same text in its new home.

*Assumptions*

- **Filename order is weekday order** for the screenshots, checked as
  always against each header. It breaks three times here, because the long
  devos were pulled out into the text file and leave holes in the sequence.
- **The year is absent** from both sources; taken as 2026 and consistent
  with all 12 weekdays.

*Coverage*

- Oct 1 -- Oct 19: 8 from screenshots, 4 pasted in as text.
- **No devo on Oct 7 (Wed)** -- the only gap inside that range.
- Oct 29 and Oct 30: 2 more, pasted in as text in a later batch. Both are
  text-only; no screenshots were added for them.
- **Oct 20 -- Oct 28 has not been provided** (7 weekdays), so there is a
  hole between the two batches.

*Corrections applied*

- Numbered-book references spaced, as in earlier batches. `oct.txt` also
  ran several references straight into the verse
  (`Galatians 2:11-12Now when Peter...`, `1Thessalonians4:15-18`); split.
- One stray `2` removed from the Acts 22 quotation on 2026-10-15
  ("standing by consenting 2 to his death"), the same kind of copy artifact
  removed from the June quotations.
- **2026-10-30 is dated from its weekday, not its header.** `oct.txt` heads
  it "Fri, Oct 31st at 7:47 AM", but Oct 31 2026 is a *Saturday*; the Friday
  that week is Oct 30, which was also the day the batch was handed over.
  Two independent checks point the same way, so the devo is filed as Oct 30
  and the header is taken as a typo. **Worth confirming** -- if the date is
  right and the weekday wrong, rename the file to `2026-10-31-` and change
  the `date`; nothing else depends on it.
- `2Timothy 2:15` and `1Thess. 5:17` spaced to `2 Timothy` and `1 Thess.`,
  as in earlier batches. The abbreviation is left short; the linker resolves
  it to 1 Thessalonians either way.
- Word's bullet character (`·` followed by a run of spaces) converted to
  Markdown list items on 2026-10-29.

*Left as written — worth a look*

- 2026-10-08 has "there if a far better place" (*is*).
- 2026-10-15 quotes Matthew 13:15 as "est they should understand" (*lest*),
  and has "Webster includes in it's definitions".
- 2026-10-14 has "because it's standards are noble, it's purpose righteous".
- 2026-10-06 has "overlook some who are have good character".
- 2026-10-09 has "the hand of God is not something should always be feared".
- 2026-10-29 attributes "The meaning of life is to find your gift. The
  purpose of life is to give it away" to **William Shakespeare**. The line
  is not Shakespeare's -- it is usually given to Picasso, and is probably
  neither. Kept as he wrote it.
- 2026-10-29 has "the American society rest on the backbone" and "the
  medical profession rest on the weary backs" (*rests*).
- 2026-10-30 has "the work of other doctors and scientist" (*scientists*)
  and "So there I was there trying to count the tubes".
- 2026-10-30 quotes 2 Timothy 2:15 in the **KJV** ("Study to shew thyself
  approved"), not the NKJV he uses everywhere else. The auto-link still
  points at NKJV, so the linked text will not match the bubble on that one
  verse.

*Notes*

- **2026-10-19 was already in the archive** and was not written again.
  `Untitled 8.jpg` is that devo, and its header reads "Mon, Oct 19 at
  9:08 AM" -- matching both the date and the time inferred for it back when
  the only evidence was the artifact export's bare "Monday 9:08 AM". The
  inference is now confirmed by the source.
- 2026-10-09 quotes the lyric "Daddy's hands", and 2026-10-13 the chorus of
  "Jesus Is Coming Soon"; both set as quotations.
- 2026-10-12 is built on a repeated "Isn't it strange" lead-in, bolded in
  the original and kept bold.
- 2026-10-14 reworks much of the 2026-09-08 devo; both are kept, slugged
  `be-holy-for-i-am-holy` and `conduct-worthy-of-the-gospel`.
- These screenshots are wider than earlier months because the Messages
  window was widened. Like July's zoom, that changes the capture only --
  the bubble renders at the same width and type size as every other devo.
- Tapbacks (the hearts and thumbs-up on some messages, and the "1 Heart
  emoji" on the 2026-10-15 header, now its `tapbacks` field) are not
  rendered, here or in any earlier month. Say so if you would rather they
  were; it would be a change across the whole archive.
- Both October 29--30 devos open with a title line he wrote himself ("From
  the Hospital Bed - Nurses"). The page's own `<h1>` is screen-reader only,
  so dropping that line would lose it from the bubble; it is kept, set bold
  the way the `PERSECUTION`/`FAILURE` labels are on 2026-10-08. The
  front-matter titles normalise his dash to a colon so they read well in
  the conversation list and the pager.
- They read as the first two of a series -- he is writing from a hospital
  bed. Expect more under the same heading.
- **2026-10-30 may be truncated.** The paste ends mid-sentence on
  Hebrews 10:24-25a ("as is the manner of some,"), with no closing thought
  after the third life-line. That is exactly where the pasted text stops,
  so it may be the end of the message or it may be a short paste. Worth a
  look at the original; its entry is marked `complete: unsure`.

---

#### November 2026 — 9 devos — `references/manual-devos.md`

The last three of the hospital-bed series plus six devos outside it, and the
first month with no screenshot folder of its own. All nine were hand-entered,
so there is nothing to capture and no `references/nov-2026/` to create -- they
are entries in `references/manual-devos.md` like every other pasted devo. A
November batch of screenshots, if one ever arrives, would get its own folder
alongside.

*Assumptions*

- **Every date came from its own header**, "Mon, Nov 2nd 6:25 AM", "Tue, Nov
  3rd 6:43 AM", "Wed, Nov 4th 7:44 AM", ", Thurs, Nov 5th 7:35 AM", "Fri,
  Nov 6th 5:58 AM", "Mon, Nov 9th 7:04 AM", "Tue, Nov 10th 5:42 AM", "Wed,
  Nov 11th 5:52 AM" and "Thurs, Nov 12th 6:32 AM". Nov 2 2026 *is* a Monday
  and so on through Nov 12 -- header and calendar agree on all nine, unlike
  2026-10-30 in the batch before them. All nine headers drop the "at" the
  other entries use; Nov 5's opens with a stray comma, and it and Nov 12
  abbreviate the weekday "Thurs". Nothing reads the field, so none of it
  needed fixing.
- **The Nov 10, Nov 11 and Nov 12 entries omit `source:`**, which the file
  documents as defaulting to `manual`. Taken as manual, consistent with every
  other entry here and with there being no November screenshots at all.
- **The year is absent** from the text, as always; taken as 2026.

*Coverage*

- Nov 2 -- Nov 12, all nine text-only, no screenshots.
- Nine consecutive weekdays with no gap: Nov 2 to Nov 6 is a full week, the
  first in the archive since the hospital stay began, and Nov 9 to Nov 12 are
  four more. Nov 7 and Nov 8 are the weekend, so they are not a gap.
- **Nov 13 onward has not been provided yet**, so the archive currently ends
  at Nov 12.

*Corrections applied*

- `Ephesians 5:15-16See then that you walk...` split on 2026-11-02, the same
  run-together reference `oct.txt` produced throughout October. The
  `James 5:13-18` reference on 2026-11-03 and every reference on 2026-11-04,
  2026-11-05 and 2026-11-06 came through already spaced and needed no
  splitting.
- Word's paragraph indent -- a run of spaces before "One of the questions"
  on 2026-11-02, before "As I lay in the hospital bed" on 2026-11-03, and
  before both "So after waiting several days" and "The very purpose of Jesus
  coming" on 2026-11-04 -- read as a paragraph break, as on 2026-10-29 and
  2026-10-30.
- **Two lost spaces restored inside the James 5 quotation** on 2026-11-03,
  both at a verse boundary: "avails much.Elijah was a man" and "three years
  and six months.And he prayed again". Same capture artifact as the spaces
  restored in January, and at verse joins rather than anywhere he was
  writing himself.
- `2Peter 3:9` spaced on 2026-11-04, per the standing practice for numbered
  books.
- 2026-11-05 arrived as four lines with no blank line between them --
  scripture, prose, scripture, prose. Read as four paragraphs, which is the
  only shape those line breaks can mean. 2026-11-06 arrived the same way, in
  eight lines alternating the same two kinds, and was read the same way.
- **`1Peter 1:13-16Therefore gird up` on 2026-11-10 needed both fixes at
  once**: the numbered book spaced, as everywhere else in the archive, and the
  reference split from the verse it ran into, as with `Ephesians 5:15-16See`
  on 2026-11-02. The other two references that day came through clean.
- **Four bullets set from his `·` marks** on 2026-11-10, the same conversion
  as the two lists on 2026-10-29.
- **`1John 5:4-5` spaced** on 2026-11-11, and one more lost space restored
  after a full stop inside that same quotation: "overcome the world--our
  faith.Who is he who overcomes". The other two references that day came
  through clean.
- 2026-11-11 arrived as six unseparated lines alternating scripture and
  prose, read as six paragraphs, the same shape as 2026-11-05, 2026-11-06 and
  2026-11-09.
- **A ` - ` between the reference and the verse dropped** on 2026-11-12,
  which opens `James 2:13-20 - What does it profit`. No other entry in the
  archive separates them that way, and the bold reference at the head of the
  blockquote is already doing that job. Formatting, so ours to change; his
  wording is untouched.
- **Two more lost spaces restored** on 2026-11-09, both after punctuation
  inside a quotation: "the boundaries of their dwellings,so that they should
  seek the Lord" and "knock, and it will be opened to you.For everyone who
  asks". Same capture artifact as the January spaces and the 2026-11-03 ones.
- **A backwards opening quote mark** on 2026-11-06, in `,  "there just wasn't
  enough evidence for me to believe you were real."` -- the paste opens that
  quotation with a *closing* curly mark. Written straight in the Markdown like
  every other quote, so the build curls it the right way round. A capture
  artifact, not his punctuation; the straight-quote convention means nothing
  else here had to change.

*Left as written — worth a look*

- 2026-11-02's opening sentence has no main clause: "When you are
  constrained in the hospital bed hooked up to all the IV's and tubes that
  are feeding you and giving you all the medicine the doctors order."
- 2026-11-02 has "each of us will give and accounting" (*an*), and "for some
  purpose its leaving our account" (*it's*).
- 2026-11-02's "Each moment that passes has been taken out of your assets
  and placed in our investments" switches from *your* to *our* mid-sentence.
- 2026-11-02's "Are we investing our time to God's glory or to our own
  destruction." ends on a period though it reads as a question.
- 2026-11-03 has "if prayer is offered in faith and it in harmony with God's
  will" (*is in harmony*), and "those suffering and are sick spiritually".
- 2026-11-03's James 5 quotation ends with no full stop, on "the earth
  produced its fruit". Restoring the two verse-boundary spaces was a capture
  fix; adding punctuation would not be, so it is left as the paste gave it.
  See the truncation note below -- the two may be the same thing.
- 2026-11-03 uses `&` for *and* twice ("suffering & sick" and "protection,
  providence & provision"); kept, as his shorthand.
- **2026-11-04 cites `Mark 2:16` for text that is actually Mark 2:17.** The
  most substantive of these, and the same call as 2026-06-12's
  `Hebrews 12:15-16`: his citation stands in the bubble and in the front
  matter, so the page links what he wrote. The verse he quoted is the one he
  already quoted as Luke 5:31 six days earlier on 2026-10-29.
- 2026-11-04's Romans quotation runs two verses together under one
  reference, marking the second with a bare `(6:23)` -- "for all have sinned
  and fall short of the glory of God, (6:23) For the wages of sin is death".
  Kept in one blockquote with the parenthetical inline, as with
  2026-10-30's `Psalm 95:1-2 ... (6)`.
- 2026-11-04 has "Before man will respond to Jesus call" (*Jesus'*).
- 2026-11-05 switches person inside one sentence: "Our faith rests securely
  upon the evidence of verifiable truth, not on your emotions, someone
  else's emotion, your opinions or someone else's opinions."
- 2026-11-06 has "faith operates without evidence instead, evidence is the
  basis of our faith", which wants a semicolon or a full stop where the comma
  is, and "Scriptures teach us that creation is evidence in the existence of
  God" (*of*).
- 2026-11-06 has "What Paul is saying that just because some ignore" (*saying
  is that*), and "it is the Apostles word we have in written form"
  (*Apostles'*).
- 2026-11-06's "Scriptures teach us that creation is evidence in the existence
  of God" ends with no full stop, the line break before the Romans 1:20
  reference standing in for one. Same call as 2026-11-03's James 5 quotation:
  restoring a dropped space is a capture fix, adding punctuation is not.
- 2026-11-06's "Why did God choose these women to be the first to witness the
  resurrection of the Lord." ends on a period though it reads as a question,
  the same shape as 2026-11-02's "or to our own destruction."
- 2026-11-09 opens "Within the Context of Paul's sermon" with *Context*
  capitalised mid-sentence, and then refers to Paul as "he was addressing" and
  "He speaks of God" two clauses apart -- same subject, two capitalisations.
- 2026-11-09 has "creator of all things one who has created man to 'seek
  Him.'", which wants a comma or a dash between the two phrases.
- **Both scripture quotations on 2026-11-09 open a quote mark and never close
  it**, Acts 17:26-27 and Matthew 7:7-8. Left as he sent them, as with
  2026-10-30's John 6:68 and the unclosed "Someone wrote," on 2026-06-17.
  Worth knowing what that renders as: markdown-it's typographer only curls
  quotes it can pair, so an unmatched one stays a straight `"` in the bubble
  while every other quote on the page is curly. 2026-10-30 already ships that
  way; on 2026-11-09 it is the devo's opening character, so it shows more.
- 2026-11-09's hymn has "stay Thou near by" and "Temptations loose their
  pow'r" (*nearby*, *lose*). Both are his -- see the note below on the same
  couplet appearing differently on 2026-02-12.
- 2026-11-10 has "And heaven it the object of our hope" (*is*), and "we are to
  follow the example of our Heavenly Father we are to be holy", which wants a
  comma or a dash between the two clauses.
- 2026-11-10's second bullet, "Be sober in thought and purpose", is an
  imperative where the other three are declarative -- "Preparing our minds",
  "We are to be obedient children", "And we are to follow the example". The
  list is his and so is the break in its parallel.
- 2026-11-11 has "he took his eyes off Jesus and saw the wind and waves the
  storm and the sea around him", a run of four things with no punctuation
  between them, and the sentence before it joins two clauses on a comma:
  "Peter's fear of drowning changed his focus, he took his eyes off Jesus".
- 2026-11-11 has "a sin filled world" unhyphenated, where 2026-10-30 has
  "sin-sick world" with one. Both as he wrote them.
- **2026-11-12 cites `James 2:13-20` for a quotation that begins at verse
  14** -- "What does it profit, my brethren" is v14, where v13 is "judgment
  is without mercy". An off-by-one at the start of the range rather than the
  wrong passage, so milder than 2026-11-04's Mark 2:16 or 2026-06-12's
  Hebrews 12:15-16, but the same call: his citation stands in the bubble and
  the front matter, and the page links what he wrote.
- **2026-11-12's boatman story has two unclosed quotations and a garbled
  one.** `"Now, let's try works' without faith' and see what happens.` wants
  single quotes around *works* and *faith* and has only the closing halves,
  and neither that sentence nor the later `"You see, to make a passage across
  the lake` is ever closed. All left as he sent them.
- 2026-11-12 has "he makes no progress either across the lake nor as a
  Christian" (*either ... or*, or *neither ... nor*).
- **2026-11-10's 1 Peter 1:13-16 quotation ends inside a nested quotation**
  that is never closed: `because it is written, "Be holy, for I am holy.`
  Left as he sent it, like the two unclosed quotations on 2026-11-09, and it
  renders the same way -- a straight `"` where the rest of the page is curly,
  because markdown-it only curls quotes it can pair.

*Notes*

- The three hospital-bed devos keep the shape of the first two: his own
  title line bold at the top of the bubble, and a front-matter title that
  normalises his dash to a colon. His lowercase *time*, *prayer* and *the
  diagnosis* are kept in the bubble and title-cased only in the front
  matter, where they sit beside "Nurses" and "Life Lines" in the
  conversation list.
- **2026-11-05, 2026-11-06 and 2026-11-09 have no title line of his own** and
  none is part of the series -- they open straight on scripture, so the posts
  do too, like 2026-10-15 and the other untitled ones. "Walk by Faith", "The
  Evidence of Things Not Seen" and "Not Far from Each One of Us" are all ours,
  each taken from the verse he opens with; Nov 5's doubles as the line he
  closes on, and Nov 6's is the phrase from Hebrews 11:1 that the whole devo
  expounds.
- **Nov 9's title is third choice**, and the reason is worth recording. The
  two titles the devo asks for are both taken by devos it is closely related
  to: "Diligently Seek Him" (2026-01-02), which is headlined on the same
  Hebrews 11:6 and argues the same point about diligence, and "I Need Thee
  Every Hour" (2026-02-12), which quotes the same hymn. "Not Far from Each One
  of Us" comes from the end of Acts 17:27, the headline verse, and is the one
  phrase in the devo neither neighbour uses.
- **The hymn is set as a blockquote with hard line breaks**, one line per
  line, following 2026-01-23 -- the only other devo in the archive that quotes
  verse laid out as verse. No bold reference prefix, since it is a hymn rather
  than scripture, which follows 2026-08-26's two stanzas of "Sweet will of
  God". His own quote marks around the six lines are kept where he put them,
  and they pair, so they curl.
- **The same hymn couplet is in the archive twice, spelled three ways.**
  2026-02-12 has "stay thou nearby; temptations lose their pow'r when Thou are
  nigh.."; 2026-11-09 has "stay Thou near by, / Temptations loose their pow'r
  when Thou art nigh." Both reproduced as he sent them -- he is quoting from
  memory, and the differences are the record of that.
- **2026-11-05 is a near-rewrite of 2026-07-03**, "Faith Is Not Blind": same
  two verses, same argument, much of it word for word. The differences are
  his, not the capture's -- "we are not blindly groping through life" for
  "Faith is not blind", *your* emotions for *one's*, "crucial to spiritual
  success" for "critical to having and maintaining a relationship with
  God" -- and it adds a closing call the earlier one does not have ("Make
  today the day you turn away from sin and swiftly run to God"). Published
  as its own devo, since he sent it as one; the earlier title was already
  taken, which is why this one is not called the same thing.
- `scripture` on 2026-11-02 is **Ephesians 5:15-16**, the verse the devo
  argues from ("redeeming the time"), not the Ecclesiastes 3:1 it opens with
  -- that one is already the headline verse on 2026-04-01 and 2026-07-24.
  2026-11-03 cites only **James 5:13-18**, so there was nothing to choose;
  it is the first devo in the archive to reference James 5. 2026-11-04 takes
  **Mark 2:16**, his citation for the diagnosis verse the whole devo turns
  on, and is the first to reference Mark 2. 2026-11-05 takes
  **2 Corinthians 5:7**, which it opens with and ends on; it is the headline
  on 2026-03-17 as well, which is no bar -- Matthew 7:13-14 is the headline
  on four. 2026-11-06 takes **Hebrews 11:1**, the definition it quotes and
  then spends the whole devo unpacking; that is the headline on 2026-07-03
  too, and the third devo in the archive to cite the verse. Its other three
  references -- Romans 1:20, Luke 24:8-11 and John 20:30-31 -- are all new to
  the archive, which is why the scripture index gained three entries for one
  devo. 2026-11-09 takes **Acts 17:26-27**, the Mars Hill passage he opens
  with and names in the devo ("Within the Context of Paul's sermon on Mars
  Hill"), and it is new to the archive. Hebrews 11:6 was the other candidate
  and is the weaker one twice over: it is already the headline on 2026-01-02,
  which makes the same argument, and on three more besides -- it is the
  archive's most-headlined verse after Matthew 7:13-14. Psalm 14:2 and
  Matthew 7:7-8 are also new, so this devo too added three index entries;
  Hebrews 11:6 is now cited five times.
- **2026-11-02 and 2026-11-03 may be truncated**, the same worry as
  2026-10-30. 2026-11-02's paste ends on the Romans 2:5-6 quotation, whose
  own last character is a colon introducing a list that is not there.
  2026-11-03's ends on a closing paragraph that reads complete -- "And
  prayer connects with that power." -- but its James 5 quotation stops
  without a full stop, so a few characters may have been lost there. Worth a
  look at the originals.
- **The run of truncations ends here.** Three of the four hospital-bed devos
  pasted before Nov 4 ended with that unease; 2026-11-04 closes on a full
  paragraph ("be able to teach them to others."), 2026-11-05 on a full
  sentence ("be strong and walk by faith.") and 2026-11-06 on a whole
  punctuated quotation of John 20:30-31, all three marked `complete: yes`.
  Whatever was clipping the end of a Word block was not doing it on these.
  Ending on scripture is not itself a truncation signal -- he closes that way
  often, 2026-10-29 included; what marked Nov 2 was that the quotation itself
  broke off mid-thought.
- **2026-11-10 sits between three devos already in the archive**, and the
  title had to step around two of them. 2026-09-14 is *titled* "A Living
  Hope" and closes on the very 1 Peter 1:3-5 that Nov 10 opens with;
  2026-10-14 is "Be Holy, For I Am Holy", headlined on 1 Peter 1:13-17
  against Nov 10's 1:13-16 and ending on the same sentence; and 2026-01-15
  is headlined on Hebrews 6:10-12 against Nov 10's 6:11-12. "A Necessary
  Response" is ours, from his own "there is a necessary response to this
  promised hope", and it names the half of the devo the neighbours do not
  cover -- the four things the hope asks of us. "What Heaven Is Not", from
  his best line that day, was the alternative and is still free.
- `scripture` on 2026-11-10 is **1 Peter 1:3-5**, the passage he opens with
  and spends the first half on. 1 Peter 1:13-16 is the verse the second half
  argues from, but taking it would have put this devo's headline a single
  verse away from 2026-10-14's. It is cited twice now, so it is the 40th
  verse in the index with more than one devo against it.
- **2026-11-12 is "Both Oars"**, ours, from the boatman's "one needs both
  oars working simultaneously". He gives the devo no title and the
  illustration is the whole of it; no existing title or scripture came near
  it. It is also the archive's first citation of **James 2**, and its only
  reference -- the one devo this month to rest on a single passage.
- **2026-11-12 is the strongest test so far of the unpaired-quote
  behaviour**, and it came through clean. Its middle paragraph carries six
  balanced double-quoted phrases and two unmatched openers, all mixed
  together; markdown-it curled every pair correctly and left exactly the two
  openers straight, rather than mis-pairing from the first odd one onward.
  The rule holds under pressure: only quotes it can pair get curled.
- **2026-11-11's title steps around 2026-06-01**, "Fear and Faith", which
  argues the same thesis -- that the two are opposites and that faith in
  Jesus does away with fear -- but from Mark 4:40 and the stilling of the
  storm, where this one takes Matthew 14 and Peter on the water. "What Fear
  Focuses On" is ours, from his "All you see is what the fear focuses on",
  and it names what is actually new here: fear as a thing that narrows
  perception, not merely the opposite of faith.
- `scripture` on 2026-11-11 is **Matthew 14:28-31**, the passage the devo
  works through, rather than the Philippians 1:27-28 it opens with. That is
  the opposite call from 2026-11-10, and the same reasoning produced both:
  take the opener unless doing so would sit a headline on top of a
  neighbour's. Here it would -- Philippians 1:27 is already the headline on
  2026-01-01 and 2026-09-08, and 2026-09-08 quotes it breaking off exactly
  where this devo carries on, at "the faith of the gospel,". His extension
  into verse 28, "not in any way terrified by your adversaries", is the
  clause the whole devo turns on, so the overlap is deliberate on his part
  and worth not flattening in the index. All three of its references are new
  to the archive.
- **The Nov 9 entry arrived headed `## 11-09-2026`**, in US order rather than
  the ISO form this file requires, and was normalised to `## 2026-11-09`. The
  heading is the one field that becomes a filename, so the format is not
  cosmetic. Nothing was ambiguous here -- "Mon, Nov 9th" and Nov 9 2026 being
  a Monday agree -- but `11-09-2026` and `09-11-2026` are the same characters
  in two orders, which is exactly what the ISO rule exists to prevent.
- **Nov 5 and Nov 6 read as a pair on one subject**, faith and the evidence it
  rests on, and both reach back to 2026-07-03 "Faith Is Not Blind" -- Nov 5
  rewrites it, Nov 6 argues the other half, that the evidence is the apostles'
  recorded testimony. 2026-03-10 "The List of Witnesses" is the nearest
  earlier devo to Nov 6's argument, on the same resurrection eyewitnesses from
  1 Corinthians 15:3-8, but it shares no verse with it.

---

#### Other threads — 22 devos — `references/misc-2026/`

Messages he sent on other Message threads, including the one he used before
starting the Morning Devo thread. Not a month: the dates run across April,
September and October, and they are filed by their own date like any other
devo, so they sort into place on the site.

*Assumptions*

- **Every date came from its own header.** No sequential guessing at all
  here, since these come from mixed threads. Two files are named for their
  date because they were not the first message that day:
  `Fri-Apr-3rd-454PM.jpg` and `Wed-Apr-15-1052AM.jpg`. Both names check out
  against the calendar.
- **The year is absent** from the screenshots; taken as 2026 and consistent
  with every weekday.

*Coverage*

- Apr 1 -- Apr 28 (20 messages), plus Sep 14 and Oct 5.
- **Apr 3 carries two messages**, 4:52 PM and 4:54 PM, two minutes apart.
- **Sep 14 fills a gap** that the September entry had recorded as having no
  devo. September now has 21 of its 22 weekdays; only Sep 4 is still empty.
- Apr 15's earlier message is not in the folder, so the 10:52 AM one is that
  day's devo.
- April now has 21 of its 22 weekdays. **Apr 2 (Thu) has no devo.**

*Corrections applied*

- Lost spaces restored, per the practice begun with January.
- Numbered-book references spaced, as in earlier batches.
- None to his wording.

*Left as written — worth a look*

- 2026-04-21 has "it up to us to seek the answer" (*it is*), the same phrase
  that appears in 2026-07-17.
- 2026-04-27 has "First on the list of our life must always to be like
  Jesus" (*must always be*).
- 2026-04-17 has "Is our life wrapped up on our career" (*in*), as
  2026-09-03 does.
- 2026-04-23 attributes "No man is happy who does not think himself so" to
  "Roman Emperor Marcus Antonius".

*Notes*

- **DUPLICATES TO SCRUB.** Two pairs are word-for-word identical. Both are
  published so nothing is lost; delete whichever side you prefer.

  1. `2026-10-05-crowded-in.md` (6:54 AM, from `oct-2026`) and
     `2026-10-05-crowded-in-other-thread.md` (6:53 AM, from `misc-2026`).
     The same devo sent to two threads a minute apart.
  2. `2026-02-02-strength-through-faith.md` and
     `2026-02-03-strength-through-faith-resent.md`, already flagged under
     February -- he re-sent it the next morning.

  Two more are very close but **not** identical, so both are kept as sent:
  `2026-04-13` and `2026-04-27` differ by one sentence (91% shared), and
  `2026-04-21` and `2026-07-17` rearrange the same material and differ in
  their closing scripture (88% shared).

- **2026-09-14 was transcribed by hand, by the author.** Every attempt to
  write its text out automatically was stopped by a content filter on model
  output, four times running, while the other 21 in this batch went through
  untouched -- a false positive on ordinary devotional prose. Rather than
  engineer around a safety filter, the page was left as a stub and filled in
  manually from `references/misc-2026/Untitled 19.jpg`. It is complete now:
  Mark 16:4-6, the hymn "He Lives", and 1 Peter 1:3-5.
- `references/april-2026/` held the two named files before this batch and
  was folded into `misc-2026`; recorded as a move, the files are unchanged.

---

#### Added directly — not from a screenshot

Everything else in the archive traces back to a file in `references/`.
These do not, and are listed here so that stays visible.

- **2026-10-28 `tears-of-repentance`** — a line from Charles Spurgeon.
  - Date and time confirmed by the author: sent 2026-10-28 at 7:45 AM. They
    were not given when it was first added, so the date was assumed and the
    time left off; both have since been supplied.
  - `scripture` is empty: he quoted Spurgeon, not a passage.
  - First relayed as text, then replaced by the picture he actually sent --
    a Challies quote graphic, saved as
    `src/assets/img/charles-spurgeon-tears-of-repentance.jpg`. The quote is
    typeset into the picture, so the devo carries no body text; it lives in
    the image's `alt` instead. This is the only photo message in the archive
    so far, and the only devo whose words a reader cannot select.

### Photo messages

A devo whose whole body is one `<img>` is rendered the way Messages renders
an attachment: the picture itself, rounded, with no grey bubble behind it and
no tail. Everything else about the message -- the stamp, the name, the avatar,
the pager -- is unchanged.

Three pieces make that work, and they have to agree:

- `isPhoto` in `eleventy.config.js` decides whether a bubble's contents are
  nothing but a picture. Markdown wraps `![alt](src)` in a paragraph but
  passes a bare `<img>` tag straight through as an HTML block, so it allows
  for either.
- `src/_includes/devo.njk` puts `.bubble-photo` on the bubble and leaves the
  tail off.
- `.bubble-photo` in `app.css` drops the background and padding and rounds
  the picture to the bubble's own 18px.

Write one as a bare `<img>` with `width`, `height` and `alt`. The dimensions
hold the space while the picture loads; the `alt` is not optional, because
for a picture of text it is the only copy of the words that exists. `plain()`
lifts `alt` out before stripping tags, so a photo devo is still searchable --
searching *quicker* finds this one, and that word appears nowhere but inside
the picture.

## Known gaps

- There is no search-engine-facing index, tag page or scripture index yet.
- The `scripture` front-matter field is captured but not displayed.
