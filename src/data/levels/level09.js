import { ITEMS_BY_ID } from '../items.js'

// Level 9 — "Fridge Fix-Up": unlike every earlier level, nothing starts in
// the side tray. All six items are dropped straight into the fridge photo
// already — but every single one is in the WRONG zone (see `startPlacements`
// below). The player has to drag each item to where it actually belongs;
// there's nothing to place from scratch, only mistakes to correct.
//
// Correct answer key (see `items[].shelf`, which scoring/reveal always
// checks against):
//   raw-chicken (raw meat)      -> bottom shelf
//   l5-bread    (bakery, RTE)   -> top shelf
//   l6-ham      (deli meat, RTE)-> top shelf
//   curry-rice  (cooked leftover)-> top shelf
//   milk        (dairy)         -> middle shelf
//   l3-lettuce  (produce)       -> crisper drawer
//
// Starting (wrong) spots come straight from the mockup: chicken up top,
// bread on the 2nd shelf, lettuce + ham together on the 3rd shelf, a bowl of
// leftovers in the crisper drawer, and milk sitting in the door.
export const TIPS = [
  {
    title: 'Raw Meat Goes Lowest',
    img: ITEMS_BY_ID['raw-chicken'].img,
    text: 'Raw meat belongs on the bottom shelf so it can never drip onto anything below it.',
    icon: '🥩',
    color: 'teal',
  },
  {
    title: 'Cooked & Ready-to-Eat on Top',
    img: ITEMS_BY_ID['curry-rice'].img,
    text: 'Leftovers, deli meat, and bakery items go on the top shelf — furthest from raw food.',
    icon: '🍱',
    color: 'yellow',
  },
  {
    title: 'Dairy Off the Door',
    img: ITEMS_BY_ID['milk'].img,
    text: 'The door warms up every time it opens. Milk stays fresher on a real shelf, not in a door bin.',
    icon: '🥛',
    color: 'pink',
  },
]

export default {
  n: 9,
  layout: 'fix',
  tips: TIPS,
  // Everything starts already inside the fridge (see startPlacements), so
  // this level is really just "fix the mistakes" — no tray placing needed.
  // Lock only the unused freezer drawers; the crisper and the top door bin
  // are both real drop zones this time.
  locks: ['leftFreezer', 'freezerRight'],
  shelves: [
    { id: 'top', name: 'Top Shelf', hint: 'Cooked & ready-to-eat', color: '#7FD3B4' },
    { id: 'middle', name: 'Middle Shelf', hint: 'Dairy & eggs', color: '#F6D24B' },
    { id: 'bottom', name: 'Bottom Shelf', hint: 'Raw meat, lowest', color: '#F0956B' },
    {
      id: 'crisper', name: 'Crisper', hint: 'Fresh produce', color: '#7FD3B4',
      zone: { left: '3%', top: '48%', width: '46%', height: '15%' },
    },
    {
      id: 'door', name: 'Door Bin', hint: 'Not for dairy!', color: '#F0956B',
      zone: { left: '53%', top: '12%', width: '43%', height: '15%' },
    },
  ],
  items: [
    { id: 'raw-chicken', shelf: 'bottom' },
    { id: 'l5-bread',    shelf: 'top' },
    { id: 'l6-ham',      shelf: 'top', expiry: undefined },
    { id: 'curry-rice',  shelf: 'top' },
    { id: 'milk',        shelf: 'middle' },
    { id: 'l3-lettuce',  shelf: 'crisper' },
  ],
  // Every item's STARTING zone — deliberately wrong for all six. Any item
  // id not listed here would fall back to the tray (null), but this level
  // leaves nothing in the tray on purpose.
  startPlacements: {
    'raw-chicken': 'top',
    'l5-bread': 'middle',
    'l6-ham': 'bottom',
    'curry-rice': 'crisper',
    'milk': 'door',
    'l3-lettuce': 'bottom',
  },
}
