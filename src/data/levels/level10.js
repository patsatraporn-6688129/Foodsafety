import { ITEMS_BY_ID } from '../items.js'

// Level 10 — "Full Grocery Haul": the biggest sort yet — 15 items across
// every compartment in the fridge at once (3 left shelves, crisper, door
// bin, and freezer). Nothing is locked; every zone is in play.
// Food Safety Tips shown before this level starts.
export const TIPS = [
  {
    title: 'Raw Meat & Seafood Lowest',
    img: ITEMS_BY_ID['raw-chicken'].img,
    text: 'Raw meat, poultry and seafood go on the bottom shelf so they can never drip onto anything below.',
    icon: '🥩',
    color: 'teal',
  },
  {
    title: 'Fruit & Veg in the Crisper',
    img: ITEMS_BY_ID['l10-tomato'].img,
    text: 'The crisper drawer controls humidity, keeping fresh produce crisp for longer.',
    icon: '🍅',
    color: 'yellow',
  },
  {
    title: 'Frozen Stays Frozen',
    img: ITEMS_BY_ID['l5-ice-cream'].img,
    text: 'Anything frozen belongs in the freezer, never on a regular shelf or in the door.',
    icon: '🧊',
    color: 'pink',
  },
]

export default {
  n: 10,
  tips: TIPS,
  // Shown once before Tips: "went to the supermarket, now let's put it all
  // away" — sets up why there's suddenly a full cart's worth of groceries
  // to sort this round. See the <Story> component in App.jsx.
  story: {
    title: 'Grocery Run Complete!',
    sub: "You've picked up everything on the list at the supermarket.",
    caption: 'Now it\u2019s time to head home and put it all away safely —',
    highlight: "let's start organizing the fridge!",
    cta: "Let's Play! →",
  },
  // Every compartment is unlocked and in play for this level.
  locks: [],
  shelves: [
    { id: 'top', name: 'Top Shelf', hint: 'Ready-to-eat & dry goods', color: '#7FD3B4' },
    { id: 'middle', name: 'Middle Shelf', hint: 'Dairy & eggs', color: '#F6D24B' },
    { id: 'bottom', name: 'Bottom Shelf', hint: 'Raw meat & seafood, lowest', color: '#F0956B' },
    {
      id: 'crisper', name: 'Crisper', hint: 'Fruit & veg', color: '#7FD3B4',
      zone: { left: '3%', top: '48%', width: '46%', height: '15%' },
    },
    {
      id: 'door', name: 'Door Bin', hint: 'Condiments & drinks', color: '#F0956B',
      zone: { left: '53%', top: '22%', width: '43%', height: '15%' },
    },
    {
      id: 'freezer', name: 'Freezer', hint: 'Frozen', color: '#57C4A6',
      zone: { left: '53%', top: '63%', width: '43%', height: '20%' },
    },
  ],
  items: [
    { id: 'milk',        shelf: 'middle' },
    { id: 'eggs',        shelf: 'middle' },
    { id: 'raw-meat',    shelf: 'bottom' },
    { id: 'raw-salmon',  shelf: 'bottom' },
    { id: 'raw-chicken', shelf: 'bottom' },
    { id: 'l10-tomato',  shelf: 'crisper' },
    { id: 'l10-banana',  shelf: 'crisper' },
    { id: 'l3-lettuce',  shelf: 'crisper' },
    { id: 'l3-apple',    shelf: 'crisper' },
    { id: 'l5-bread',    shelf: 'top' },
    { id: 'boxed-rice',  shelf: 'top' },
    { id: 'l10-pizza',   shelf: 'top' },
    { id: 'l3-ketchup',  shelf: 'door' },
    { id: 'l3-juice',    shelf: 'door' },
    { id: 'l5-ice-cream', shelf: 'freezer' },
  ],
}
