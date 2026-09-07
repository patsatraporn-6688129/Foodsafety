// Game-wide metadata: tips, level-select cards, scoring constants, rewards.
// The actual per-level item/shelf data now lives in `src/data/` — see
// `data/levels/index.js` for how per-level sets are assembled, and
// `data/levels/levelNN.js` for each level's content.

import { FRIDGE_IMG, ITEMS_BY_ID } from './data/items.js'
import { LEVEL_SETS, DEFAULT_LEVEL_SET, DIFFICULTY_POOLS, pickRandomItems } from './data/levels/index.js'

export { FRIDGE_IMG, LEVEL_SETS, DEFAULT_LEVEL_SET, DIFFICULTY_POOLS, pickRandomItems }

export const TIPS = [
  {
    title: 'Raw Food',
    img: ITEMS_BY_ID['raw-chicken'].img,
    text: 'Keep raw meat on the bottom shelf, away from cooked food.',
  },
  {
    title: 'Cooked Food',
    img: ITEMS_BY_ID['cake'].img,
    text: 'Store cooked & ready-to-eat food up top, separate from raw food.',
  },
  {
    title: 'Dairy',
    img: ITEMS_BY_ID['milk'].img,
    text: 'Milk and eggs stay cool in the middle of the fridge.',
  },
]

// Level Selection screen — display metadata ONLY (name/color/order).
// The `stars` field below is intentionally unused: LevelSelect.jsx fetches
// the player's REAL per-level stars from Supabase (game_progress) and their
// real total from users.total_stars, then merges it with this static
// metadata at render time.
//
// Locking is now fully DYNAMIC (computed in LevelSelect.jsx), not stored
// here:
//  - Levels marked `locked: true` below have no level-data file yet (see
//    src/data/levels/index.js — only 1,2,3,4,5,6,7,9 exist), so they stay
//    locked "???" placeholders no matter what the player does.
//  - Every other level unlocks in order: level 1 is always open, and each
//    next one unlocks once the previous one has been earned at least 1 star.
//  - `current` (the "PLAY" badge) is computed too — it's always the first
//    unlocked level the player hasn't starred yet, no need to hardcode it.
export const LEVELS = [
  { n: 1, name: 'The Snack Bin', color: '#f4a3a3' },
  { n: 2, name: 'Soda Stack',    color: '#7fd3b4' },
  { n: 3, name: 'Dairy Drawer',  color: '#f4de3b' },
  { n: 4, name: 'Raw Meat Market', color: '#f7c6c6' },
  { n: 5, name: 'Veggie Vault',  color: '#0d7355' },
  { n: 6, name: 'FEFO Queue', color: '#57c4a6' },
  { n: 7, name: 'Thai Kitchen Table', color: '#e4573b' },
  { n: 8, name: 'Fridge Thermometers', color: '#f2b53a' },
  { n: 9, name: 'Fridge Fix-Up', color: '#f0956b' },
  { n: 10, name: 'Full Grocery Haul', color: '#4ea8de' },
  { n: 11, name: '???', locked: true },
  { n: 12, name: '???', locked: true },
]

export const LEVEL_TIME = 60 // seconds (1:00) — same for every level

// ----- Scoring rules (4.1–4.7) -----
export const CORRECT_POINTS = 10     // 4.1 วางของถูกตำแหน่ง: +10
export const WRONG_POINTS = -10      // 4.4 วางผิดตำแหน่ง: -10
export const TIME_FINISH_BONUS = 10  // 4.3 ทำเสร็จในเวลาที่กำหนด (กด Check เอง ไม่ใช่หมดเวลา): โบนัส +10 ครั้งเดียว
export const HINT_PENALTY = -5       // 4.7 กดขอคำใบ้ 1 ครั้ง: -5 คะแนน
export const PASS_THRESHOLD = 0.6    // 4.6 ต้องได้ >= 60% ของคะแนนเต็มถึงจะผ่านด่าน

export const START_SCORE = 480 // matches the HUD score in the mockups

// Rewards screen (static showcase, matching the mockup)
export const REWARDS = {
  unlockedCount: 12,
  totalCount: 48,
  items: [
    { name: 'Golden Croissant', emoji: '🥐', state: 'claimed' },
    { name: 'Rainbow Cake', emoji: '🍰', state: 'unlock' },
    { name: 'Shiny Soda', emoji: '🥤', state: 'locked', unlockAt: 'LVL 15' },
  ],
  achievements: [
    { name: 'Master Sorter', desc: 'Organize 500 total items.', pct: 85, icon: '⭐', color: '#57c4a6' },
    { name: 'Speed Demon', desc: 'Finish a level in under 60 seconds.', pct: 40, icon: '⚡', color: '#f4de3b' },
    { name: 'Clean Fridge', desc: 'Achieve 3 stars on all Level 1 stages.', pct: 100, icon: '🧼', color: '#f4a08c' },
  ],
}

// Profile page — game-flavoured stats & badges.
// NOTE: coins/trophies aren't persisted yet, so these act as display defaults;
// stars and the display name come from the real Supabase account.
export const PROFILE = {
  starGoal: 60,
  badges: [
    { name: 'Fridge Freshies', emoji: '🥈' },
    { name: 'Kitchen Keeper', emoji: '🥉' },
    { name: 'Fridge Safety Masters', emoji: '🥇' },
  ],
}

// The Fresh Market — power-ups the player can buy with coins. Each one lasts
// exactly 1 level (see `POWERUP_DURATION_LEVELS` below and App.jsx's
// startLevel(), which clears whatever was active the moment a new level begins).
export const POWERUP_DURATION_LEVELS = 1

export const SHOP = {
  intro: 'Spend coins on power-ups — they go into your inventory and you can use them in any level, whenever you want.',
  items: [
    {
      id: 'time',
      name: 'Add Time',
      desc: 'Adds extra seconds straight to the timer — use it whenever you need it, in any level.',
      coins: 5,
      icon: '⏰',
      tone: 'purple',
      badge: `+${15}s`,
      seconds: 15, // added to timeLeft when USED from the inventory (see App.jsx confirmUseItemNow)
    },
    {
      id: 'hint',
      name: 'Buy Hint',
      desc: 'Get a Hint without the usual −5 point penalty.',
      coins: 10,
      icon: '🔍',
      tone: 'gold',
      badge: 'x1',
    },
    {
      id: 'multiplier',
      name: 'Score x2',
      desc: "Doubles this level's Final Score (applied after the Streak Multiplier) — coins earned double too.",
      coins: 20,
      icon: '2X',
      tone: 'blue',
      badge: 'x2',
    },
  ],
}
