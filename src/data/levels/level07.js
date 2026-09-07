import { ITEMS_BY_ID } from '../items.js'

// Level 7 — "Thai Kitchen Table": a Thai home-cooked spread instead of the
// usual grocery haul. Shelves unlock one at a time — sort a shelf correctly
// before the padlock on the next one opens.
// Food Safety Tips shown before this level starts.
export const TIPS = [
  {
    title: 'Cool Hot Food First',
    img: ITEMS_BY_ID['thai-soup'].img,
    text: 'Let hot food like soup cool down before sealing and refrigerating it, so it doesn\u2019t warm up the fridge.',
    icon: '🌡️',
    color: 'teal',
  },
  {
    title: 'Ready-to-Eat on Top',
    img: ITEMS_BY_ID['fried-chicken'].img,
    text: 'Cooked, ready-to-eat dishes go on the top shelf, away from anything raw.',
    icon: '🍱',
    color: 'yellow',
  },
  {
    title: 'Dry Goods Stay Sealed',
    img: ITEMS_BY_ID['curry-rice'].img,
    text: 'Keep packaged & dry goods like rice and noodles sealed and stored on the bottom.',
    icon: '📦',
    color: 'pink',
  },
]

export default {
  n: 7,
  tips: TIPS,
  // Items sit on a table (instead of the default side tray) and can be
  // dragged either into the fridge or into the trash can under the table.
  layout: 'table',
  locks: ['leftLower', 'door', 'freezerRight'],
  shelves: [
    {
      id: 'top',
      name: 'Top Shelf',
      hint: 'Cooked & ready-to-eat',
      color: '#7FD3B4',
      locked: false,
    },
    {
      id: 'middle',
      name: 'Middle Shelf',
      hint: 'Let hot food cool first',
      color: '#F6D24B',
      locked: true,
    },
    {
      id: 'bottom',
      name: 'Bottom Shelf',
      hint: 'Packaged & dry goods',
      color: '#F0956B',
      locked: true,
    },
  ],
  items: [
    { id: 'fried-chicken', shelf: 'top' },
    { id: 'thai-salad',    shelf: 'top' },
    { id: 'thai-soup',     shelf: 'middle' },
    { id: 'thai-tea',      shelf: 'middle' },
    { id: 'curry-rice',    shelf: 'bottom' },
    { id: 'noodle-bag',    shelf: 'bottom' },
  ],
}
