import { ITEMS_BY_ID } from '../items.js'

// Level 5 — "Veggie Vault": the chilled-vs-frozen level. Dairy up top, chilled
// produce & bread on the lower shelf, and anything frozen (ice cream, dumplings,
// ice) down in the freezer drawer. Custom `zone` positions put the freezer drop
// target on the bottom-left drawer of the fridge photo.
// Food Safety Tips shown before this level starts.
export const TIPS = [
  {
    title: 'Dairy Up Top',
    img: ITEMS_BY_ID['l5-milk'].img,
    text: 'The top shelf runs coldest without freezing, keeping milk fresh the longest.',
    icon: '🥛',
    color: 'teal',
  },
  {
    title: 'Chilled, Not Frozen',
    img: ITEMS_BY_ID['l5-bread'].img,
    text: 'Bread and leafy greens just need to stay cool — the lower shelf, not the freezer.',
    icon: '🥬',
    color: 'yellow',
  },
  {
    title: 'Frozen Stays Frozen',
    img: ITEMS_BY_ID['l5-ice-cream'].img,
    text: 'Ice cream and frozen dumplings belong in the freezer, never on a regular shelf.',
    icon: '🧊',
    color: 'pink',
  },
]

export default {
  n: 5,
  tips: TIPS,
  // Left column (shelves + freezer drawer) is in play; lock the whole right
  // door and the bottom-right freezer.
  locks: ['door', 'freezerRight'],
  shelves: [
    { id: 'top',     name: 'Top Shelf',   hint: 'Dairy', color: '#7FD3B4',
      zone: { left: '4%', top: '1%',  width: '44%', height: '16%' } },
    { id: 'chill',   name: 'Lower Shelf', hint: 'Chilled', color: '#F6D24B',
      zone: { left: '4%', top: '31%', width: '44%', height: '14.5%' } },
    { id: 'freezer', name: 'Freezer',     hint: 'Frozen', color: '#57C4A6',
      zone: { left: '4%', top: '80%', width: '44%', height: '14%' } },
  ],
  items: [
    { id: 'l5-milk',      shelf: 'top' },
    { id: 'l5-lettuce',   shelf: 'chill' },
    { id: 'l5-bread',     shelf: 'chill' },
    { id: 'l5-ice-cream', shelf: 'freezer' },
    { id: 'l5-dumplings', shelf: 'freezer' },
    { id: 'l5-ice',       shelf: 'freezer' },
  ],
}
