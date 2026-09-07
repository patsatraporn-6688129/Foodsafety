import { supabase } from './supabaseClient.js'

// ---------------------------------------------------------------------------
// getMyAchievements — every achievement this player has unlocked, joined
// with the achievements table for its display info (title/description/icon).
// Requires the `achievements` + `user_achievements` tables (see
// backend/supabase-schema.sql).
// ---------------------------------------------------------------------------
export async function getMyAchievements(userId) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at, achievements(title, description, icon)')
    .eq('user_id', userId)

  if (error) {
    console.error('Could not load achievements:', error.message)
    return []
  }
  return data // list of unlocked achievements with their details
}

// ---------------------------------------------------------------------------
// getLastPlayedLevel — the level the player should resume at: the lowest
// unlocked level they haven't earned a star on yet. Falls back to level 1
// for brand-new players (or if anything goes wrong).
// ---------------------------------------------------------------------------
export async function getLastPlayedLevel(userId) {
  const { data, error } = await supabase
    .from('game_progress')
    .select('level')
    .eq('user_id', userId)
    .eq('unlocked', true)
    .eq('best_stars', 0) // ยังไม่เคยได้ดาวเลย = ยังไม่ผ่าน
    .order('level', { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    return 1 // ถ้าไม่เจอเลย (ผู้เล่นใหม่) ให้เริ่มที่เลเวล 1
  }
  return data.level
}

// ---------------------------------------------------------------------------
// Mid-level snapshot — save/restore ความคืบหน้า "ระหว่างเล่นเลเวล" ลง
// localStorage เพื่อกันข้อมูลหายถ้าปิดแอปกะทันหัน (ปิดแท็บ, สลับแอป,
// แบตหมด, refresh) ก่อนกด Check Answers. ไม่เกี่ยวกับ game_progress /
// game_history บน Supabase ซึ่งเก็บเฉพาะผลลัพธ์เมื่อเลเวล "จบแล้ว" เท่านั้น.
// ---------------------------------------------------------------------------
const SNAPSHOT_KEY = 'fridge_master_snapshot_v1'
const SNAPSHOT_VERSION = 1
const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 ชม. — เกินนี้ถือว่าเก่าเกินจะ resume ให้

// เรียกระหว่างเล่น (screen === 'game') ทุกครั้งที่ state สำคัญเปลี่ยน
export function saveSnapshot(userId, snapshot) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
      version: SNAPSHOT_VERSION,
      userId: userId ?? null,
      timestamp: Date.now(),
      ...snapshot, // level, difficulty, currentItems, placements, timeLeft, hintsUsed, total, selectedId
    }))
  } catch (e) {
    console.error('saveSnapshot failed:', e)
  }
}

// เรียกตอนเปิดแอป (หลัง auth resolve แล้ว) เพื่อเช็คว่ามีเลเวลค้างอยู่ไหม
// คืนค่า snapshot พร้อม flag `expired` แทนที่จะทิ้งไปเลยเมื่อเกินอายุ —
// เพราะถึงจะเกิน 24 ชม. เราก็ยังอยากรู้ "เลเวลที่ค้างไว้คือเลเวลอะไร"
// เพื่อพาไปเริ่มเลเวลนั้นใหม่ (ไม่ใช่ปล่อยให้หลุดไปเลเวลอื่นที่ผิด)
export function loadSnapshot(userId) {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const snap = JSON.parse(raw)
    if (snap.version !== SNAPSHOT_VERSION) return null
    if (snap.userId !== (userId ?? null)) return null // กันดึง snapshot ข้าม account กัน
    const expired = Date.now() - snap.timestamp > SNAPSHOT_MAX_AGE_MS
    return { ...snap, expired }
  } catch (e) {
    console.error('loadSnapshot failed:', e)
    return null
  }
}

// เรียกตอนเลเวลจบแล้ว (ผ่านหรือ time up ก็ตาม) เพื่อล้าง snapshot ทิ้ง
export function clearSnapshot() {
  try { localStorage.removeItem(SNAPSHOT_KEY) } catch {}
}

