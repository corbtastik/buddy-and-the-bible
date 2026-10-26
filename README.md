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
`references/jan-2026/`, `references/feb-2026/`, `references/apr-may-2026/`, `references/june-2026/`,
`references/july-2026/`, `references/august-2026/`,
`references/sept-2026/`, `references/oct-2026/`.

He does not send a devo every weekday, so gaps in a month are normal. Each
entry below lists the days with none, so a gap is visibly accounted for
rather than looking like a transcription that got dropped.

Nor are they always sent in the morning. `time` records whatever the
screenshot says, afternoon included, so an odd hour is the source speaking
and not a typo.

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
- **No devo on Sep 4 (Fri) or Sep 14 (Mon).**

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

#### October 2026 — 12 devos — `references/oct-2026/`

The first month with two kinds of source. Messages collapsed his longest
posts, so those four were pasted into `references/oct-2026/oct.txt` instead,
each separated by `---` and headed with its day, time and any tapback. The
other eight are screenshots as usual. Both were transcribed to the same
format; nothing about a devo's page says which it came from.

*Assumptions*

- **Filename order is weekday order** for the screenshots, checked as
  always against each header. It breaks three times here, because the long
  devos were pulled out into the text file and leave holes in the sequence.
- **The year is absent** from both sources; taken as 2026 and consistent
  with all 12 weekdays.

*Coverage*

- Oct 1 -- Oct 19: 8 from screenshots, 4 from `oct.txt`.
- **No devo on Oct 7 (Wed)** -- the only gap inside that range.
- **Oct 20 onward has not been provided yet** (9 weekdays), so the archive
  currently ends at Oct 19.

*Corrections applied*

- Numbered-book references spaced, as in earlier batches. `oct.txt` also
  ran several references straight into the verse
  (`Galatians 2:11-12Now when Peter...`, `1Thessalonians4:15-18`); split.
- One stray `2` removed from the Acts 22 quotation on 2026-10-15
  ("standing by consenting 2 to his death"), the same kind of copy artifact
  removed from the June quotations.

*Left as written — worth a look*

- 2026-10-08 has "there if a far better place" (*is*).
- 2026-10-15 quotes Matthew 13:15 as "est they should understand" (*lest*),
  and has "Webster includes in it's definitions".
- 2026-10-14 has "because it's standards are noble, it's purpose righteous".
- 2026-10-06 has "overlook some who are have good character".
- 2026-10-09 has "the hand of God is not something should always be feared".

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
  emoji" noted in `oct.txt`) are not rendered, here or in any earlier
  month. Say so if you would rather they were; it would be a change across
  the whole archive.

## Known gaps

- There is no search-engine-facing index, tag page or scripture index yet.
- The `scripture` front-matter field is captured but not displayed.
