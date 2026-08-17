# Waterman Rumble

A shared sales wrestling circuit for every Waterman / Good Feet store. One site. One locker room. The floor marks the scores. The commissioner locks the week. Brackets, drops, and gazette write-ups run themselves.

Built for Period 10 — five weeks, three floors (Main Event, Redemption, Royal Rumble), unlimited roster.

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

## Run it locally

```bash
npm install
npm run dev
```

The app listens on `0.0.0.0:8080`. Data lives in PGLite (no Postgres required for a single-store demo). Point `DATABASE_URL` at Postgres if you want a shared production database.

```bash
npm run typecheck
npm run build
```

Production build targets Vercel (`nitro` preset). Set auth secrets in the host environment — never commit them.

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
