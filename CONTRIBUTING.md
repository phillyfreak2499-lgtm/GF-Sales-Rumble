# Contributing

This is the shared Period 10 locker for every Waterman / Good Feet store. One site, one database.

## Everyday use (not a code change)

Stores do **not** need to clone this repo to score. Open the live site → **Score** → mark Green / Blue / Orange / Red → Save sheet. No login.

Commissioner work (add a hire, lock a week, close a week) happens on **Desk** with the password.

## Code changes

1. Fork or branch from `main`.
2. `npm install` then `npm run dev`.
3. Keep scoring open to anyone when the week is `open`. Do not put a password on the scoresheet.
4. Desk / lock / seed / advance stay behind the `DESK_PIN` env var. Set it in your local `.env` (see `.env.example`) — with none set, desk actions are disabled.
5. `npm run typecheck` before you open a pull request.

## Shared production locker

Set `DATABASE_URL` to the **same** Postgres the live site uses. A local PGLite run is a throwaway demo locker and will not show up for other stores.
