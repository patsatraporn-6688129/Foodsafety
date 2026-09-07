import { ITEMS_BY_ID } from '../items.js'

// Kept for backward compatibility: data/levels/index.js and App.jsx still
// import this name (it feeds the currently-dormant difficulty-select screen).
// Level 6 no longer randomizes its items, so this pool list isn't consumed
// here anymore — it's just re-exported so nothing else has to change.
export const DIFFICULTY_POOLS = {
  1: [{ category: 'savory', count: 2 }, { category: 'sweet', count: 1 }],
  2: [{ category: 'savory', count: 3 }, { category: 'sweet', count: 2 }],
  3: [
    { category: 'savory', count: 3 }, { category: 'sweet', count: 2 },
    { category: 'dairy', count: 2 }, { category: 'drink', count: 2 },
  ],
}

// Level 6 — "FEFO Queue" (First Expire, First Out): instead of sorting items
// into fridge zones, the player lines them up in ONE row of numbered slots
// that stand in for a shelf viewed front-to-back. Each item shows its real
// best-before date (see its `expiry` field, added in data/items.js) — the
// item expiring soonest belongs in slot 1 (the front, grabbed first), and
// the one with the longest life left goes all the way in the back.
//
// `layout: 'fridge-zoom'` tells App.jsx to open on the normal fridge photo
// (same one every other level uses) with every compartment padlocked except
// one shelf that says "🔍 Click to zoom". Tapping it swaps in <ZoomShelf>,
// a close-up photo of just that shelf, where the actual FEFO ordering plays
// out. Under the hood each slot is still just a `shelf` id like any other
// level — `items[].shelf` names the ONE correct slot for that item, so
// every bit of shared game logic (scoring, hints, the reveal correct/wrong
// marks, "Not Passed Yet" vs "Level Completed") works completely unchanged.
export const QUEUE_SLOTS = [
  { id: 'pos-1', name: '1st — Use First' },
  { id: 'pos-2', name: '2nd' },
  { id: 'pos-3', name: '3rd' },
  { id: 'pos-4', name: '4th' },
  { id: 'pos-5', name: '5th — Use Last' },
]

// Food Safety Tips shown before this level starts.
export const TIPS = [
  {
    title: 'First Expire, First Out',
    img: ITEMS_BY_ID['l6-milk'].img,
    text: 'FEFO means using the item that will spoil soonest before any of the others, even if it arrived last.',
    icon: '⏳',
    color: 'teal',
  },
  {
    title: 'Soonest Goes Up Front',
    img: ITEMS_BY_ID['l6-pudding'].img,
    text: 'Line items up by how many days they have left — the one expiring soonest sits at the front, ready to grab first.',
    icon: '➡️',
    color: 'yellow',
  },
  {
    title: 'Longest Life in the Back',
    img: ITEMS_BY_ID['l6-cheese'].img,
    text: 'Items with plenty of shelf life left can wait — keep them toward the back of the queue.',
    icon: '📦',
    color: 'pink',
  },
]

export default {
  n: 6,
  layout: 'fridge-zoom',
  tips: TIPS,
  // Padlock every compartment except the top-left shelf — that one shows
  // "🔍 Click to zoom" instead and opens the close-up FEFO shelf.
locks: ['leftUpperMid', 'leftMid', 'crisper', 'leftFreezer', 'door', 'freezerRight'],
  shelves: QUEUE_SLOTS,
  items: [
    { id: 'l6-milk',    shelf: 'pos-1' }, // 1 day left  — use first
    { id: 'l6-pudding', shelf: 'pos-2' }, // 3 days left
    { id: 'l6-ham',     shelf: 'pos-3' }, // 5 days left
    { id: 'l6-juice',   shelf: 'pos-4' }, // 8 days left
    { id: 'l6-cheese',  shelf: 'pos-5' }, // 14 days left — use last
  ],
}
