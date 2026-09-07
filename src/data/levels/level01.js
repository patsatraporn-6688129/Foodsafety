import { ITEMS_BY_ID } from '../items.js'

// Level 1 — "Fridge Assembly": instead of sorting food, the player rebuilds an
// empty fridge by dragging each part (shelf / drawer / door bin) into its slot.
// Each part carries the temperature that zone runs at, so getting a part into
// the right slot is also a food-safety temperature match.
//
// `layout: 'assembly'` tells App.jsx to render <AssemblyScene> instead of the
// food-sorting fridge + tray. Slot `pos` values are percentages of the fridge
// frame (left/top/width/height) — see AssemblyScene.jsx.

// Positions are % of the real fridge photo (same compartments the food levels
// drop onto) so the assembled parts land on the actual shelves / door bins.
export const ASSEMBLY_SLOTS = [
  { id: 'slot-top',     name: 'Top Shelf',    pos: { left: '4%',  top: '2%',  width: '44%', height: '13%' } },
  { id: 'slot-mid',     name: 'Middle Shelf', pos: { left: '4%',  top: '18%', width: '44%', height: '13%' } },
  { id: 'slot-crisper', name: 'Crisper',      pos: { left: '4%',  top: '46%', width: '44%', height: '16%' } },
  { id: 'slot-freezer', name: 'Freezer',      pos: { left: '4%',  top: '80%', width: '44%', height: '15%' } },
  { id: 'slot-door-1',  name: 'Upper Door',   pos: { left: '53%', top: '9%',  width: '43%', height: '16%' } },
  { id: 'slot-door-2',  name: 'Lower Door',   pos: { left: '53%', top: '30%', width: '43%', height: '15%' } },
]

// The 6 temperatures shown as a reference key at the bottom of the tray.
export const TEMP_KEY = ['6°C', '-18°C', '4–6°C', '0–4°C', '8°C', '6–10°C']

// Food Safety Tips shown before this level starts.
export const TIPS = [
  {
    title: 'Know Your Zones',
    img: ITEMS_BY_ID['crisper'].img,
    text: 'Every part of the fridge runs at a different temperature — match each part to its correct zone.',
    icon: '🌡️',
    color: 'teal',
  },
  {
    title: 'Coldest at the Bottom',
    img: ITEMS_BY_ID['freezer'].img,
    text: 'The freezer and lower shelves stay coldest — that\u2019s where raw meat and frozen food belong.',
    icon: '❄️',
    color: 'yellow',
  },
  {
    title: 'Door is Warmest',
    img: ITEMS_BY_ID['door-top'].img,
    text: 'Door bins are the warmest spot in the fridge — only for things that don\u2019t spoil easily.',
    icon: '🚪',
    color: 'pink',
  },
]

export default {
  n: 1,
  layout: 'assembly',
  shelves: ASSEMBLY_SLOTS,
  tips: TIPS,
  items: [
    { id: 'top-shelf',   shelf: 'slot-top' },
    { id: 'mid-shelf',   shelf: 'slot-mid' },
    { id: 'crisper',     shelf: 'slot-crisper' },
    { id: 'freezer',     shelf: 'slot-freezer' },
    { id: 'door-top',    shelf: 'slot-door-1' },
    { id: 'door-bottom', shelf: 'slot-door-2' },
  ],
}
