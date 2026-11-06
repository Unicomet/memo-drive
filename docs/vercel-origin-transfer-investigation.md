# Vercel origin-transfer investigation — November 6, 2026

The main cause is the dashboard's automatic whole-page refresh every second. Production request records confirm repeated, uncached requests to `/dashboard/notes.rsc`, even without an explicit user action. Each refresh runs authentication middleware and renders the notes page, which queries and sends the user's full notes collection. One user can therefore generate sustained Compute traffic by leaving the dashboard visible.

The diagnosis used authenticated, read-only Vercel usage queries for `memo-drive`, production deployment history, a complete ten-minute request window, and the deployed code's refresh and data-loading paths. This investigation changed no application code. This is a diagnosis of observed historical usage; a post-fix production reduction has not been tested.

The checkout and remote already contain commit `0e9dee4`, which removes the timer and retains refreshes on focus and visibility changes. However, Vercel still reports production deployment `dpl_6XLuM4M6jHYVThBAwSmdY6pdd4uz` at commit `197ff30706e0243a4f4e001104e1306a09969c94`, created October 29. The sampled production app therefore still runs the polling version. Deploying a build that includes `0e9dee4` and reloading existing browser tabs are necessary before validating the mitigation. This investigation did not deploy the application.

The [sanitized evidence](./vercel-origin-transfer-evidence.json) contains daily byte counts, invocation counts, deployment references, and an aggregate request sample. Credentials, IP addresses, user agents, and note contents are excluded. All dates below use UTC; usage uses decimal GB, and November 6 is a partial day ending at 18:00 UTC.

| UTC date   | Fast Origin Transfer, both directions | Page-function invocations | Middleware invocations |
| ---------- | ------------------------------------: | ------------------------: | ---------------------: |
| October 13 |                           0.000811 GB |                        34 |                     83 |
| October 15 |                              1.255 GB |                    22,051 |                 21,399 |
| October 20 |                              2.731 GB |                    47,595 |                 47,625 |
| October 30 |                              5.212 GB |                    88,005 |                 88,023 |
| November 5 |                              6.081 GB |                    92,310 |                 92,562 |

On November 5, origin transfer consisted of 5,331,274,405 outgoing bytes and 749,793,153 incoming bytes. Fast Origin Transfer includes both directions between Vercel's CDN and Compute; it is separate from CDN-to-browser Fast Data Transfer. These figures come from the `fast_origin_transfer` usage metric rather than the legacy bandwidth fields.

The refresh change aligns with the onset of the increase:

- Commit `5fac0ae` introduced a three-second refresh, plus focus and visibility listeners. Its production deployment was created on October 15 at 05:31:43 UTC, corresponding to October 14 at 23:31 in Mexico City.
- Commit `9a9d426` changed the interval from 3,000 ms to 1,000 ms. Its production deployment was created on October 17 at 21:14:11 UTC. This triples scheduled refresh attempts for the same visible time, subject to browser scheduling and request completion.
- [The deployed dashboard layout](https://github.com/Unicomet/memo-drive/blob/197ff30706e0243a4f4e001104e1306a09969c94/src/app/dashboard/layout.tsx) calls `router.refresh()` while the document is visible. It does not check whether data changed and does not pause merely because the user is idle. The current checkout has since removed its interval.
- [The notes page](../src/app/dashboard/notes/page.tsx) reloads notes and passes them to `NotesBoard` as `initialNotes`. [The database query](../src/server/db/queries.ts) selects every column of every note owned by the user, including descriptions and image metadata, without a version check, pagination, or a changed-since filter.
- [The middleware](../src/middleware.ts) protects dashboard requests. Usage grouped by invocation cause shows nearly one middleware execution and one page-function execution for each CDN request during the high-traffic days.

The current request sample covers November 6, 18:36:54–18:46:54 UTC, with no remaining pagination. Of 688 requests, 680 (98.84%) were GET requests to `/dashboard/notes.rsc`; seven were to `/i/v0/e` and one to `/dashboard/notes`. All returned HTTP 200 and cache `MISS`. The median interval between notes requests was 0.999 seconds. A smaller preceding sample independently showed 120 consecutive notes RSC requests at a median interval of 1.000 seconds.

This explains why unchanged human behavior can still produce much higher transfer: requests now run on a timer, and each request returns the notes collection. The amount transferred depends on visible dashboard time, overlapping tabs or devices, and the size of the collection. Nearly 86,400 page-function invocations on November 1 are consistent with about one refresh per second sustained for a day. This is an inference from aggregate counts, not a measurement of one tab's lifetime. Historical note-size changes and the number of concurrent tabs were not measured.

The existing timer-removal commit is an immediate mitigation once deployed. If periodic synchronization is needed again, poll a small account-specific revision or use change notifications, then fetch notes only when their revision changes. That can retain fast synchronization without repeatedly transferring unchanged note contents. Private notes must retain account ownership checks.

The sampled traffic directly establishes the polling behavior. Daily byte totals are project-wide, so they do not attribute every historical byte to a route or exclude occasional file downloads, analytics requests, or bots. Vercel's aggregate route-level metrics query returned `402 plan_upgrade_required` on the Hobby plan; raw request records and usage totals were still accessible. No plan upgrade was made.

The stored measurements can be checked without credentials:

```sh
python - <<'PY'
import json
from pathlib import Path
d = json.loads(Path('docs/vercel-origin-transfer-evidence.json').read_text())
r = next(x for x in d['daily'] if x['date'] == '2026-11-05')
assert r['origin_out_bytes'] + r['origin_in_bytes'] == 6081067558
s = d['request_sample']
assert not s['pagination_has_more']
assert s['notes_rsc_requests'] / s['total_requests'] > 0.95
assert 0.9 < s['notes_rsc_median_gap_seconds'] < 1.1
print('Confirmed: transfer spike and dominant one-second notes polling')
PY
```

References: [Next.js `router.refresh()` behavior](https://nextjs.org/docs/app/api-reference/functions/use-router), [Vercel CDN usage and Fast Origin Transfer](https://vercel.com/docs/manage-cdn-usage), and [Vercel CLI request-log query source](https://github.com/vercel/vercel/blob/main/packages/cli/src/commands/logs/sources.ts). Measurements used `POST /v1/usage-metrics/query` with a project filter and `POST /v1/observability/events` with the `vercel.proxy_response` event. The usage endpoint is a dashboard API and may change.
