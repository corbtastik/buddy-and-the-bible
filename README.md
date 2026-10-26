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
`2025-10-20-they-think-it-strange.md` publishes at
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
  assets/css/app.css   all styles
  assets/img/          avatar and group-cluster images
  devos/
    devos.json         layout, tag and permalink for every devo
    *.md               one file per devo
docs/TEMPLATE.md       starting point for a new devo
archive/               the original design export
```

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

## Before deploying

- Set `url` in `src/_data/site.json` to the live origin (e.g.
  `https://morningdevo.example`). Canonical, `og:url` and `og:image` tags are
  only emitted once it is set, since link previews need absolute URLs.
- `_site/` is a plain static directory — it can be served from Netlify,
  Cloudflare Pages, GitHub Pages or any static host with no extra config.

## Where the devos came from

`references/` holds the original iMessage screenshots the devos were
transcribed from, kept as provenance so any transcription can be checked
against the source.

Dates: the screenshots show a weekday and date but no year ("Wed, Apr 29 at
6:37 AM"). All 22 weekday/date pairs match 2026 exactly, which the author
confirmed. The 2026-10-19 devo came from the original artifact export, which
showed only "Monday 9:08 AM" -- iOS renders a bare weekday only within the
past week, and the export is dated 2026-10-25, so the preceding Monday is
2026-10-19.

## Known gaps

- A few transcriptions carry artifacts from the author's own source text,
  reproduced faithfully rather than silently corrected:
  `Hebrews 5:8-9 "though He was a Son, ye] He learned"`,
  `1 Peter 5:5 "submit yourselves to you] elders"`,
  `Romans 5:8` names "Mr. Mitchell" for George Wilson, and `Mark 12:30-31`
  has "neverhave". Fix them in the Markdown if you would rather they read
  clean.
- There is no search, tag or scripture index yet.
- The `scripture` front-matter field is captured but not displayed.
