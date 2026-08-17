# Waterman Rumble

A shared sales wrestling circuit for every Waterman / Good Feet store. **One site. One locker room per store. Live scores. Automatic brackets.**

The floor fills the cards. The commissioner locks the week. Brackets, drops, gazette write-ups, and reseeding run themselves.

Built for Period 10 — four weeks, three floors (Main Event, Redemption, Royal Rumble), unlimited roster.

**Live scoring needs one deployed copy of this repo.** Do not give each store its own clone-and-run — they would each get a separate locker. Deploy once (Vercel + Postgres), then send every store the same URL.

Repo: [github.com/phillyfreak2499-lgtm/GF-Sales-Rumble](https://github.com/phillyfreak2499-lgtm/GF-Sales-Rumble)

## Who uses it

| Who | What they do | Password |
| --- | --- | --- |
| Specialists | Open **Locker**, enter their passcode, mark the card, play academy and floor games | Personal passcode |
| Any store | Open locker rooms, read the card, bouts, and gazette | None to browse |
| Commissioner | Add / remove people, seed, lock a week, house calls, theme | `cogs` (desk) |

Every passcode lives on the **Desk → Codes** tab.

## Scoring

Five metrics (rename them on the desk):

1. Sales volume
2. Average ticket
3. Conversion
4. Follow-up close
5. New guests

| Color | Points |
| --- | --- |
| Green | 3 |
| Blue | 2 |
| Orange | 1 |
| Red | 0 |

- Each extra green after the first is **+1** (two greens = +1 bonus, three = +2, …).
- **Every metric green** is an automatic win that week.
- Named 5-star reviews are +1 each, three max.
- Pass one academy film this week for +1.
- Ties: greens, then blues, then reviews, then seed. Weekly reseeding uses total points, then stars, then socks sold.

## How a period runs

1. Add the locker (Period 10 floor is seeded). New hires can be added any time — no cap.
2. Seed them, or let last period’s numbers do it.
3. **Seed and open week 1.**
4. Each specialist marks their card with their passcode. When everyone is locked in, the week can auto-advance.
5. Highest seed gets the bye if the field is odd. Highest vs lowest pairing.
6. A loss drops one floor. The gazette writes itself.
7. Repeat through week 4. Each floor gets a champion.

## Deploy one shared site (all stores)

This is the production path. Local `npm run dev` is a demo locker that lives only on that machine.

### Render (this form)

Connect the GitHub repo `phillyfreak2499-lgtm/GF-Sales-Rumble`.

| Field | What to type |
| --- | --- |
| Name | `gf-rumble` |
| Project | GF Rumble |
| Environment | Production |
| Language | Node |
| Branch | `main` |
| Region | Oregon (US West) |
| Root Directory | leave blank |
| Build Command | `npm run build` |
| Start Command | `node .output/server/index.mjs` |
| Instance | Free to try. **Starter ($7)** so it does not sleep during the 4-week rumble. |

Add a **PostgreSQL** database on Render in Oregon first. Then add these environment variables:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Internal Database URL from that Postgres |
| `BETTER_AUTH_SECRET` | Click Generate, or paste a long random string |
| `BETTER_AUTH_URL` | `https://thewatermangames.live` (no trailing slash) |
| `VITE_PUBLIC_HOSTNAME` | `thewatermangames.live` (host only) |
| `NODE_VERSION` | `22` |
| `NITRO_HOST` | `0.0.0.0` |
| `NPM_CONFIG_PRODUCTION` | `false` |

Without `DATABASE_URL` the locker empties on every restart. Do not skip the database.

### Point thewatermangames.live at Render

Ignore **Edit Website** / **Publish Site** on the GoDaddy builder. That rafting page is not the rumble.

1. Finish the Render web service first (`gf-rumble` or whatever you named it).
2. On Render: **Settings → Custom Domains → Add** `thewatermangames.live`.
3. On GoDaddy: open the **domain** (not the website builder) → **DNS**.
4. Delete any old **A**, **CNAME**, **AAAA**, or forwarding records for `@` and `www`.
5. Add:

   | Type | Name / Host | Value |
   | --- | --- | --- |
   | A | `@` | `216.24.57.1` |
   | CNAME | `www` | `gf-rumble.onrender.com` (your Render URL, no https) |

6. Back on Render, click **Verify**. Wait a few minutes. HTTPS is automatic.
7. Set `BETTER_AUTH_URL` and `VITE_PUBLIC_HOSTNAME` as above, then **Manual Deploy** so they take effect.



1. Fork or clone this repo.
2. Create a Postgres database (Neon is the usual match — any `postgres://` URL works).
3. Import the repo on [Vercel](https://vercel.com). Framework: Vite. Build command: `npm run build`.
4. Set these environment variables on the project:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | The Postgres URL (pooled is fine) |
   | `BETTER_AUTH_SECRET` | A long random string |
   | `BETTER_AUTH_URL` | The live site URL, e.g. `https://your-app.vercel.app` |
   | `VITE_PUBLIC_HOSTNAME` | Host only, e.g. `your-app.vercel.app` |

5. Deploy. `npm run build` also runs `npm run db:migrate` and applies `migrations/`.
6. Send every store the same URL. Specialists open **Locker** with their passcode.
7. Change `DESK_PIN` in `src/lib/circuit/types.ts` before go-live if you do not want `cogs`.

Without `DATABASE_URL`, the app falls back to an in-memory PGLite database. That is fine for a local demo and **not** fine for a shared production locker — each serverless instance would forget the scores.

## Run it locally

```bash
npm install
npm run dev
```

The app listens on `0.0.0.0:8080`. Data lives in PGLite unless `DATABASE_URL` is set.

```bash
npm run typecheck
npm run test
npm run build
```

## Commissioner password

Desk actions (add people, lock, advance, reset) require the password **`cogs`**. Change `DESK_PIN` in `src/lib/circuit/types.ts` before you go live if you want a different one.

## Project shape

```
src/routes/          pages — ring, card, bouts, locker rooms, gazette, score, desk, how
src/lib/circuit/     scoring engine, academy, floor games, reseeding
src/lib/server/      board, lock, advance, seed
src/components/      arena chrome, locker, scoresheet
public/games/        standalone floor training games
migrations/          SQL
```

## License

MIT. Waterman wordmark and store names remain their owners’.
