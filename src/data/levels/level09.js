import { ITEMS_BY_ID } from '../items.js'

// Level 9 — a standard sort like every other level: all six items start in
// the side tray/board and the player places each one into the correct fridge
// zone.
//
// Correct answer key (see `items[].shelf`, which scoring/reveal always
// checks against):
//   raw-chicken (raw meat)      -> bottom shelf
//   l5-bread    (bakery, RTE)   -> top shelf
//   l6-ham      (deli meat, RTE)-> top shelf
//   curry-rice  (cooked leftover)-> top shelf
//   milk        (dairy)         -> middle shelf
//   l3-lettuce  (produce)       -> crisper drawer
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
  tips: TIPS,
  // Whole fridge open — no padlocked compartments.
  locks: [],
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
      zone: { left: '53%', top: '22%', width: '43%', height: '15%' },
    },
  ],
  items: [
    { id: 'raw-chicken', shelf: 'bottom' },
    { id: 'l5-bread',    shelf: 'top' },
    { id: 'l6-ham',      shelf: 'top' },
    { id: 'curry-rice',  shelf: 'top' },
    { id: 'milk',        shelf: 'middle' },
    { id: 'l3-lettuce',  shelf: 'crisper' },
  ],
}
