// ---------------------------------------------------------------------------
// Daily Mystery Box — thin wrapper around the backend in
// backend/daily-mystery-box.sql. Unlike the old localStorage version, the
// 24h wait AND the reward roll both happen on the server (claimant can't
// edit their own clock or peek at the odds), so this file only ever reads
// what the server says.
// ---------------------------------------------------------------------------

import { supabase } from './supabaseClient.js'

// Read-only: where does this player's box currently stand? Safe to call as
// often as needed (e.g. every time the Rewards screen mounts) — it's a
// plain select against a row only the player themself can see (RLS).
// Returns { lastClaimedAt: Date|null, ready: boolean }.
export async function getMysteryBoxStatus() {
  const { data, error } = await supabase
    .from('daily_mystery_claims')
    .select('last_claimed_at')
    .maybeSingle()

  if (error) {
    console.error('Could not read mystery box status:', error.message)
    return { lastClaimedAt: null, ready: true } // fail open — never lock a player out over a network blip
  }
  if (!data) return { lastClaimedAt: null, ready: true } // never claimed → ready now
  const lastClaimedAt = new Date(data.last_claimed_at)
  const ready = Date.now() - lastClaimedAt.getTime() >= 24 * 60 * 60 * 1000
  return { lastClaimedAt, ready }
}

// Mutating: actually open the box. The server re-checks the 24h gate on
// its own clock regardless of what the client believes, so this is safe to
// call optimistically — `ok: false` just means it wasn't ready after all.
// Returns { ok, rewardType: 'hint'|'multiplier'|null, rewardAmount, nextAvailableAt }.
export async function claimMysteryBox() {
  const { data, error } = await supabase.rpc('claim_daily_mystery_box')
  if (error) {
    console.error('Could not claim mystery box:', error.message)
    return { ok: false, rewardType: null, rewardAmount: 0, nextAvailableAt: null }
  }
  const row = Array.isArray(data) ? data[0] : data
  return {
    ok: !!row?.ok,
    rewardType: row?.reward_type ?? null,
    rewardAmount: row?.reward_amount ?? 0,
    nextAvailableAt: row?.next_available_at ? new Date(row.next_available_at) : null,
  }
}
