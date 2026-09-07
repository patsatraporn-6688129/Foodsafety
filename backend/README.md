# Backend setup (Supabase)

1. Create a project at https://supabase.com and open **Project Settings → API**.
2. Copy the **Project URL** and **anon / publishable key**.
3. In the project root, create a file named `.env` (same folder as `package.json`):

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key-here
   ```

   Never commit `.env` or use the `service_role` / `Secret key` here — only the
   `anon` / `Publishable key`.

4. Install the client library:

   ```
   npm install
   ```

   (`@supabase/supabase-js` is already listed in `package.json`.)

5. Open **SQL Editor** in the Supabase dashboard, paste the entire contents of
   `supabase-schema.sql` in this folder, **as its own Run (don't paste other
   files in alongside it — see the note at the bottom)**, and click **Run**.
   This creates:
   - `users` — player profile, auto-filled on sign up
   - `game_progress` — best score/stars per player per level (drives Level Select)
   - `game_history` — a row logged every time a level finishes
   - `submit_level_result(...)` — one RPC call the game uses to save all of the
     above at once (already wired into `src/App.jsx`'s `finish()`)

6. **Coin wallet.** Open **SQL Editor**, paste the contents of
   `coin-wallet.sql`, and click **Run**. This adds `coins` to `users` (skips
   it if `supabase-schema.sql` already created the column) plus
   `add_coins(...)` / `spend_coins(...)`, the two RPCs `src/lib/wallet.js`
   calls. Coins used to live in `localStorage`; this migration moves them
   onto the server so a balance follows the player across devices and can't
   be edited by hand in devtools.

7. **Mid-level snapshot.** Paste `game-snapshot.sql` and Run. Creates
   `game_snapshot` (one row per user) so a level in progress can resume on
   a different device — see `src/lib/progress.js`.

8. **Daily Mystery Box.** Paste `daily-mystery-box.sql` and Run. Creates
   `daily_mystery_claims` + `claim_daily_mystery_box()`.

9. **Achievements.** Paste `achievements.sql` and Run. Creates
   `achievements` / `user_achievements` (`required_level`-based). This file
   `drop`s and recreates both tables on purpose — safe to run any time,
   since nothing in the UI reads from them yet (`getMyAchievements()` in
   `src/lib/progress.js` is defined but not called anywhere; Rewards/Profile
   currently render static mock data instead).

10. Restart the dev server after creating/editing `.env`:

    ```
    npm run dev
    ```

**Run each `.sql` file on its own, one "Run" click per file — not all pasted
together.** The SQL Editor runs everything you paste as a single transaction:
if any one statement in the middle errors (e.g. "relation already exists"
from re-running a non-idempotent `CREATE TABLE`), *everything* in that same
paste is silently rolled back, including unrelated statements from other
files you pasted alongside it. That's the most common cause of a table or
RPC "existing" in one file but still 403'ing / not-found in the app —
something earlier in the same paste failed first.

The app is gated behind `src/components` auth in `App.jsx`'s `Auth` component —
players must sign up / log in before they can play, and every finished level is
saved to their account automatically.
