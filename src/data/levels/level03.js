import { ITEMS_BY_ID } from '../items.js'

// Level 3 — "Dairy Drawer": produce, condiments & spreads go to their proper
// homes — sauces & drinks in the door, spreads on the butter shelf, and fruit
// & veg in the crisper. Each shelf carries a custom `zone` (position on the
// fridge photo, in %) so drop targets can sit on the door and crisper, not just
// the default three left-hand shelves.
// Food Safety Tips shown before this level starts.
export const TIPS = [
  {
    title: 'Fruit & Veg in the Crisper',
    img: ITEMS_BY_ID['l3-carrot'].img,
    text: 'The crisper drawer controls humidity, keeping fresh produce crisp for longer.',
    icon: '🥕',
    color: 'teal',
  },
  {
    title: 'Condiments in the Door',
    img: ITEMS_BY_ID['l3-ketchup'].img,
    text: 'Sauces and dressings are shelf-stable enough for the door, the warmest part of the fridge.',
    icon: '🧂',
    color: 'yellow',
  },
  {
    title: 'Butter Stays Put',
    img: ITEMS_BY_ID['l3-butter'].img,
    text: 'Spreads like butter belong in their own compartment, not loose on a shelf.',
    icon: '🧈',
    color: 'pink',
  },
]

export default {
  n: 3,
  tips: TIPS,
  // In play: butter shelf (2nd from top), crisper, and the right door. Lock the
  // empty left shelves (top + the one between butter & crisper) and the freezer.
  locks: ['leftTop', 'leftMid', 'leftFreezer'],
  shelves: [
    { id: 'door-top', name: 'Door — Top', hint: 'Condiments', color: '#F0956B',
      zone: { left: '53%', top: '6%', width: '43%', height: '15%' } },
    { id: 'door-low', name: 'Door — Low', hint: 'Drinks', color: '#7FD3B4',
      zone: { left: '53%', top: '22%', width: '43%', height: '15%' } },
    { id: 'butter',   name: 'Butter',     hint: 'Spreads', color: '#F6D24B',
      zone: { left: '5%',  top: '17%', width: '34%', height: '15%' } },
    { id: 'crisper',  name: 'Crisper',    hint: 'Fruit & veg', color: '#7FD3B4',
      zone: { left: '3%',  top: '48%', width: '46%', height: '15%' } },
  ],
  items: [
    { id: 'l3-ketchup',  shelf: 'door-top' },
    { id: 'l3-chili',    shelf: 'door-top' },
    { id: 'l3-juice',    shelf: 'door-low' },
    { id: 'l3-butter',   shelf: 'butter' },
    { id: 'l3-lettuce',  shelf: 'crisper' },
    { id: 'l3-broccoli', shelf: 'crisper' },
    { id: 'l3-apple',    shelf: 'crisper' },
    { id: 'l3-carrot',   shelf: 'crisper' },
  ],
}