// ---------------------------------------------------------------------------
// Remote mid-level snapshot (Supabase) — mirrors the localStorage snapshot
// above so resuming works ACROSS DEVICES too (close on phone, resume on
// laptop). Table: public.game_snapshot, ONE row per user, overwritten
// (upserted) every push — see backend/game-snapshot.sql for the schema +
// RLS policies. Requires login (guest/no-session players stay local-only,
// since there's no account to attach a cross-device row to).
//
// Kept deliberately separate from saveSnapshot/loadSnapshot (local): the
// local write is cheap and fires on every placement, but a network write on
// every placement would be wasteful — so the remote push is only called
// from App.jsx's "forceSave" (tab hidden / app closed), not the frequent
// per-change effect. One row per user means this never grows the database
// no matter how often someone plays — just a few KB, always overwritten.
// ---------------------------------------------------------------------------
export async function pushSnapshotRemote(userId, snapshot) {
  if (!userId) return
  try {
    const { error } = await supabase.from('game_snapshot').upsert({
      user_id: userId,
      level: snapshot.level,
      difficulty: snapshot.difficulty,
      current_items: snapshot.currentItems,
      placements: snapshot.placements,
      time_left: snapshot.timeLeft,
      hints_used: snapshot.hintsUsed,
      total: snapshot.total,
      selected_id: snapshot.selectedId ?? null,
      score_x2: snapshot.scoreX2 ?? false,
      free_hints: snapshot.freeHints ?? 0,
      updated_at: new Date().toISOString(),
    })
    if (error) console.error('pushSnapshotRemote failed:', error.message)
  } catch (e) {
    console.error('pushSnapshotRemote failed:', e)
  }
}

// เรียกตอนเปิดแอป (หลัง auth resolve แล้ว) — คู่กับ loadSnapshot(local) เพื่อ
// เทียบกันว่าอันไหนใหม่กว่า (ผู้เล่นอาจเล่นค้างจากเครื่องอื่นล่าสุด)
export async function pullSnapshotRemote(userId) {
  if (!userId) return null
  try {
    const { data, error } = await supabase
      .from('game_snapshot')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error || !data) return null
    const timestamp = new Date(data.updated_at).getTime()
    const expired = Date.now() - timestamp > SNAPSHOT_MAX_AGE_MS
    return {
      version: SNAPSHOT_VERSION,
      userId,
      timestamp,
      level: data.level,
      difficulty: data.difficulty,
      currentItems: data.current_items,
      placements: data.placements,
      timeLeft: data.time_left,
      hintsUsed: data.hints_used,
      total: data.total,
      selectedId: data.selected_id,
      scoreX2: data.score_x2,
      freeHints: data.free_hints,
      expired,
    }
  } catch (e) {
    console.error('pullSnapshotRemote failed:', e)
    return null
  }
}

// เรียกตอนเลเวลจบแล้ว หรือผู้เล่นเลือก "Restart" แทน "Continue" — ล้าง
// snapshot ฝั่งเซิร์ฟเวอร์ด้วย ไม่งั้นเครื่องอื่นจะยังดึงเลเวลเก่ากลับมา
export async function clearSnapshotRemote(userId) {
  if (!userId) return
  try {
    const { error } = await supabase.from('game_snapshot').delete().eq('user_id', userId)
    if (error) console.error('clearSnapshotRemote failed:', error.message)
  } catch (e) {
    console.error('clearSnapshotRemote failed:', e)
  }
}

// เทียบ snapshot สองอัน (local vs remote) แล้วคืนอันที่ "ใหม่กว่า" — ถ้ามี
// แค่อันเดียวก็คืนอันนั้นไปเลย เผื่อกรณีเล่นเครื่องเดิม (local ใหม่กว่าเสมอ
// เพราะ save ถี่กว่า) หรือเปลี่ยนเครื่อง (remote ใหม่กว่า)
export function pickFreshestSnapshot(local, remote) {
  if (!local) return remote
  if (!remote) return local
  return remote.timestamp > local.timestamp ? remote : local
}
