import { ITEMS_BY_ID } from '../items.js'

// Level 4 — "Cutting Board Safety": a two-phase level.
//   Phase 1: drag each coloured cutting board (เขียง) into the fridge.
//   Phase 2: drag each raw ingredient onto the board whose colour matches it,
//            following the Thai colour-coded cutting-board system.
// Colour rules (see the infographic):
//   🔴 Red    = raw red meat (beef, pork)
//   🔵 Blue   = seafood (fish, shrimp)
//   🟡 Yellow = raw poultry (chicken)
export const TIPS = [
  {
    title: 'Red Board = Raw Meat',
    img: ITEMS_BY_ID['raw-meat'].img,
    text: 'Use the red cutting board only for raw red meat like beef and pork.',
    icon: '🔴',
    color: 'pink',
  },
  {
    title: 'Blue Board = Seafood',
    img: ITEMS_BY_ID['raw-salmon'].img,
    text: 'Fish, shrimp and other seafood go on the blue board.',
    icon: '🔵',
    color: 'teal',
  },
  {
    title: 'Yellow Board = Poultry',
    img: ITEMS_BY_ID['raw-chicken'].img,
    text: 'Raw chicken and other poultry belong on the yellow board.',
    icon: '🟡',
    color: 'yellow',
  },
  {
    title: 'Board Before Fridge',
    img: ITEMS_BY_ID['ground-pork'].img,
    text: 'Load each ingredient onto its board first — only then carry the board into the fridge.',
    icon: '🧺',
    color: 'teal',
  },
]

export default {
  n: 4,
  layout: 'boards',
  tips: TIPS,
  locks: ['crisper', 'leftFreezer', 'door', 'freezerRight'],
  // The three fridge slots a board can be dropped onto (any board, any slot).
  shelves: [
    { id: 'top',    name: 'Top Shelf' },
    { id: 'middle', name: 'Middle Shelf' },
    { id: 'bottom', name: 'Bottom Shelf' },
  ],
  // The six colour-coded cutting boards (Thai system). The player loads each
  // ingredient onto the right colour, then carries that board into the fridge.
  // Only red / blue / yellow are needed for this level's items; the rest are
  // shown for completeness (and as decoys).
  boards: [
    { id: 'white',  name: 'White Board',  color: '#f2f2f2', hint: 'Ready-to-eat food' },
    { id: 'red',    name: 'Red Board',    color: '#e0574a', hint: 'Raw red meat' },
    { id: 'green',  name: 'Green Board',  color: '#5cb85c', hint: 'Vegetables & fruit' },
    { id: 'yellow', name: 'Yellow Board', color: '#f4c430', hint: 'Raw poultry' },
    { id: 'blue',   name: 'Blue Board',   color: '#4a90d9', hint: 'Seafood' },
    { id: 'brown',  name: 'Brown Board',  color: '#8b5e3c', hint: 'Cooked / processed meat' },
  ],
  // Each ingredient names the board colour it must be placed on.
  items: [
    { id: 'raw-salmon',  board: 'blue' },
    { id: 'shrimp',      board: 'blue' },
    { id: 'raw-meat',    board: 'red' },
    { id: 'ground-pork', board: 'red' },
    { id: 'raw-chicken', board: 'yellow' },
  ],
}
