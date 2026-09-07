import { DEFAULT_SHELVES } from '../shelves.js'
import { ITEMS_BY_ID } from '../items.js'

// Level 2 — "Soda Stack": the original grocery haul. This is also reused as
// the DEFAULT set for any level that doesn't have its own file yet.

// Food Safety Tips shown before this level starts.
export const TIPS = [
  {
    title: 'Raw Food',
    img: ITEMS_BY_ID['raw-chicken'].img,
    text: 'Keep away from cooked food',
    icon: '❄️',
    color: 'teal',
  },
  {
    title: 'Cooked Food',
    img: ITEMS_BY_ID['cake'].img,
    text: 'Store separately from raw food',
    icon: '🍲',
    color: 'yellow',
  },
  {
    title: 'Vegetables',
    img: ITEMS_BY_ID['l3-lettuce'].img,
    text: 'Avoid contact with raw meat.',
    icon: '🥬',
    color: 'pink',
  },
]

export default {
  n: 2,
  shelves: DEFAULT_SHELVES,
  tips: TIPS,
  // Only the left-hand shelves are in play — grey out the door, crisper/freezer
  // and bottom-right freezer so it's clear where items go.
  locks: ['leftLower', 'door', 'freezerRight'],
  items: [
    { id: 'boxed-rice',  shelf: 'top' },
    { id: 'salad',       shelf: 'top' },
    { id: 'cake',        shelf: 'top' },
    { id: 'milk',        shelf: 'middle' },
    { id: 'eggs',        shelf: 'middle' },
    { id: 'raw-chicken', shelf: 'bottom' },
    { id: 'raw-pork',    shelf: 'bottom' },
    { id: 'soup',        shelf: 'bottom' },
  ],
}
