/**
 * The bcrypt work factor for newly written passwords.
 *
 * ── Why this is its own module ─────────────────────────────────────────────
 *
 * It belongs conceptually in `better-auth.ts`, beside the hash/verify hooks it
 * configures. It cannot live there: `bootstrap.ts` needs it too, and
 * `kysely-db.ts` imports `bootstrap.ts` while `better-auth.ts` imports
 * `kysely-db.ts` through `db/config`. Exporting it from `better-auth.ts` closes
 * that loop, and a circular import does not fail loudly — it resolves to
 * `undefined`, which makes the cost `NaN`, which bcrypt rejects at the moment
 * somebody tries to sign up.
 *
 * So it sits in a leaf module that imports nothing.
 *
 * ── Why 12 ─────────────────────────────────────────────────────────────────
 *
 * It was 10 at all eight call sites, which has been the library default since
 * 2010 and is low for 2026 hardware. `bcrypt.compare` reads the cost out of the
 * hash it is given, so every password already stored at 10 keeps verifying and
 * only new or changed ones are written at 12 — there is no migration and
 * nothing to coordinate.
 *
 * `BCRYPT_COST` is configurable because the right number depends on the
 * machine, and because a test suite that hashes a password per fixture should
 * not pay for production's margin.
 */
export const BCRYPT_COST = Number(process.env.BCRYPT_COST ?? 12);
