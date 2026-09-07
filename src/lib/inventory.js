// ---------------------------------------------------------------------------
// Item inventory — durable "buy it now, use it whenever you want" power-ups.
// Lives in public.users.inv_time / inv_hint / inv_multiplier on Supabase
// (see backend/item-inventory.sql for the migration + the buy_item /
// use_item / grant_item RPCs this file calls), the same pattern already
// used by src/lib/wallet.js for coins.
//
// Replaces the old "pendingBoosts" object in App.jsx, which only lived in
// memory and got auto-consumed by whatever level started next. Now a
// purchase (Shop) or a Daily Mystery Box win just increments a count here,
// and the player explicitly taps an item (in-game, next to the Hint
// button) to spend one and apply its effect to the level they're
// currently playing.
// ---------------------------------------------------------------------------

import { supabase } from './supabaseClient.js'

const EMPTY = { time: 0, hint: 0, multiplier: 0 }

// Reads the current inventory straight from the users table.
export async function getInventory(userId) {
  if (!userId) return { ...EMPTY }
  const { data, error } = await supabase
    .from('users')
    .select('inv_time, inv_hint, inv_multiplier')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('Could not load inventory:', error.message)
    return { ...EMPTY }
  }
  return {
    time: data?.inv_time ?? 0,
    hint: data?.inv_hint ?? 0,
    multiplier: data?.inv_multiplier ?? 0,
  }
}

// Spends coins for a Shop purchase AND credits the matching inventory item,
// atomically on the server. Returns { ok, balance, qty } — `ok` is false
// (nothing deducted or granted) if the player can't afford it.
export async function buyItem(userId, itemId, cost) {
  if (!userId) return { ok: false, balance: 0, qty: 0 }
  const { data, error } = await supabase.rpc('buy_item', { p_item: itemId, p_cost: cost })
  if (error) {
    console.error('Could not buy item:', error.message)
    return { ok: false, balance: 0, qty: 0 }
  }
  const row = Array.isArray(data) ? data[0] : data
  return { ok: !!row?.ok, balance: row?.balance ?? 0, qty: row?.qty ?? 0 }
}

// Spends ONE unit from the player's own inventory to activate it in the
// level currently being played. Returns { ok, qty } — `ok` is false if
// they had none left (caller shouldn't have been able to tap it, but the
// server is the source of truth either way).
export async function useItem(userId, itemId) {
  if (!userId) return { ok: false, qty: 0 }
  const { data, error } = await supabase.rpc('use_item', { p_item: itemId })
  if (error) {
    console.error('Could not use item:', error.message)
    return { ok: false, qty: 0 }
  }
  const row = Array.isArray(data) ? data[0] : data
  return { ok: !!row?.ok, qty: row?.qty ?? 0 }
}

// Credits inventory from a non-purchase source (Daily Mystery Box win).
// Returns the new total for that item.
export async function grantItem(userId, itemId, amount) {
  if (!userId || !amount) return null
  const { data, error } = await supabase.rpc('grant_item', { p_item: itemId, p_amount: amount })
  if (error) {
    console.error('Could not grant item:', error.message)
    return null
  }
  return data ?? 0
}
