// ---------------------------------------------------------------------------
// Coin wallet — a currency SEPARATE from stars, earned by finishing levels.
//
//   Coins earned = Final Score ÷ 10   (see App.jsx `finish()`)
//   Final Score already has the win-streak multiplier AND the "Score x2"
//   power-up baked in, so nothing extra needs to happen here — just store
//   whatever number `finish()` hands us.
//
// Lives in public.users.coins on Supabase now (see backend/coin-wallet.sql
// for the migration + the add_coins/spend_coins RPCs this file calls) —
// no more localStorage. The game is gated behind login (see App.jsx's
// Auth screen), so there's always a real, signed-in user id by the time
// any of these are called; every function is a no-op / returns a zero
// balance if `userId` is falsy just as a defensive fallback.
// ---------------------------------------------------------------------------

import { supabase } from './supabaseClient.js'

// Reads the current balance straight from the users table.
export async function getCoins(userId) {
  if (!userId) return 0
  const { data, error } = await supabase
    .from('users')
    .select('coins')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('Could not load coins:', error.message)
    return 0
  }
  return data?.coins ?? 0
}

export async function addCoins(userId, amount) {
  console.log('[addCoins] called with', { userId, amount })
  if (!userId || !amount) {
    console.warn('[addCoins] SKIPPED — userId or amount falsy', { userId, amount })
    return getCoins(userId)
  }
  const { data, error } = await supabase.rpc('add_coins', { p_amount: amount })
  console.log('[addCoins] rpc result', { data, error })
  if (error) {
    console.error('Could not add coins:', error.message, error)
    return getCoins(userId)
  }
  return data ?? 0
}
// Debits coins for a purchase. Returns { ok, balance } — `ok` is false (and
// nothing is deducted) if the player can't afford it.
export async function spendCoins(userId, amount) {
  if (!userId || amount <= 0) return { ok: false, balance: await getCoins(userId) }
  const { data, error } = await supabase.rpc('spend_coins', { p_amount: amount })
  if (error) {
    console.error('Could not spend coins:', error.message)
    return { ok: false, balance: await getCoins(userId) }
  }
  const row = Array.isArray(data) ? data[0] : data
  return { ok: !!row?.ok, balance: row?.balance ?? 0 }
}
