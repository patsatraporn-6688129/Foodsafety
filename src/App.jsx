import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import supermarketImg from './assets/supermarket.png'
import {
  TIPS, LEVEL_SETS, DEFAULT_LEVEL_SET, DIFFICULTY_POOLS, pickRandomItems,
  LEVEL_TIME, CORRECT_POINTS, WRONG_POINTS,
  TIME_FINISH_BONUS, HINT_PENALTY, PASS_THRESHOLD, START_SCORE,
  FRIDGE_IMG, REWARDS, PROFILE, SHOP,
} from './gameData.js'
import Fridge from './components/Fridge.jsx'
import Tray from './components/Tray.jsx'
import TableScene from './components/TableScene.jsx'
import QueueScene from './components/QueueScene.jsx'
import ZoomShelf from './components/ZoomShelf.jsx'
import AssemblyScene from './components/AssemblyScene.jsx'
import CuttingBoardScene from './components/CuttingBoardScene.jsx'
import Modal from './components/Modal.jsx'
import Settings from './components/Settings.jsx'
import Rewards from './components/Rewards.jsx'
import Shop from './components/Shop.jsx'
import LevelSelect from './components/LevelSelect.jsx'
import { supabase } from './lib/supabaseClient.js'
import * as audio from './lib/audio.js'
import {
  getLastPlayedLevel, saveSnapshot, loadSnapshot, clearSnapshot,
  pushSnapshotRemote, pullSnapshotRemote, clearSnapshotRemote, pickFreshestSnapshot,
} from './lib/progress.js'
import { getCoins, addCoins, spendCoins } from './lib/wallet.js'
import { getInventory, buyItem, useItem, grantItem } from './lib/inventory.js'


const SNAPSHOT_PUSH_INTERVAL_MS = 3000


// in src/data/levels/. Everything else falls back to DEFAULT_LEVEL_SET.
// Level 6 is "randomize"-type: its items are drawn fresh from category pools
// every call, scaled by the player's chosen skill tier (see DIFFICULTY_POOLS).
const itemsForLevel = (lvl, difficulty) => {
  const set = LEVEL_SETS[lvl] || DEFAULT_LEVEL_SET
  if (set.randomize) {
    const pools = DIFFICULTY_POOLS[difficulty] || set.randomize.pools
    return pickRandomItems(pools)
  }
  return set.items
}
const shelvesForLevel = (lvl) => (LEVEL_SETS[lvl] || DEFAULT_LEVEL_SET).shelves
const boardsForLevel = (lvl) => (LEVEL_SETS[lvl] || DEFAULT_LEVEL_SET).boards || null
const layoutForLevel = (lvl) => (LEVEL_SETS[lvl] || DEFAULT_LEVEL_SET).layout || 'tray'
// 'fridge-zoom' levels (Level 6) show the real fridge photo with every
// compartment locked except this single pseudo-shelf, which swaps in the
// "🔍 Click to zoom" prompt in place of items (see components/Fridge.jsx).
// It never holds a real item placement — the actual slots (pos-1..pos-5)
// only exist inside the zoomed-in <ZoomShelf> view.
const ZOOM_TRIGGER_SHELVES = [{
  id: 'zoomTop',
  name: '',
  zoomTrigger: true,
  // Matches Fridge.jsx's own default 'top' zone position — the top-left
  // shelf of the fridge photo.
  zone: { left: '4%', top: '1%', width: '44%', height: '16.5%' },
}]

// Is an item currently in the right place?
//  - Cutting-board level (Level 4): the item must sit on the board whose
//    colour matches it, AND that board must have been moved into the fridge.
//    Here `placements[itemId]` holds the boardId the item is on, and
//    `boardPlacements[boardId]` holds the fridge slot the board sits in.
//  - Normal levels: on its assigned shelf.
const isItemCorrect = (it, placements, boardPlacements) => {
  const where = placements[it.id]
  if (!where || where === 'trash') return false
  if (it.board) return where === it.board && boardPlacements[where] != null
  return where === it.shelf
}
const locksForLevel = (lvl) => (LEVEL_SETS[lvl] || DEFAULT_LEVEL_SET).locks || []
// Each level has its own Food Safety Tips (matched to what that level
// teaches); levels without a custom set (e.g. Level 6's randomize levels)
// fall back to the generic TIPS list from gameData.js.
const tipsForLevel = (lvl) => {
  const set = LEVEL_SETS[lvl] || DEFAULT_LEVEL_SET
  return set.tips && set.tips.length ? set.tips : TIPS
}
// Optional scripted intro screen shown before Tips (see data/levels/index.js).
// Most levels don't have one — this returns null for those.
const storyForLevel = (lvl) => (LEVEL_SETS[lvl] || DEFAULT_LEVEL_SET).story || null

const emptyPlacements = (items) =>
  items.reduce((acc, it) => ((acc[it.id] = null), acc), {})

// "Fix the mistakes" levels (e.g. Level 9) start every item already sitting
// in the fridge, deliberately in the wrong zone, instead of the usual empty
// tray. Falls back to null (tray) for any item the level doesn't mention.
const startPlacementsForLevel = (lvl) => (LEVEL_SETS[lvl] || DEFAULT_LEVEL_SET).startPlacements || null
const initialPlacementsFor = (lvl, items) => {
  const sp = startPlacementsForLevel(lvl)
  if (!sp) return emptyPlacements(items)
  return items.reduce((acc, it) => ((acc[it.id] = sp[it.id] ?? null), acc), {})
}

// A shelf is "complete" once every item that belongs on it has been placed
// there correctly.
const isShelfComplete = (shelf, items, placements) => {
  const shelfItems = items.filter((it) => it.shelf === shelf.id)
  if (shelfItems.length === 0) return true
  return shelfItems.every((it) => placements[it.id] === shelf.id)
}

// Shelves marked `locked: true` in gameData stay padlocked until every
// shelf before them has been sorted correctly.
const withLockState = (shelves, items, placements) => {
  let chainOpen = true
  return shelves.map((shelf) => {
    const locked = !!shelf.locked && !chainOpen
    chainOpen = chainOpen && isShelfComplete(shelf, items, placements)
    return { ...shelf, locked }
  })
}

