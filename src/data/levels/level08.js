import { ITEMS_BY_ID } from '../items.js'
import { ASSEMBLY_SLOTS } from './level01.js'

// Level 8 — "Fridge Thermometers": same fridge-assembly mechanic as Level 1
// (drag each part into its matching slot), but this time the parts are
// plain colour-coded thermometers instead of physical shelf/drawer art —
// the player is matching a reading straight to the zone it belongs in.
//
// Reuses Level 1's exact slot positions (ASSEMBLY_SLOTS) since it's the same
// fridge zones, just re-skinned. `layout: 'assembly'` renders <AssemblyScene>.

// Food Safety Tips shown before this level starts.
// Tips reuse Level 1's fridge-part art (crisper/freezer/door-top) since the
// thermo items themselves have no illustration — just a coloured glyph.
export const TIPS = [
  {
    title: 'Every Zone Has a Number',
    img: ITEMS_BY_ID['crisper'].img,
    text: 'Each part of the fridge runs at its own temperature — match the reading to the zone it belongs in.',
    icon: '🌡️',
    color: 'teal',
  },
  {
    title: 'Colder Down and Away',
    img: ITEMS_BY_ID['freezer'].img,
    text: 'The freezer and lower shelves run coldest — that\u2019s where raw meat and frozen food need to sit.',
    icon: '❄️',
    color: 'yellow',
  },
  {
    title: 'Door Bins Run Warmest',
    img: ITEMS_BY_ID['door-top'].img,
    text: 'Every time the door opens, the bins warm up fastest — only put things there that can take it.',
    icon: '🚪',
    color: 'pink',
  },
]

export default {
  n: 8,
  layout: 'assembly',
  shelves: ASSEMBLY_SLOTS,
  tips: TIPS,
  items: [
    { id: 'therm-top',         shelf: 'slot-top' },
    { id: 'therm-mid',         shelf: 'slot-mid' },
    { id: 'therm-crisper',     shelf: 'slot-crisper' },
    { id: 'therm-freezer',     shelf: 'slot-freezer' },
    { id: 'therm-door-top',    shelf: 'slot-door-1' },
    { id: 'therm-door-bottom', shelf: 'slot-door-2' },
  ],
}
