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

## Before deploying

- Set `url` in `src/_data/site.json` to the live origin (e.g.
  `https://morningdevo.example`). Canonical, `og:url` and `og:image` tags are
  only emitted once it is set, since link previews need absolute URLs.
- `_site/` is a plain static directory — it can be served from Netlify,
  Cloudflare Pages, GitHub Pages or any static host with no extra config.

## Known gaps

- **The date on the first devo is a guess.** The original export only recorded
  "Monday 9:08 AM", so `2025-10-20` was chosen to match. Correct it in
  `src/devos/2025-10-20-they-think-it-strange.md` (and rename the file) once
  the real date is known.
- There is no search, tag or scripture index yet.
- The `scripture` front-matter field is captured but not displayed.
