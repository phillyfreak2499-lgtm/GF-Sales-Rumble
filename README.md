# Waterman Rumble

A shared sales wrestling circuit for every Waterman / Good Feet store. **One site. One locker. Every store marks the scores.**

The floor fills the cards. The commissioner locks the week. Brackets, drops, and gazette write-ups run themselves.

Built for Period 10 — five weeks, three floors (Main Event, Redemption, Royal Rumble), unlimited roster.

**Live scoring needs one deployed copy of this repo.** Do not give each store its own clone-and-run — they would each get a separate locker. Deploy once (Vercel + Postgres), then send every store the same URL.

Repo: [github.com/phillyfreak2499-lgtm/GF-Sales-Rumble](https://github.com/phillyfreak2499-lgtm/GF-Sales-Rumble)

## Who uses it

| Who | What they do | Password |
| --- | --- | --- |
| Any store / anyone on the floor | Open **Score** and mark Green / Blue / Orange / Red | None |
| Commissioner | Add people, seed, **lock** a week, close and advance | `cogs` |
| Guests | Read the card, bouts, locker, and gazette | None |

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
- Ties: greens, then blues, then reviews, then seed.

## How a period runs

1. Add the locker (already seeded with the Period 10 floor). New hires can be added any time — no cap. Before week 1 they join the main field; after the bell they drop into the rumble.
2. Seed them, or let last period’s numbers do it.
3. **Seed and open week 1.**
4. Every store fills the scoresheet all week. No login.
5. Commissioner **locks scores**, then **closes the week**. Winners stay. A loss drops one floor. The gazette writes itself.
6. Repeat through week 5. Each floor gets a champion.

## Deploy one shared site (all stores)

This is the production path. Local `npm run dev` is a demo locker that lives only on that machine.

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
6. Send every store the same URL. They open **Score** and mark cards. No password.
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
npm run build
```

## Commissioner password

Desk actions (add people, lock, advance, reset) require the password **`cogs`**. Change `DESK_PIN` in `src/lib/circuit/types.ts` before you go live if you want a different one.

## Project shape

```
src/routes/          pages — ring, card, bouts, locker, gazette, score, desk
src/lib/circuit/     scoring engine, copy, roster, gazette
src/lib/server/      board, lock, advance, seed
src/components/      arena chrome, scoresheet, bout posters
migrations/          SQL
```

## License

MIT. Waterman wordmark and store names remain their owners’.