export default function App() {
  // menu | tips | game | result | settings | rewards | levels
  const [screen, setScreen] = useState('menu')
  const [prevScreen, setPrevScreen] = useState('menu')
  const [level, setLevel] = useState(1)
  const [difficulty, setDifficulty] = useState(2) // 1 Fridge Freshies · 2 Kitchen Keeper · 3 Fridge Safety Masters
  const [total, setTotal] = useState(START_SCORE)
  const [currentItems, setCurrentItems] = useState(() => itemsForLevel(1, 2))
  const [placements, setPlacements] = useState(() => emptyPlacements(itemsForLevel(1, 2)))
  const [selectedId, setSelectedId] = useState(null)
  const [timeLeft, setTimeLeft] = useState(LEVEL_TIME)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [result, setResult] = useState(null) // { correct,total,score,levelScore,maxScore,passed,stars,netAdjust,reason }
  const [winStreak, setWinStreak] = useState(0) // consecutive levels passed → coin multiplier
  const [boardPlacements, setBoardPlacements] = useState({}) // cutting-board level: shelfId → boardId
  const [shelfZoomed, setShelfZoomed] = useState(false) // 'fridge-zoom' level (6): on the close-up shelf?
  const [settings, setSettings] = useState({
    music: 80, sfx: 65, tutorial: true, language: 'English',
  })

  // ----- Audio (background music + SFX) -----
  // Browsers block audio until a real user gesture happens, so we wait for
  // the very first click/tap anywhere in the app to unlock the AudioContext
  // and kick off the looping background track.
  useEffect(() => {
    const start = () => {
      audio.unlockAudio()
      audio.startMusic()
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
    window.addEventListener('pointerdown', start)
    window.addEventListener('keydown', start)
    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
  }, [])

  // Keep the audio engine's volumes in sync with the Settings sliders.
  useEffect(() => { audio.setMusicVolume(settings.music) }, [settings.music])
  useEffect(() => { audio.setSfxVolume(settings.sfx) }, [settings.sfx])

  // ----- Real Supabase auth (session-backed, replaces the old UI-only gate) -----
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup'

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)

      // มีเลเวลที่เล่นค้างไว้ของ user คนนี้ไหม? (ปิดแอปกะทันหันแล้วเปิดใหม่ —
      // อาจเป็นเครื่องเดิมหรือเครื่องอื่นก็ได้) เทียบทั้ง local (เครื่องนี้)
      // กับ remote (Supabase, ข้ามเครื่อง) แล้วใช้อันที่ใหม่กว่า แทนที่จะโยน
      // เข้าเกมพร้อมนับเวลาถอยหลังทันที ให้หยุดไว้ที่หน้า Pause ก่อน ให้
      // ผู้เล่นเป็นคนตัดสินใจเองว่าจะเล่นต่อ/เริ่มใหม่/กลับเมนู
      const userId = session?.user?.id ?? null
      const localSnap = loadSnapshot(userId)
      const remoteSnap = await pullSnapshotRemote(userId)
      const snap = pickFreshestSnapshot(localSnap, remoteSnap)
      if (snap) resumeFromSnapshot(snap, { paused: true })
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // ----- Hint (4.7) -----
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintShelfId, setHintShelfId] = useState(null)

  // ----- Coin wallet + power-ups (The Fresh Market) -----
  // Coins are a currency separate from stars, earned when a level finishes:
  //   coinsEarned = Final Score ÷ 10 (Final Score already includes the win-
  //   streak multiplier AND the Score x2 power-up — see finish() below).
  const [coins, setCoins] = useState(0)
  // Power-ups purchased from the in-game Boost button apply to the level
  // that's currently running. Power-ups bought from the main-menu Shop have
  // no level running yet, so they're "banked" here and get spent the moment
  // the next level starts (see startLevel()).
  const [scoreX2, setScoreX2] = useState(false)     // active this level
  const [freeHints, setFreeHints] = useState(0)     // Hint credits (no -5 penalty) left this level
  // Durable "buy now, use whenever" inventory — { time, hint, multiplier }
  // counts, backed by public.users on Supabase (see src/lib/inventory.js).
  // Replaces the old pendingBoosts bank, which only lived in memory and
  // got force-applied to whatever level started next.
  const [inventory, setInventory] = useState({ time: 0, hint: 0, multiplier: 0 })
  // Which inventory item (if any) is currently awaiting a use-confirm popup.
  const [confirmUseItem, setConfirmUseItem] = useState(null)

  useEffect(() => {
    let cancelled = false
    const userId = session?.user?.id ?? null
    getCoins(userId).then((c) => { if (!cancelled) setCoins(c) })
    getInventory(userId).then((inv) => { if (!cancelled) setInventory(inv) })
    return () => { cancelled = true }
  }, [session])

  // Buy a power-up from the Shop: spends coins and credits ONE unit into
  // the durable inventory (server does both atomically) — it does NOT
  // apply anywhere yet. The player taps it from their in-game inventory
  // row whenever they actually want to use it, in any level.
  const buyPowerup = async (item) => {
    const userId = session?.user?.id ?? null
    const { ok, balance, qty } = await buyItem(userId, item.id, item.coins)
    if (!ok) return false
    setCoins(balance)
    setInventory((inv) => ({ ...inv, [item.id]: qty }))
    audio.sfxPlace()
    return true
  }

  // Daily Mystery Box wins also land in the same durable inventory now
  // (instead of the old "applies to your next level" bank) — see
  // Rewards.jsx's onReward.
  const grantRewardItem = async (itemId, amount) => {
    const userId = session?.user?.id ?? null
    const qty = await grantItem(userId, itemId, amount)
    if (qty != null) setInventory((inv) => ({ ...inv, [itemId]: qty }))
  }

  // Asks for confirmation, then actually spends ONE unit from the
  // inventory and applies its effect to the level currently being played.
  const requestUseItem = (itemId) => setConfirmUseItem(itemId)
  const confirmUseItemNow = async () => {
    const itemId = confirmUseItem
    setConfirmUseItem(null)
    if (!itemId) return
    const userId = session?.user?.id ?? null
    const { ok, qty } = await useItem(userId, itemId)
    if (!ok) return
    setInventory((inv) => ({ ...inv, [itemId]: qty }))
    if (itemId === 'time') setTimeLeft((t) => t + 15)
    else if (itemId === 'hint') {
      // Reveal a hint for a still-unplaced item right away — no score penalty.
      const target = selectedId ? itemsById[selectedId] : trayItems[0]
      if (target) {
        setHintShelfId(target.shelf)
        setTimeout(() => setHintShelfId(null), 1800)
      }
    }
    else if (itemId === 'multiplier') setScoreX2(true)
    audio.sfxPlace()
  }

  const currentShelves = useMemo(() => shelvesForLevel(level), [level])
  const currentBoards = useMemo(() => boardsForLevel(level), [level])
  const currentLayout = useMemo(() => layoutForLevel(level), [level])
  const currentLocks = useMemo(() => locksForLevel(level), [level])
  const currentTips = useMemo(() => tipsForLevel(level), [level])
  const currentStory = useMemo(() => storyForLevel(level), [level])

  const itemsById = useMemo(
    () => Object.fromEntries(currentItems.map((i) => [i.id, i])),
    [currentItems]
  )

  const shelvesWithLock = useMemo(
    () => withLockState(currentShelves, currentItems, placements),
    [currentShelves, currentItems, placements]
  )

  const placedCount = Object.values(placements).filter(Boolean).length
  // Cutting-board level (Level 4) has a second phase: every board that's
  // holding at least one ingredient must also be carried into the fridge
  // before "Check Answers" should unlock — otherwise every item would score
  // as wrong just for its board still sitting on the table.
  const usedBoardIds = useMemo(
    () => (currentLayout === 'boards'
      ? [...new Set(Object.values(placements).filter(Boolean))]
      : []),
    [currentLayout, placements]
  )
  const boardsInFridgeCount = usedBoardIds.filter((bid) => boardPlacements[bid] != null).length
  const allBoardsInFridge = usedBoardIds.length === 0 || boardsInFridgeCount === usedBoardIds.length
  const allPlaced = placedCount === currentItems.length && allBoardsInFridge

  // Restores every piece of a mid-level snapshot back into state and drops
  // the player into the game. `paused` lets the caller decide whether to
  // land straight into play (Play button) or pop the Pause card so the
  // player consciously picks Resume / Restart / Menu (app-reopen case).
  const applySnapshot = (snap, { paused = false } = {}) => {
    setLevel(snap.level)
    setDifficulty(snap.difficulty)
    setCurrentItems(snap.currentItems)
    setPlacements(snap.placements)
    setTimeLeft(snap.timeLeft)
    setHintsUsed(snap.hintsUsed)
    setTotal(snap.total)
    setSelectedId(snap.selectedId ?? null)
    setScoreX2(snap.scoreX2 ?? false)
    setFreeHints(snap.freeHints ?? 0)
    // Resuming mid-way through the 'fridge-zoom' level (6): if they'd
    // already placed anything, drop them back into the zoomed shelf view
    // instead of the outer fridge they'd have to re-tap through.
    setShelfZoomed(Object.values(snap.placements || {}).some(Boolean))
    setRunning(true)
    setPaused(paused)
    setScreen('game')
  }

  // Handles a loaded snapshot either way: fresh enough → resume exactly
  // where they left off (placements, timeLeft, hints all intact). Too old
  // (SNAPSHOT_MAX_AGE_MS) → don't resurrect a stale countdown timer, but
  // still send them back to the SAME level with a full restart — never
  // fall back to level 1 just because the clock ran out on the snapshot.
  // `paused` is forwarded either way so both branches can land on the
  // Pause card when the caller wants the player to choose what's next.
  const resumeFromSnapshot = (snap, opts = {}) => {
    if (snap.expired) {
      startLevel(snap.level, snap.difficulty, opts)
    } else {
      applySnapshot(snap, opts)
    }
  }

  // Countdown timer
  useEffect(() => {
    if (!running || paused || timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running, paused, timeLeft])

  // ----- Save State: mid-level snapshot (กันข้อมูลหายถ้าปิดแอปกะทันหัน) -----
  // Save ลง localStorage ทุกครั้งที่ state สำคัญเปลี่ยนระหว่างเล่นอยู่
  useEffect(() => {
    if (screen !== 'game') return
    saveSnapshot(session?.user?.id ?? null, {
      level, difficulty, currentItems, placements,
      timeLeft, hintsUsed, total, selectedId, scoreX2, freeHints,
    })
  }, [screen, level, difficulty, currentItems, placements, timeLeft, hintsUsed, total, selectedId, session, scoreX2, freeHints])

  // บังคับ save ทันทีตอนสลับแท็บ/มินิไมซ์/ปิดแอป — ไม่รอ state เปลี่ยนรอบถัดไป
  // (ใช้ visibilitychange เป็นหลักเพราะเชื่อถือได้สุดบนมือถือ, pagehide เสริมกรณีปิดแท็บปกติ)
  // นี่คือจังหวะเดียวที่ยิง save ไป Supabase ด้วย (ไม่ใช่ทุกครั้งที่ state
  // เปลี่ยนแบบ local ด้านบน) เพื่อไม่ให้ยิง network request ถี่เกินไป —
  // local ยัง save บ่อยเหมือนเดิมเผื่อ refresh เครื่องเดิม, ส่วน remote
  // save เฉพาะตอนออกจากแอป/สลับแท็บ ก็เพียงพอให้ resume ข้ามเครื่องได้แล้ว
  useEffect(() => {
    const forceSave = () => {
      if (screen !== 'game') return
      const userId = session?.user?.id ?? null
      const snapshot = {
        level, difficulty, currentItems, placements,
        timeLeft, hintsUsed, total, selectedId, scoreX2, freeHints,
      }
      saveSnapshot(userId, snapshot)
      pushSnapshotRemote(userId, snapshot)
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') forceSave() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', forceSave)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', forceSave)
    }
  }, [screen, level, difficulty, currentItems, placements, timeLeft, hintsUsed, total, selectedId, session, scoreX2, freeHints])

  // ----- Periodic remote push (ทุก SNAPSHOT_PUSH_INTERVAL_MS ระหว่างเล่นจริงเท่านั้น) -----
  // เก็บ snapshot ล่าสุดไว้ใน ref ตลอดเวลา (ไม่ใช่ dependency ของ interval
  // effect) — ถ้าใส่ state พวกนี้เป็น deps ตรง ๆ, interval จะถูก reset ทุก
  // ครั้งที่ timeLeft เปลี่ยน (ทุกวินาที) แล้วไม่มีวันครบรอบสักที.
  // ผลคือ: interval ตั้งครั้งเดียวตอนเข้าเกม แต่ทุกครั้งที่มันทำงานจะอ่านค่า
  // "ล่าสุดจริง ๆ" จาก ref เสมอ ไม่ใช่ค่าค้างจากตอนตั้ง interval
  const latestSnapshotRef = useRef(null)
  useEffect(() => {
    latestSnapshotRef.current = {
      level, difficulty, currentItems, placements,
      timeLeft, hintsUsed, total, selectedId, scoreX2, freeHints,
    }
  }, [level, difficulty, currentItems, placements, timeLeft, hintsUsed, total, selectedId, scoreX2, freeHints])

  // เก็บ interval id ไว้นอก effect ด้วย (เพิ่มจาก effect cleanup ปกติ) เพื่อให้
  // finish() หยุด interval ได้ทันที "ก่อน" ลบ snapshot ฝั่ง remote แบบ
  // synchronous — กัน race ที่ interval อาจ push snapshot กลับขึ้นไปใหม่
  // หลังจากที่จบด่านแล้วลบทิ้งไปแล้ว (ปิดด่านไปแล้วแต่ดันมีค้างโผล่มาใหม่)
  const snapshotIntervalIdRef = useRef(null)
  useEffect(() => {
    // นับเฉพาะตอนกำลังเล่นอยู่จริง — ไม่ใช่ตอนอยู่หน้าเมนู/ผลลัพธ์/pause
    if (screen !== 'game' || paused) return
    const userId = session?.user?.id ?? null
    const id = setInterval(() => {
      if (latestSnapshotRef.current) pushSnapshotRemote(userId, latestSnapshotRef.current)
    }, SNAPSHOT_PUSH_INTERVAL_MS)
    snapshotIntervalIdRef.current = id
    return () => {
      clearInterval(id)
      if (snapshotIntervalIdRef.current === id) snapshotIntervalIdRef.current = null
    }
  }, [screen, paused, session])

  const finish = useCallback((reason) => {
    let correct = 0
    currentItems.forEach((it) => {
      if (isItemCorrect(it, placements, boardPlacements)) correct++
    })
    const wrong = currentItems.length - correct

    const maxScore = currentItems.length * CORRECT_POINTS
    const rawScore = correct * CORRECT_POINTS + wrong * WRONG_POINTS   // 4.1 + 4.4
    const finishBonus = reason === 'checked' ? TIME_FINISH_BONUS : 0    // 4.3 (finished by hitting Check, not forced by the clock)
    const hintPenalty = hintsUsed * HINT_PENALTY                        // 4.7 (already negative)
    const netAdjust = finishBonus + hintPenalty

    const levelScore = rawScore + netAdjust
    const passed = levelScore >= maxScore * PASS_THRESHOLD              // 4.6
    const perfect = correct === currentItems.length

    const stars = !passed ? 0 : perfect ? 3 : correct >= currentItems.length * 0.8 ? 2 : 1

    // Win-streak. Passing keeps the streak going; any miss resets it.
    // First win is x1.5, then grows by 0.5 each consecutive win (capped at x3).
    const newStreak = passed ? winStreak + 1 : 0
    setWinStreak(newStreak)
    const streakMult = passed ? Math.min(3, 1 + 0.5 * newStreak) : 1

    // ----- Currency (Coin) system -----
    // Final Score = Level Score × Streak Multiplier × Score-x2 power-up.
    // Coins earned = Final Score ÷ 10 — the Score x2 power-up doubles Final
    // Score first, which automatically doubles the coin payout too, so there's
    // no separate "x2 coins" branch to write.
    const powerupMult = scoreX2 ? 2 : 1
    const finalScore = Math.max(0, Math.round(levelScore * streakMult * powerupMult))
    const coinsEarned = passed ? Math.floor(finalScore / 10) : 0

    const newTotal = Math.max(0, total + finalScore)
    setTotal(newTotal)
    setRunning(false)

    if (coinsEarned > 0) {
      const userId = session?.user?.id ?? null
      addCoins(userId, coinsEarned).then(setCoins)
    }

    // Build the "what went wrong" list — every item not in its correct place.
    const shelfById = Object.fromEntries(currentShelves.map((s) => [s.id, s]))
    const boardById = currentBoards ? Object.fromEntries(currentBoards.map((b) => [b.id, b])) : {}
    const wrongItems = currentItems
      .filter((it) => !isItemCorrect(it, placements, boardPlacements))
      .map((it) => {
        if (it.board) {
          const b = boardById[it.board]
          return {
            id: it.id, label: it.label, img: it.img, shelf: it.board,
            shelfName: b?.name || '', shelfHint: b?.hint || '',
          }
        }
        const correct = shelfById[it.shelf]
        return {
          id: it.id, label: it.label, img: it.img, shelf: it.shelf,
          shelfName: correct?.name || '', shelfHint: correct?.hint || '',
        }
      })

    // A food-safety header for the feedback card, matched to whatever went wrong most.
    const THEME_BY_SHELF = {
      bottom: { title: 'Raw Food', sub: 'Keep away from cooked food' },
      middle: { title: 'Dairy & Eggs', sub: 'Keep them cool in the middle shelf' },
      top: { title: 'Cooked Food', sub: 'Store ready-to-eat food up top' },
    }
    const counts = {}
    wrongItems.forEach((w) => { counts[w.shelf] = (counts[w.shelf] || 0) + 1 })
    const topShelf = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
    const themeBase = THEME_BY_SHELF[topShelf] || { title: 'Food Safety', sub: 'Sort each item into its correct zone' }
    const themeImg = (wrongItems.find((w) => w.shelf === topShelf) || wrongItems[0])?.img
    const theme = { ...themeBase, img: themeImg }

    setResult({
      correct, total: currentItems.length, score: newTotal,
      levelScore, maxScore, passed, perfect, reason, stars,
      hintsUsed, finishBonus, netAdjust,
      streakMult, scoreX2Used: scoreX2, finalScore, coinsEarned, wrongItems, theme,
    })
    // If anything landed in the wrong zone, show the "Let's Review!" recap
    // first, then the stars. It's purely educational (never claims the player
    // failed), so it shows whether they passed or not — a flawless round is
    // the only case that jumps straight to the star screen.
    if (reason === 'checked' && wrongItems.length > 0) setScreen('feedback')
    else setScreen('result')
    if (passed) audio.sfxWin(); else audio.sfxLose()

    supabase.rpc('submit_level_result', {
      p_level: level,
      p_score: newTotal,
      p_stars: stars,
      p_correct_count: correct,
      p_total_items: currentItems.length,
    }).then(({ error }) => {
      if (error) console.error('Could not save score:', error.message)
    })

    // เลเวลจบแล้ว (ผ่านหรือ time up) — หยุด interval ที่ push ทุก 12 วิก่อนเป็น
    // อันดับแรก (แบบ synchronous ทันที ไม่รอ React effect cleanup) กันไม่ให้
    // มันดันไป push snapshot ขึ้นมาใหม่ "หลัง" จากบรรทัดถัดไปที่ลบทิ้งแล้ว —
    // ถ้าไม่ clear ตรงนี้ก่อน อาจมี snapshot ค้างโผล่มาใหม่ทั้งที่จบด่านไปแล้ว
    if (snapshotIntervalIdRef.current) {
      clearInterval(snapshotIntervalIdRef.current)
      snapshotIntervalIdRef.current = null
    }
    // แล้วค่อยล้าง mid-level snapshot ทิ้ง ทั้ง local และ remote กันไม่ให้
    // ครั้งถัดไปที่เปิดแอป (เครื่องไหนก็ตาม) ดึงเลเวลที่จบไปแล้วกลับมาผิดจังหวะ
    clearSnapshot()
    clearSnapshotRemote(session?.user?.id ?? null)
  }, [placements, boardPlacements, total, currentItems, currentShelves, currentBoards, level, hintsUsed, winStreak, scoreX2, session])

  const checkAnswers = useCallback(() => finish('checked'), [finish])

  // Auto-finish (Time Up) when the clock hits zero
  useEffect(() => {
    if (running && !paused && timeLeft <= 0) finish('timeup')
  }, [running, paused, timeLeft, finish])

  const startLevel = (lvl = level, diff = difficulty, { paused = false } = {}) => {
    const items = itemsForLevel(lvl, diff)
    setLevel(lvl)
    setDifficulty(diff)
    setCurrentItems(items)
    setPlacements(initialPlacementsFor(lvl, items))
    setBoardPlacements({})
    setSelectedId(null)
    setShelfZoomed(false)
    // Every level starts clean — any Score x2 / free hints / extra time
    // now come from actively tapping an inventory item during THIS level
    // (see requestUseItem/confirmUseItemNow above), not from a bank that
    // auto-applied to whatever level happened to start next.
    setTimeLeft(LEVEL_TIME)
    setScoreX2(false)
    setFreeHints(0)
    setResult(null)
    setPaused(paused)
    setRunning(true)
    setHintsUsed(0)
    setHintShelfId(null)
    setScreen('game')
  }

  // Hitting "Play" on the main menu used to detour through the
  // difficulty-select screen. Now it skips straight past that.
  // Priority: 1) resume a level that was left mid-play (snapshot, from
  // closing the app abruptly OR just hitting Home) — jumps straight back
  // into the game, skipping Tips since it's not a fresh start.
  // 2) otherwise figure out whatever level the player left off on (their
  // lowest unlocked, not-yet-starred level) and show Tips once before
  // dropping them into that level.
  const onPlayButtonClick = async () => {
    const userId = session?.user?.id ?? null
    const localSnap = loadSnapshot(userId)
    // เช็ค remote ด้วยเสมอ (ไม่ใช่แค่ตอนเปิดแอป) เผื่อผู้เล่นสลับมาจาก
    // เครื่องอื่นระหว่างเซสชันนี้ (เช่น เล่นค้างบนมือถือ แล้วมาเปิดเว็บบน
    // คอมโดยไม่ได้ปิด-เปิดแอปใหม่)
    const remoteSnap = userId ? await pullSnapshotRemote(userId) : null
    const snap = pickFreshestSnapshot(localSnap, remoteSnap)
    if (snap) {
      // Load the real saved level in behind the popup (paused) so the player
      // sees exactly where they left off, instead of a blank/menu backdrop.
      resumeFromSnapshot(snap, { paused: true })
      setResumeChoice(snap)
      return
    }
    const lvl = userId ? await getLastPlayedLevel(userId) : 1
    setLevel(lvl) // remembered so Tips' "Start Sorting!" opens the right level
    if (storyForLevel(lvl)) { setPrevScreen('tips'); setScreen('story') }
    else setScreen('tips')
  }

  // ----- Resume-choice popup (shown from the Play button when a mid-level snapshot exists) -----
  const [resumeChoice, setResumeChoice] = useState(null) // holds the pending snapshot, or null when hidden

  const confirmResumeRestart = () => {
    const snap = resumeChoice
    setResumeChoice(null)
    if (!snap) return
    clearSnapshot()
    clearSnapshotRemote(session?.user?.id ?? null)
    startLevel(snap.level, snap.difficulty)
  }
  const confirmResumeContinue = () => {
    // The saved level + placements are already applied (see onPlayButtonClick) —
    // just drop the popup and unpause into play.
    setResumeChoice(null)
    setPaused(false)
  }
  const dismissResumeChoice = () => {
    // "X" — back out to the main menu without touching the saved snapshot,
    // so hitting Play again reopens this same choice.
    setResumeChoice(null)
    goMenu()
  }

  // Cutting-board level: move a coloured board onto a fridge slot (one per slot).
  // Level 4 flow: load an ingredient onto a coloured board (still on the table).
  const placeItemOnBoard = (itemId, boardId) => {
    if (screen === 'result' || screen === 'feedback') return
    setPlacements((p) => ({ ...p, [itemId]: boardId }))
    setSelectedId(null)
    audio.sfxPlace()
  }
  // Then carry a loaded board into a fridge slot. A shelf can hold several
  // boards at once — dropping a new one just adds it to that slot.
  const placeBoardInFridge = (boardId, shelfId) => {
    if (screen === 'result' || screen === 'feedback') return
    setBoardPlacements((bp) => ({ ...bp, [boardId]: shelfId }))
    audio.sfxPlace()
  }
  // Pull a board back out of the fridge onto the table (its items ride along).
  const returnBoard = (boardId) => {
    if (screen === 'result' || screen === 'feedback') return
    setBoardPlacements((bp) => {
      const next = { ...bp }
      delete next[boardId]
      return next
    })
    audio.sfxReturn()
  }

  const placeItem = (itemId, shelfId) => {
    if (screen === 'result' || screen === 'feedback') return
    const shelf = shelvesWithLock.find((s) => s.id === shelfId)
    if (shelf?.locked) return // padlocked — sort the shelf above first
    setPlacements((p) => ({ ...p, [itemId]: shelfId }))
    setSelectedId(null)
    audio.sfxPlace()
    // Extra little chime if that placement just completed the whole shelf.
    const item = itemsById[itemId]
    if (item && shelf && item.shelf === shelf.id) {
      const nextPlacements = { ...placements, [itemId]: shelfId }
      if (isShelfComplete(shelf, currentItems, nextPlacements)) {
        setTimeout(() => audio.sfxShelfComplete(), 80)
      }
    }
  }
  const returnItem = (itemId) => {
    if (screen === 'result' || screen === 'feedback') return
    setPlacements((p) => ({ ...p, [itemId]: null }))
    setSelectedId(null)
    audio.sfxReturn()
  }
  // Level 6's zoomed-in shelf: "Clear Cards" — send every card currently on
  // THIS shelf back to the tray in one go, instead of the player having to
  // pick each one off individually to re-order them.
  const clearShelfCards = (slots) => {
    if (screen === 'result' || screen === 'feedback') return
    const slotIds = new Set(slots.map((s) => s.id))
    setPlacements((p) => {
      const next = { ...p }
      Object.keys(next).forEach((id) => { if (slotIds.has(next[id])) next[id] = null })
      return next
    })
    setSelectedId(null)
    audio.sfxReturn()
  }
  // Dropped in the trash can — gone for good (won't come back to the table
  // or count as placed on any shelf).
  const trashItem = (itemId) => {
    if (screen === 'result' || screen === 'feedback') return
    setPlacements((p) => ({ ...p, [itemId]: 'trash' }))
    setSelectedId(null)
    audio.sfxTrash()
  }


  // NOTE: there is intentionally no "live score" computed here anymore —
  // score is fully hidden during play and only revealed once, all at once,
  // on the Result Screen (see finish() below, which computes the real
  // final score from scratch when the level ends).

  const trayItems = currentItems.filter((it) => placements[it.id] === null)

  const openSettings = () => { setPrevScreen(screen); setScreen('settings') }
  const openRewards = () => { setPrevScreen('menu'); setScreen('rewards') }
  const openShop = () => { setPrevScreen('menu'); setScreen('shop') }

  const goMenu = () => {
    setRunning(false)
    setPaused(false)
    setScreen('menu')
    // หมายเหตุ: ไม่ล้าง snapshot ตรงนี้โดยตั้งใจ — กด Home ออกมากลางเลเวล
    // ยังต้องกลับมาเล่นต่อจากจุดเดิมได้ตอนกด Play ใหม่ (ดู onPlayButtonClick)
    // snapshot จะถูกล้างก็ต่อเมื่อเลเวลจบจริงๆ เท่านั้น (ดูใน finish())
  }

  const inGame = screen === 'game' || screen === 'result' || screen === 'feedback'
  // Reveal the answer key (correct/wrong marks) on the board during BOTH the
  // feedback screen and the final star screen.
  const revealBoard = screen === 'result' || screen === 'feedback'

  // Gate the whole game behind the login / sign-up screen (real Supabase session).
  if (authLoading) return null
  if (!session) {
    return (
      <div className="app">
        <Header inGame={false} title="Fridge Master" onHome={() => setAuthMode('login')} onSettings={() => {}} onHelp={() => {}} />
        <div className="page">
          <Auth mode={authMode} onAuthed={setSession} onSwitch={setAuthMode} />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        inGame={inGame}
        title={inGame ? "Fridge Master" : 'Fridge Master'}
        paused={paused}
        onPause={() => setPaused((p) => !p)}
        onHome={goMenu}
        onSettings={openSettings}
        onHelp={() => { setPrevScreen(screen); setScreen('howto') }}
        onProfile={() => { setPrevScreen(screen); setScreen('profile') }}
        showProfile={!inGame}
        coins={!inGame ? coins : undefined}
      />

      <div className="page">
        {screen === 'menu' && (
          <Menu
            onPlay={onPlayButtonClick}
            onLevels={() => setScreen('levels')}
            onShop={openShop}
            onRewards={openRewards}
          />
        )}

        {screen === 'difficulty' && (
          <DifficultySelect
            selected={difficulty}
            onSelect={(tier) => { setDifficulty(tier); setScreen('tips') }}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'profile' && (
          <ProfilePage
            coins={coins}
            onBack={() => setScreen(prevScreen === 'profile' ? 'menu' : prevScreen)}
            onSettings={openSettings}
          />
        )}

        {screen === 'levels' && (
          <LevelSelect
            onPlay={(n) => {
              if (storyForLevel(n)) { setLevel(n); setPrevScreen('game'); setScreen('story') }
              else startLevel(n)
            }}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'tips' && <Tips tips={currentTips} onStart={() => startLevel()} />}

        {screen === 'story' && currentStory && (
          <Story
            story={currentStory}
            onContinue={() => {
              if (prevScreen === 'game') startLevel()
              else setScreen('tips')
            }}
          />
        )}

        {screen === 'howto' && (
          <HowToPlay
            onStart={() => startLevel(1)}
            onBack={() => setScreen(prevScreen === 'howto' ? 'menu' : prevScreen)}
          />
        )}

        {screen === 'settings' && (
          <Settings
            settings={settings}
            onChange={setSettings}
            onBack={() => setScreen(prevScreen === 'settings' ? 'menu' : prevScreen)}
          />
        )}

        {screen === 'rewards' && (
          <Rewards session={session} onReward={grantRewardItem} onBack={() => setScreen('menu')} />
        )}

        {screen === 'shop' && (
          <Shop coins={coins} onBuy={buyPowerup} onBack={() => setScreen('menu')} />
        )}

        {inGame && (
          <>
            <Hud level={level} timeLeft={timeLeft} scoreX2={scoreX2} freeHints={freeHints} />
            {screen === 'game' && difficulty === 1 && <GuideBanner shelves={currentShelves} />}
            {currentLayout === 'boards' ? (
            <div className="board board--cutting">
              <CuttingBoardScene
                shelves={currentShelves}
                boards={currentBoards}
                boardPlacements={boardPlacements}
                placements={placements}
                itemsById={itemsById}
                items={currentItems}
                selectedId={selectedId}
                reveal={revealBoard}
                locks={currentLocks}
                onDropItemOnBoard={placeItemOnBoard}
                onDropBoardInFridge={placeBoardInFridge}
                onReturnBoard={returnBoard}
                onReturnItem={returnItem}
                onSelect={(id) => setSelectedId((s) => (s === id ? null : id))}
              />
            </div>
            ) : currentLayout === 'queue' ? (
            <div className="board board--queue">
              <QueueScene
                slots={currentShelves}
                placements={placements}
                itemsById={itemsById}
                selectedId={selectedId}
                reveal={revealBoard}
                hintShelfId={hintShelfId}
                onDropItem={placeItem}
                onPickPlaced={returnItem}
                onShelfClick={(shelfId) => {
                  if (selectedId) placeItem(selectedId, shelfId)
                }}
              />
              <Tray
                items={trayItems}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId((s) => (s === id ? null : id))}
                onReturnDrop={returnItem}
              />
            </div>
            ) : currentLayout === 'fridge-zoom' ? (
            <div className="board">
              {shelfZoomed ? (
                <ZoomShelf
                  slots={currentShelves}
                  placements={placements}
                  itemsById={itemsById}
                  selectedId={selectedId}
                  reveal={revealBoard}
                  hintShelfId={hintShelfId}
                  onDropItem={placeItem}
                  onPickPlaced={returnItem}
                  onShelfClick={(shelfId) => {
                    if (selectedId) placeItem(selectedId, shelfId)
                  }}
                  onBack={() => setShelfZoomed(false)}
                  onClearAll={() => clearShelfCards(currentShelves)}
                />
              ) : (
                <Fridge
                  shelves={ZOOM_TRIGGER_SHELVES}
                  placements={placements}
                  itemsById={itemsById}
                  selectedId={selectedId}
                  reveal={revealBoard}
                  hintShelfId={hintShelfId}
                  onDropItem={placeItem}
                  onPickPlaced={returnItem}
                  locks={currentLocks}
                  onShelfClick={() => {}}
                  onZoomClick={() => setShelfZoomed(true)}
                />
              )}
              <Tray
                items={trayItems}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId((s) => (s === id ? null : id))}
                onReturnDrop={returnItem}
              />
            </div>
            ) : currentLayout === 'assembly' ? (
            <div className="board board--assembly">
              <AssemblyScene
                slots={shelvesWithLock}
                placements={placements}
                itemsById={itemsById}
                selectedId={selectedId}
                reveal={revealBoard}
                hintShelfId={hintShelfId}
                onDropItem={placeItem}
                onPickPlaced={returnItem}
                onSelect={(id) => setSelectedId((s) => (s === id ? null : id))}
              />
            </div>
            ) : (
            <div className={'board' + (currentLayout === 'fix' ? ' board--fix' : '')}>
              <Fridge
                shelves={shelvesWithLock}
                placements={placements}
                itemsById={itemsById}
                selectedId={selectedId}
                reveal={revealBoard}
                hintShelfId={hintShelfId}
                onDropItem={placeItem}
                onPickPlaced={returnItem}
                locks={currentLocks}
                onShelfClick={(shelfId) => {
                  if (selectedId) placeItem(selectedId, shelfId)
                }}
              />
              {currentLayout === 'fix' ? null : currentLayout === 'table' ? (
                <TableScene
                  items={trayItems}
                  selectedId={selectedId}
                  onSelect={(id) => setSelectedId((s) => (s === id ? null : id))}
                  onReturnDrop={returnItem}
                  onTrashDrop={trashItem}
                />
              ) : (
                <Tray
                  items={trayItems}
                  selectedId={selectedId}
                  onSelect={(id) => setSelectedId((s) => (s === id ? null : id))}
                  onReturnDrop={returnItem}
                  wide={level === 10}
                />
              )}
            </div>
            )}

            {screen === 'game' && (
              <div className="actions">
                <InventoryBar inventory={inventory} scoreX2Active={scoreX2} onUse={requestUseItem} />
                <button
                  className="btn btn-check"
                  disabled={!allPlaced}
                  onClick={checkAnswers}
                >
                  {allPlaced
                    ? 'Check Answers ✓'
                    : placedCount < currentItems.length
                      ? `Place all items (${placedCount}/${currentItems.length})`
                      : `Carry boards into the fridge (${boardsInFridgeCount}/${usedBoardIds.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ----- Confirm before spending an inventory item on THIS level ----- */}
      {confirmUseItem && (
        <Modal>
          <InventoryConfirmCard
            itemId={confirmUseItem}
            onConfirm={confirmUseItemNow}
            onCancel={() => setConfirmUseItem(null)}
          />
        </Modal>
      )}

      {/* ----- Feedback: shown first when something was placed in the wrong zone ----- */}
      {screen === 'feedback' && result && (
        <Modal>
          <FeedbackCard result={result} onNext={() => setScreen('result')} />
        </Modal>
      )}

      {/* ----- Result: Level Completed / Time Up ----- */}
      {screen === 'result' && result && (
        <Modal>
          {result.reason === 'timeup'
            ? <TimeUpCard result={result} onRetry={() => startLevel(level)} onMenu={goMenu} />
            : <LevelCompleteCard
                result={result}
                onNext={() => startLevel(level + 1)}
                onReplay={() => startLevel(level)}
                onMenu={goMenu}
              />}
        </Modal>
      )}

      {/* ----- Resume choice (Play button found a saved mid-level snapshot) ----- */}
      {resumeChoice && screen === 'game' && (
        <Modal>
          <ResumeChoiceCard
            level={resumeChoice.level}
            onRestart={confirmResumeRestart}
            onContinue={confirmResumeContinue}
            onClose={dismissResumeChoice}
          />
        </Modal>
      )}

      {/* ----- Pause ----- */}
      {paused && screen === 'game' && !resumeChoice && (
        <Modal>
          <PauseCard
            level={level}
            onResume={() => setPaused(false)}
            onRestart={() => { setPaused(false); startLevel(level) }}
            onSettings={openSettings}
            onMenu={goMenu}
          />
        </Modal>
      )}
    </div>
  )
}

/* ---------- Header ---------- */
function Header({ inGame, title, paused, onPause, onHome, onSettings, onHelp, onProfile, showProfile, coins }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={onHome}>
          <span className="brand-ico">🧊</span>
          <span>{title}</span>
        </button>
        <div className="topbar-actions">
          {typeof coins === 'number' && (
            <div className="topbar-coins">
              <span className="shop-coin-ico">$</span>{coins.toLocaleString()}
            </div>
          )}
          {inGame
            ? (
              <button className="round-btn" onClick={onPause} title="Pause">
                {paused ? <PlayGlyph /> : <PauseGlyph />}
              </button>
            )
            : <button className="round-btn" onClick={onHelp} title="Help"><HelpGlyph /></button>}
          {showProfile && (
            <button className="round-btn" onClick={onProfile} title="Profile"><ProfileGlyph /></button>
          )}
          <button className="round-btn" onClick={onSettings} title="Settings"><GearGlyph /></button>
        </div>
      </div>
    </header>
  )
}

/* ---------- Header icon glyphs (bold, fill the button) ---------- */
function PauseGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="5" width="4.2" height="14" rx="1.6" fill="currentColor" />
      <rect x="13.8" y="5" width="4.2" height="14" rx="1.6" fill="currentColor" />
    </svg>
  )
}
function PlayGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5Z" fill="currentColor" />
    </svg>
  )
}
function GearGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M19.14 12.94a7.49 7.49 0 0 0 0-1.88l2-1.57a.5.5 0 0 0 .12-.64l-1.9-3.29a.5.5 0 0 0-.61-.22l-2.39 1a7.3 7.3 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.8a.5.5 0 0 0-.5.42l-.36 2.54a7.3 7.3 0 0 0-1.62.94l-2.39-1a.5.5 0 0 0-.61.22L2.81 8.85a.5.5 0 0 0 .12.64l2 1.57a7.49 7.49 0 0 0 0 1.88l-2 1.57a.5.5 0 0 0-.12.64l1.9 3.29a.5.5 0 0 0 .61.22l2.39-1a7.3 7.3 0 0 0 1.62.94l.36 2.54a.5.5 0 0 0 .5.42h3.8a.5.5 0 0 0 .5-.42l.36-2.54a7.3 7.3 0 0 0 1.62-.94l2.39 1a.5.5 0 0 0 .61-.22l1.9-3.29a.5.5 0 0 0-.12-.64ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z" />
    </svg>
  )
}
function HelpGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.9 15.5h-1.8v-1.8h1.8Zm1.87-6.98-.81.83c-.65.66-1.06 1.2-1.06 2.4h-1.8v-.45c0-.88.41-1.68 1.06-2.34l1.12-1.14a1.8 1.8 0 0 0-1.28-3.07 1.8 1.8 0 0 0-1.8 1.8H8.4a3.6 3.6 0 1 1 6.37 2.28Z" />
    </svg>
  )
}
function ProfileGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" fill="currentColor" />
      <path fill="currentColor" d="M4.5 19.2c1.02-3.6 4.1-5.7 7.5-5.7s6.48 2.1 7.5 5.7a1 1 0 0 1-.96 1.3H5.46a1 1 0 0 1-.96-1.3Z" />
    </svg>
  )
}

/* ---------- Auth (login / sign-up gate before the game, real Supabase) ---------- */
function Auth({ mode, onAuthed, onSwitch }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // No <form> on purpose — every button is type="button" with an explicit
  // handler, so nothing can accidentally submit / enter the game on re-render.
  const handleSignUp = async () => {
    setError(''); setNotice('')
    if (!email || !password) { setError('Enter an email and password.'); return }
    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    })
    setLoading(false)
    if (signUpError) { setError(signUpError.message); return }
    if (data.user && !data.session) {
      setNotice('Check your email to confirm your account, then log in.')
      onSwitch('login')
      return
    }
    onAuthed?.(data.session)
  }

  const handleLogIn = async () => {
    setError(''); setNotice('')
    if (!email || !password) { setError('Enter an email and password.'); return }
    setLoading(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) { setError(signInError.message); return }
    onAuthed?.(data.session)
  }

  if (mode === 'signup') {
    return (
      <main className="auth">
        <div className="auth-card">
          <h1 className="auth-title">Fridge Fresh</h1>
          <p className="auth-sub">Stock your shelves and get sorting!</p>

          <label className="auth-label">Player Name</label>
          <div className="auth-field">
            <span className="field-ico"><UserGlyph /></span>
            <input
              type="text" placeholder="Your name" autoComplete="username"
              value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <label className="auth-label">Email</label>
          <div className="auth-field">
            <span className="field-ico"><LockGlyph /></span>
            <input
              type="email" placeholder="you@gmail.com" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label className="auth-label">Password</label>
          <div className="auth-field">
            <span className="field-ico"><LockGlyph /></span>
            <input
              type="password" placeholder="Password (6+ characters)" autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}
          {notice && <p className="auth-notice">{notice}</p>}

          <button className="btn btn-play auth-btn" type="button" disabled={loading} onClick={handleSignUp}>
            {loading ? 'Signing up…' : 'Sign Up!'}
          </button>
          <p className="auth-switch">
            Already have a fridge?{' '}
            <button type="button" className="auth-link" onClick={() => onSwitch('login')}>Log in here →</button>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <h1 className="auth-title auth-title--plain">Log In</h1>

        <label className="auth-label">Email</label>
        <div className="auth-field">
          <span className="field-ico"><UserGlyph /></span>
          <input
            type="email" placeholder="you@gmail.com" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <label className="auth-label">Password</label>
        <div className="auth-field">
          <span className="field-ico"><LockGlyph /></span>
          <input
            type="password" placeholder="Password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}

        <button className="btn btn-play auth-btn" type="button" disabled={loading} onClick={handleLogIn}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
        <div className="auth-or">or</div>
        <button type="button" className="auth-create" onClick={() => onSwitch('signup')}>Create New Account</button>
      </div>
    </main>
  )
}

function UserGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="var(--green-dark)" />
      <path d="M4 20a8 8 0 0 1 16 0Z" fill="var(--green-dark)" />
    </svg>
  )
}
function LockGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="var(--green-dark)" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" fill="var(--green-dark)" />
    </svg>
  )
}

/* ---------- Menu ---------- */
function Menu({ onPlay, onLevels, onShop, onRewards }) {
  return (
    <main className="menu">
      <div className="logo-badge">
        <div className="logo-fridge">🧊</div>
        <div className="logo-dot logo-dot--red" />
        <div className="logo-dot logo-dot--yellow" />
      </div>
      <h1 className="title">FRIDGE<br />MASTER</h1>
      <p className="subtitle">ORGANIZE YOUR WORLD</p>

      <button className="btn btn-play menu-play" onClick={onPlay}>
        <span className="play-badge">▶</span>
        <span>Play</span>
      </button>

      <div className="menu-row">
        <button className="pill pill-teal" onClick={onLevels}>
          <span className="pill-ico">▦</span>Levels
        </button>
        <button className="pill pill-grey" onClick={onShop}>
          <span className="pill-ico">🛒</span>Shop
        </button>
        <button className="pill pill-orange" onClick={onRewards}>
          <span className="pill-ico">🏆</span>Rewards
        </button>
      </div>
    </main>
  )
}

/* ---------- Difficulty / skill-tier select (shown right after Play) ---------- */
const DIFFICULTY_TIERS = [
  {
    tier: 1, emoji: '🐣', name: 'Fridge Freshies',
    desc: 'New to cooking — ready to learn safe fridge habits.',
    detail: 'Guidance shown at all times, free. Simple item picks.',
  },
  {
    tier: 2, emoji: '👩‍🍳', name: 'Kitchen Keeper',
    desc: 'Cooks at home — sharpening your storage skills.',
    detail: 'Hint button available (costs points). More varied picks.',
  },
  {
    tier: 3, emoji: '🏆', name: 'Fridge Safety Masters',
    desc: 'Nutrition & food service pros — bring on the toughest challenges.',
    detail: 'No guidance at all. Complex, mixed-category picks.',
  },
]

function DifficultySelect({ selected, onSelect, onBack }) {
  return (
    <main className="difficulty-screen">
      <h1 className="difficulty-title">Welcome to Fridge Master!</h1>
      <p className="difficulty-sub">Pick your group and start your journey to becoming a Freshness Master!</p>

      <div className="difficulty-list">
        {DIFFICULTY_TIERS.map((t) => (
          <button
            key={t.tier}
            className={'difficulty-card' + (selected === t.tier ? ' difficulty-card--selected' : '')}
            onClick={() => onSelect(t.tier)}
          >
            <div className="difficulty-card-head">
              <span className="difficulty-emoji">{t.emoji}</span>
              <span className="difficulty-name">{t.name}</span>
            </div>
            <p className="difficulty-desc">{t.desc}</p>
          </button>
        ))}
      </div>

      <button className="btn btn-play difficulty-back" onClick={onBack}>← Back To Menu</button>
    </main>
  )
}

/* ---------- Always-on guidance banner (Fridge Freshies / tier 1 only) ---------- */
function GuideBanner({ shelves }) {
  const withHints = shelves.filter((s) => s.hint)
  if (withHints.length === 0) return null
  return (
    <div className="guide-banner">
      <span className="guide-banner-title">📋 Where things go:</span>
      <ul className="guide-banner-list">
        {withHints.map((s) => (
          <li key={s.id}><strong>{s.name}:</strong> {s.hint}</li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Profile page  ---------- */
function ProfilePage({ coins, onBack, onSettings }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        if (!cancelled) { setError('Could not load your account.'); setLoading(false) }
        return
      }
      const { data: row } = await supabase
        .from('users')
        .select('display_name, total_stars, created_at')
        .eq('id', user.id)
        .maybeSingle()
      if (!cancelled) {
        const stars = row?.total_stars ?? 0
        setProfile({
          email: user.email,
          displayName: row?.display_name || user.email?.split('@')[0] || 'Player',
          totalStars: stars,
          trophies: stars,
          joined: row?.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
        })
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const level = profile ? Math.max(1, Math.floor(profile.totalStars / 10) + 1) : 1

  return (
    <main className="profile-screen">
      <h1 className="profile-heading">Profile</h1>

      <div className="profile-card2">
        {loading && <p className="profile-loading">Loading…</p>}
        {error && <p className="auth-error">{error}</p>}

        {profile && (
          <>
            <button className="profile-gear" onClick={onSettings} title="Settings">⚙</button>

            <div className="profile-id">
              <div className="profile-avatar">🧒</div>
              <div className="profile-id-text">
                <div className="profile-name">{profile.displayName}</div>
                <div className="profile-level">LEVEL {level}</div>
              </div>
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-ico">🪙</div>
                <div className="profile-stat-val">{coins.toLocaleString()}</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-ico">🏆</div>
                <div className="profile-stat-val">{profile.trophies}</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-ico">⭐</div>
                <div className="profile-stat-val">{profile.totalStars}/{PROFILE.starGoal}</div>
              </div>
            </div>

            <h2 className="profile-section-head">Badges</h2>
            <div className="profile-badges">
              {PROFILE.badges.map((b) => (
                <div className="profile-badge" key={b.name}>
                  <div className="profile-badge-medal">{b.emoji}</div>
                  <div className="profile-badge-name">{b.name}</div>
                </div>
              ))}
            </div>

            <h2 className="profile-section-head">Achievements</h2>
            <div className="ach-list">
              {REWARDS.achievements.map((a) => (
                <div className="ach-row" key={a.name}>
                  <div className="ach-ico" style={{ background: a.color }}>{a.icon}</div>
                  <div className="ach-main">
                    <div className="ach-top">
                      <span className="ach-name">{a.name}</span>
                      <span className="ach-pct">{a.pct}%</span>
                    </div>
                    <div className="ach-bar"><div className="ach-fill" style={{ width: `${a.pct}%` }} /></div>
                    <div className="ach-desc">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-play profile-back" onClick={onBack}>← Back To Menu</button>
            <button
              className="profile-logout"
              onClick={async () => { await supabase.auth.signOut() }}
            >
              Log Out
            </button>
          </>
        )}
      </div>
    </main>
  )
}

/* ---------- Tips ---------- */
function Tips({ tips, onStart }) {
  const list = tips && tips.length ? tips : TIPS
  return (
    <main className="tips">
      <h2 className="tips-heading">Food Safety Tips</h2>
      <p className="tips-subheading">
        Master the art of organizing in <span>{list.length} easy steps!</span>
      </p>
      <div className="tips-grid">
        {list.map((t) => (
          <div className="tip-card" key={t.title}>
            <div className="tip-img"><img src={t.img} alt={t.title} /></div>
            <div className="tip-head">
              {t.icon && (
                <span className={`tip-badge tip-badge--${t.color || 'teal'}`}>{t.icon}</span>
              )}
              <h3>{t.title}</h3>
            </div>
            <span className={`tip-underline tip-underline--${t.color || 'teal'}`} />
            <p>{t.text}</p>
          </div>
        ))}
      </div>
      <button className="btn btn-play tips-start" onClick={onStart}>Start Sorting! →</button>
      <p className="tips-note">TAP TO BEGIN YOUR JOURNEY</p>
    </main>
  )
}

/* ---------- Story intro (e.g. Level 10's supermarket run) ---------------
 * A single scripted beat shown once before Tips: "you went shopping, now
 * let's put it all away". Purely narrative — no game state, just a
 * continue button. Level data supplies the copy (see data/levels/level10.js);
 * the illustration is a lightweight built-in SVG scene so no external art
 * asset is needed. */
// A single centred card: supermarket art on top, then the story copy and the
// Let's Play button. No timer — the player starts the level with the button.
function Story({ story, onContinue }) {
  return (
    <main className="story">
      <div className="story-card">
        <img className="story-scene" src={supermarketImg} alt="" draggable="false" />
        <h2 className="story-title">{story.title}</h2>
        <p className="story-sub">{story.sub}</p>
        <p className="story-caption">
          {story.caption} <strong>{story.highlight}</strong>
        </p>
        <button className="btn btn-play story-start" onClick={onContinue}>{story.cta}</button>
      </div>
    </main>
  )
}

// Simple flat-vector "just got back from the supermarket" scene: a shelf of
// products on the left, a shopping cart with bread + milk on the right, and
// a friendly shopper in between. Built entirely from shapes (no image file)
// so it stays crisp at any size and matches the app's rounded, pastel style.
function SupermarketScene() {
  return (
    <svg className="story-scene" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* floor */}
      <rect x="0" y="150" width="320" height="30" fill="#f3efe0" />

      {/* shelf */}
      <g>
        <rect x="14" y="30" width="90" height="120" rx="8" fill="#e4573b" />
        <rect x="14" y="30" width="90" height="22" rx="8" fill="#f7c6c6" />
        {[52, 82, 112].map((y) => (
          <rect key={y} x="20" y={y} width="78" height="14" rx="4" fill="#fff6e0" />
        ))}
        {/* product rows */}
        {[57, 87, 117].map((y, i) => (
          <g key={y}>
            {[0, 1, 2, 3].map((c) => (
              <rect
                key={c}
                x={24 + c * 18}
                y={y - 16}
                width="14"
                height="16"
                rx="2.5"
                fill={['#7fd3b4', '#f4de3b', '#4ea8de', '#f4a3a3'][(c + i) % 4]}
              />
            ))}
          </g>
        ))}
      </g>

      {/* shopper */}
      <g>
        <circle cx="170" cy="58" r="14" fill="#f4c9a0" />
        <path d="M150 145 q-2 -46 20 -50 q22 4 20 50 z" fill="#57c4a6" />
        <rect x="160" y="132" width="10" height="20" rx="4" fill="#3a4650" />
        <rect x="178" y="132" width="10" height="20" rx="4" fill="#3a4650" />
        {/* arm holding milk carton */}
        <rect x="184" y="88" width="9" height="26" rx="3" fill="#57c4a6" transform="rotate(18 184 88)" />
        <rect x="196" y="72" width="16" height="20" rx="2" fill="#eaf2ff" stroke="#4ea8de" strokeWidth="1.6" />
        <path d="M196 72 l8 -8 l8 8 z" fill="#eaf2ff" stroke="#4ea8de" strokeWidth="1.6" strokeLinejoin="round" />
      </g>

      {/* cart */}
      <g>
        <path d="M232 96 h64 l-10 34 h-46 z" fill="none" stroke="#9aa3a8" strokeWidth="3.5" strokeLinejoin="round" />
        <line x1="220" y1="96" x2="296" y2="96" stroke="#9aa3a8" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="220" y1="96" x2="212" y2="86" stroke="#9aa3a8" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="244" cy="140" r="6" fill="#3a4650" />
        <circle cx="278" cy="140" r="6" fill="#3a4650" />
        {/* bread */}
        <rect x="240" y="72" width="18" height="26" rx="8" fill="#e8a24b" />
        {/* milk */}
        <rect x="264" y="66" width="18" height="32" rx="2" fill="#4ea8de" />
        <path d="M264 66 l9 -8 l9 8 z" fill="#4ea8de" />
        <rect x="266" y="80" width="14" height="10" fill="#fff" opacity=".85" />
      </g>
    </svg>
  )
}

/* ---------- How to Play (tutorial opened from the Help button) ---------- */
function HowToPlay({ onStart, onBack }) {
  return (
    <main className="howto">
      <h1 className="howto-title">How to Play</h1>
      <p className="howto-sub">Master the art of organizing in 3 easy steps!</p>

      <div className="howto-grid">
        <div className="howto-card">
          <div className="howto-illus">
            <div className="howto-shelf">
              <div className="howto-item">
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                  <path d="M12 7c-1-2-3.2-2.4-4.6-1.3C5.6 7 5.4 9.6 6.6 12c.9 1.8 2.4 3.6 3.6 4.4.9.6 1.6.6 2.4 0 1.2-.8 2.7-2.6 3.6-4.4 1.2-2.4 1-5-0.8-6.3C13.6 4.6 11.4 5 10.4 7"
                    fill="none" stroke="var(--green-deep)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 6.2c.2-1 .9-1.8 1.9-2.1" fill="none" stroke="var(--green-deep)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <span className="howto-cursor">👆</span>
          </div>
          <h3>Step 1: Drag &amp; Drop</h3>
          <p>Drag food items to the right shelf!</p>
        </div>

        <div className="howto-card">
          <div className="howto-illus">
            <div className="howto-clock">⏱️</div>
            <span className="howto-dot howto-dot--tr" />
            <span className="howto-dot howto-dot--bl" />
          </div>
          <h3>Step 2: Watch the Clock</h3>
          <p>Sort everything before time runs out!</p>
        </div>

        <div className="howto-card">
          <div className="howto-illus">
            <div className="howto-score">
              <span className="howto-plus">+500</span>
              <span className="howto-perfect">PERFECT!</span>
              <span className="howto-star">⭐</span>
            </div>
          </div>
          <h3>Step 3: Score Big</h3>
          <p>Earn more points for fast and accurate sorting!</p>
        </div>
      </div>

      <button className="btn btn-play howto-start" onClick={onStart}>Start Sorting! →</button>
      <p className="howto-note">TAP TO BEGIN YOUR JOURNEY</p>
    </main>
  )
}

/* ---------- HUD ---------- */
function Hud({ level, timeLeft, scoreX2, freeHints }) {
  const pct = Math.round((timeLeft / LEVEL_TIME) * 100)
  const mm = Math.floor(timeLeft / 60)
  const ss = String(timeLeft % 60).padStart(2, '0')
  const hasBoosts = scoreX2 || freeHints > 0
  return (
    <div className="hud">
      <div className="hud-level">
        <span>Level {level}</span>
        <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className={`timer ${timeLeft <= 15 ? 'timer--low' : ''}`}>⏱ {mm}:{ss}</div>
      {/* Score is intentionally NOT shown here — it stays hidden for the
          whole level and is only revealed once, all at once, on the
          Result Screen (see EndScreen's win-score). This keeps players
          focused on sorting correctly instead of chasing a live number. */}
      {/* Bought power-ups still active this level — only shown when there's
          something to show (nothing here if the player bought nothing). */}
      {hasBoosts && (
        <div className="hud-boosts">
          {scoreX2 && <span className="hud-boost-chip">🛍 x2 Score</span>}
          {freeHints > 0 && <span className="hud-boost-chip">💡 Hint ×{freeHints}</span>}
        </div>
      )}
    </div>
  )
}

/* ---------- Inventory row: the durable power-ups the player can tap to use
   during THIS level. Only items the player actually owns are shown; an
   empty-handed player sees nothing here. Tapping 🔍 Hint reveals a hint with
   no score penalty. ---------- */
function InventoryBar({ inventory, scoreX2Active, onUse }) {
  const defs = [
    { id: 'time', icon: '⏰', label: '+15s' },
    { id: 'hint', icon: '🔍', label: 'Hint' },
    { id: 'multiplier', icon: '2X', label: 'Score x2' },
  ]
  const owned = defs
    .map((d) => ({ ...d, qty: inventory?.[d.id] ?? 0 }))
    .filter((d) => d.qty > 0)
  if (owned.length === 0) return null
  return (
    <div className="inv-bar">
      {owned.map((it) => {
        const alreadyActive = it.id === 'multiplier' && scoreX2Active
        return (
          <button
            key={it.id}
            className={'inv-chip inv-chip--' + it.id}
            disabled={alreadyActive}
            onClick={() => onUse(it.id)}
            title={alreadyActive ? 'Already active this level' : `Use ${it.label}`}
          >
            <span className="inv-chip-ico">{it.icon}</span>
            <span className="inv-chip-label">{alreadyActive ? `${it.label} (active)` : it.label}</span>
            <span className="inv-chip-qty">×{it.qty}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Confirm popup shown before spending an inventory item ---------- */
function InventoryConfirmCard({ itemId, onConfirm, onCancel }) {
  const copy = {
    time: { icon: '⏰', tone: 'purple', title: 'Use +15 Seconds?', text: "Adds 15 seconds straight to this level's timer, right now." },
    hint: { icon: '🔍', tone: 'gold', title: 'Use Hint?', text: 'Reveals a Hint for this level with no −5 point penalty.' },
    multiplier: { icon: '2X', tone: 'blue', title: 'Use Score x2?', text: "Doubles this level's Final Score for the rest of the level — coins earned double too." },
  }[itemId] ?? { icon: '❔', tone: 'gold', title: 'Use item?', text: '' }

  return (
    <div className="shop-modal">
      <div className="shop-modal-ico">
        <div className={`shop-ico shop-ico--${copy.tone}`}>
          <span className="shop-ico-glyph">{copy.icon}</span>
        </div>
      </div>
      <h2 className="shop-modal-title">{copy.title}</h2>
      <p className="shop-modal-text">{copy.text}</p>
      <button className="shop-modal-confirm" onClick={onConfirm}>Use it now →</button>
      <button className="shop-modal-cancel" onClick={onCancel}>Cancel</button>
    </div>
  )
}

/* ---------- Helper: format a bonus/penalty number with an explicit sign ---------- */
function signed(n) {
  return n > 0 ? `+${n}` : `${n}` // negatives already carry their own "-"
}

/* ---------- Wrong-zone review (shown before the stars) -----------------
 * Two looks, picked by result.passed (>= 60% of max score, see
 * PASS_THRESHOLD): a friendly "Let's Review!" recap when the level was
 * still passed despite a few misses, or a red "Oops!" recap when the
 * score fell short of the pass line. Either way the wrong-item list is
 * the same educational data — only the framing changes. */
function FeedbackCard({ result, onNext }) {
  const wrong = result.wrongItems || []
  const theme = result.theme
  const passed = result.passed

  return (
    <div className={'fb-card' + (passed ? '' : ' fb-card--danger')}>
      <div className="fb-scroll">
        <div className="fb-icon-row">
          {passed && <span className="fb-sparkle">✨</span>}
          <div className={'fb-icon' + (passed ? '' : ' fb-icon--danger')}>
            {passed ? '🔍' : '✕'}
          </div>
          {passed && <span className="fb-sparkle">✨</span>}
        </div>
        <h2 className={'fb-title' + (passed ? '' : ' fb-title--danger')}>
          {passed ? "Let's Review!" : 'Oops! You put wrong zone'}
        </h2>
        <p className="fb-sub">
          {passed
            ? 'Great job! Here are the items you placed in the wrong zone.'
            : "You didn't meet the passing score."}
        </p>

        {theme && (
          <div className="fb-theme">
            <div className="fb-theme-img">
              {theme.img ? <img src={theme.img} alt={theme.title} /> : <span>🥗</span>}
            </div>
            <div className="fb-theme-text">
              <div className="fb-theme-title">{theme.title}</div>
              <div className="fb-theme-sub">{theme.sub}</div>
            </div>
            {passed && <div className="fb-theme-bulb">💡</div>}
          </div>
        )}

        {passed ? (
          <>
            <div className="fb-list-head--plain">
              <span className="fb-list-ico">📋</span> Items to Review
            </div>
            <div className="fb-list--plain">
              {wrong.map((w) => (
                <div className="fb-row" key={w.id}>
                  <div className="fb-row-ico">
                    {w.img ? <img src={w.img} alt={w.label} /> : <span>🍽️</span>}
                  </div>
                  <div className="fb-row-main">
                    <div className="fb-row-name">{w.label} in Wrong Zone</div>
                    <div className="fb-row-desc">
                      {w.label} should be stored on the {w.shelfName}.
                    </div>
                  </div>
                  <span className="fb-row-badge">Wrong Zone</span>
                  <span className="fb-row-chevron">›</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="fb-danger-box">
            <div className="fb-danger-head">Why didn't you pass?</div>
            <div className="fb-danger-list">
              {wrong.map((w) => (
                <div className="fb-danger-row" key={w.id}>
                  <div className="fb-row-ico">
                    {w.img ? <img src={w.img} alt={w.label} /> : <span>🍽️</span>}
                  </div>
                  <div className="fb-row-main">
                    <div className="fb-row-name">{w.label} in Wrong Zone</div>
                    <div className="fb-row-desc">
                      {w.label} should be stored on the {w.shelfName}.
                    </div>
                  </div>
                  <span className="fb-danger-row-x">✕</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {passed && theme && (
          <div className="fb-tip">
            <span className="fb-tip-star">⭐</span>
            <div className="fb-tip-text"><strong>Tip:</strong> {theme.sub}.</div>
            <span className="fb-tip-fridge">🧊</span>
          </div>
        )}
      </div>

      <button className="btn btn-play end-primary fb-next" onClick={onNext}>
        {passed ? 'Got it! →' : 'Next →'}
      </button>
    </div>
  )
}

/* ---------- Level Complete / Not Passed (4.6) ---------- */
function LevelCompleteCard({ result, onNext, onReplay, onMenu }) {
  const { correct, total: tot, levelScore, maxScore, passed, perfect, stars, netAdjust, streakMult, scoreX2Used, finalScore, coinsEarned } = result

  // ----- Not passed yet -----
  if (!passed) {
    return (
      <div className="end-card">
        <div className="end-clock">😥</div>
        <h2 className="end-title">Not Passed Yet</h2>
        <p className="end-sub">You need at least 60% of the max score to pass this level.</p>
        <div className="stars">
          {[0, 1, 2].map((i) => <span key={i} className="star">★</span>)}
        </div>
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-label">LEVEL SCORE</div>
            <div className="stat-val stat-val--green">{levelScore} / {maxScore}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">BONUS / PENALTY</div>
            <div className={`stat-val ${netAdjust >= 0 ? 'stat-val--green' : 'stat-val--red'}`}>
              {signed(netAdjust)}
            </div>
          </div>
        </div>
        <button className="btn btn-play end-primary" onClick={onReplay}>↻ Retry This Level</button>
        <button className="btn btn-mint" onClick={onMenu}>⌂ Main Menu</button>
      </div>
    )
  }

  // ----- Level completed! -----
  const subtitle = perfect ? 'PERFECTLY ORGANIZED!' : `${correct}/${tot} SORTED CORRECTLY`

  return (
    <div className="end-card end-card--win">
      <h2 className="end-title end-title--win">Level Completed!</h2>
      <p className="end-sub end-sub--caps">{subtitle}</p>

      <div className="stars stars--win">
        {[0, 1, 2].map((i) => <span key={i} className={i < stars ? 'star on' : 'star'}>★</span>)}
      </div>

      <div className="win-scorelabel">Final Score</div>
      <div className="win-score">{finalScore}</div>

      {(streakMult > 1 || scoreX2Used) && (
        <div className="win-streak">
          {streakMult > 1 ? `🔥 Streak x${streakMult}` : ''}
          {streakMult > 1 && scoreX2Used ? ' · ' : ''}
          {scoreX2Used ? '🛍 Score x2' : ''}
        </div>
      )}

      <div className="win-coins">
        <div className="win-coins-ico">★</div>
        <div className="win-coins-body">
          <div className="win-coins-label">Coins Earned</div>
          <div className="win-coins-val">+{coinsEarned}</div>
        </div>
      </div>

      <button className="btn btn-play end-primary" onClick={onNext}>Next Level →</button>
      <button className="btn btn-mint" onClick={onReplay}>↻ Replay</button>
      <button className="btn btn-mint" onClick={onMenu}>⌂ Main Menu</button>
    </div>
  )
}

/* ---------- Time Up ---------- */
function TimeUpCard({ result, onRetry, onMenu }) {
  const { levelScore, maxScore, netAdjust } = result
  return (
    <div className="end-card">
      <div className="end-clock">🕐</div>
      <h2 className="end-title">Time Up!</h2>
      <p className="end-sub2">Too bad, you didn't finish sorting in time.</p>
      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-label">LEVEL SCORE</div>
          <div className="stat-val stat-val--green">{levelScore} / {maxScore}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">BONUS / PENALTY</div>
          <div className={`stat-val ${netAdjust >= 0 ? 'stat-val--green' : 'stat-val--red'}`}>
            {signed(netAdjust)}
          </div>
        </div>
      </div>
      <button className="btn btn-play end-primary" onClick={onRetry}>Try Again ↻</button>
      <button className="btn btn-mint" onClick={onMenu}>⌂ Main Menu</button>
    </div>
  )
}

/* ---------- Pause ---------- */
function PauseCard({ level, onResume, onRestart, onSettings, onMenu }) {
  return (
    <div className="pause-card">
      <h2 className="end-title">Game Pause</h2>
      <button className="btn btn-play end-primary" onClick={onResume}>Resume Game →</button>
      <button className="btn btn-mint" onClick={onRestart}>↻ Restart level</button>
      <button className="btn btn-mint" onClick={onSettings}>⚙ Setting</button>
      <button className="btn btn-mint" onClick={onMenu}>⌂ Main Menu</button>
      <div className="pause-stats">
        <div><div className="stat-label">LEVEL</div><div className="pause-stat-val">{level}</div></div>
      </div>
    </div>
  )
}

/* ---------- Resume choice (Play button, mid-level snapshot found) ---------- */
function ResumeChoiceCard({ level, onRestart, onContinue, onClose }) {
  return (
    <div className="pause-card resume-card">
      <button className="resume-close" onClick={onClose} aria-label="Close">✕</button>
      <div className="resume-illustration">
        <img className="resume-fridge-img" src={FRIDGE_IMG} alt="" draggable="false" />
        <span className="resume-check-badge">✓</span>
      </div>
      <h2 className="end-title">Continue Level {level}?</h2>
      <p className="end-sub2">You left this level partway through — pick up where you left off, or start it over.</p>
      <div className="resume-choice-row">
        <button className="btn btn-mint" onClick={onRestart}><span>↻</span><span>Restart</span></button>
        <button className="btn btn-play" onClick={onContinue}><span>Continue</span><span>→</span></button>
      </div>
    </div>
  )
}
