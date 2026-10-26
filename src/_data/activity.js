/* The calendar grid behind the activity graph on the home page: one column
 * per week, one cell per day, counting the devos he sent that day.
 *
 * Reads the devo filenames rather than their contents -- the date prefix is
 * all this needs, so it stays cheap as the archive grows. */

import fs from "node:fs";

const DEVOS = "src/devos";
const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);

export default function () {
  const counts = new Map();
  for (const f of fs.readdirSync(DEVOS)) {
    const m = f.match(/^(\d{4}-\d{2}-\d{2})-.*\.md$/);
    if (m) counts.set(m[1], (counts.get(m[1]) || 0) + 1);
  }
  if (!counts.size) return { weeks: [], total: 0, days: 0 };

  const dates = [...counts.keys()].sort();
  const first = new Date(dates[0] + "T00:00:00Z");
  const last = new Date(dates[dates.length - 1] + "T00:00:00Z");

  // Square off the grid: start on the Sunday on or before the first devo,
  // end on the Saturday on or after the last, so every column is full.
  const start = new Date(first.getTime() - first.getUTCDay() * DAY);
  const end = new Date(last.getTime() + (6 - last.getUTCDay()) * DAY);

  const fmtFull = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const fmtMonth = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" });

  const weeks = [];
  let prevMonth = null;
  for (let t = start.getTime(); t <= end.getTime(); t += 7 * DAY) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(t + i * DAY);
      const key = iso(d);
      const count = counts.get(key) || 0;
      days.push({
        iso: key,
        count,
        // 0 none, 1 one devo, 2 more than one. Only three days have two.
        level: count === 0 ? 0 : count === 1 ? 1 : 2,
        label: count
          ? `${fmtFull.format(d)} — ${count} devo${count > 1 ? "s" : ""}`
          : `${fmtFull.format(d)} — none`,
      });
    }
    // A month label sits above the week where that month first appears.
    const monthOf = new Date(t);
    const name = fmtMonth.format(monthOf);
    const show = name !== prevMonth && monthOf.getUTCDate() <= 7;
    if (show) prevMonth = name;
    weeks.push({ days, month: show ? name : "" });
  }

  return {
    weeks,
    total: [...counts.values()].reduce((a, b) => a + b, 0),
    days: counts.size,
  };
}
