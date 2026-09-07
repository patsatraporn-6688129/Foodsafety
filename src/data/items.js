// Central catalog of every food item art asset used anywhere in the game.
// Levels don't own images directly — they just reference an id here and say
// which shelf that id belongs on for *that* level (see data/levels/*.js).

import fridgeImg from '../assets/fridge.png'
import rawSalmon from '../assets/raw-salmon.png'
import rawMeat from '../assets/raw-meat.png'

// Level 2 — "Soda Stack" grocery-haul icons (also the DEFAULT set reused by
// levels without their own file; salad & soup are shared with Level 7).
import boxedRice from '../assets/level2/boxed-rice.png'
import salad from '../assets/level2/salad.png'
import cake from '../assets/level2/cake.png'
import milk from '../assets/level2/milk.png'
import eggs from '../assets/level2/eggs.png'
import rawChicken from '../assets/level2/raw-chicken.png'
import rawPork from '../assets/level2/raw-pork.png'
import soup from '../assets/level2/soup.png'

// Level 7 — Thai Kitchen Table icons
import friedChicken from '../assets/level7/fried-chicken.svg'
import tea from '../assets/level7/tea.svg'
import curryRice from '../assets/level7/curry-rice.svg'
import noodlesBag from '../assets/level7/noodles-bag.svg'

// Level 4 — Raw Meat & Seafood icons
import shrimp from '../assets/level4/shrimp.svg'
import groundPork from '../assets/level4/ground-pork.svg'

// Level 1 — Fridge-assembly parts (each carries the temperature its slot runs at)
import glassShelf from '../assets/level1/glass-shelf.svg'
import doorBin from '../assets/level1/door-bin.svg'
import crisperDrawer from '../assets/level1/drawer.svg'
import freezerDrawer from '../assets/level1/freezer-drawer.svg'

// Level 3 — "Dairy Drawer": produce, condiments & spreads
import l3Lettuce from '../assets/level3/lettuce.svg'
import l3Broccoli from '../assets/level3/broccoli.svg'
import l3Apple from '../assets/level3/apple.svg'
import l3Carrot from '../assets/level3/carrot.svg'
import l3Juice from '../assets/level3/juice.svg'
import l3Ketchup from '../assets/level3/ketchup.svg'
import l3Chili from '../assets/level3/chili-sauce.svg'
import l3Butter from '../assets/level3/butter.svg'

// Level 5 — "Veggie Vault": chilled vs frozen storage
import l5IceCream from '../assets/level5/ice-cream.svg'
import l5Dumplings from '../assets/level5/frozen-dumplings.svg'
import l5Bread from '../assets/level5/bread.svg'
import l5Lettuce from '../assets/level5/lettuce.svg'
import l5Milk from '../assets/level5/milk.svg'
import l5Ice from '../assets/level5/ice.svg'

// Level 6 — "FEFO Queue": items with different expiry dates the player must
// arrange in shelf order (soonest expiry up front). `expiry` shows as a
// small badge on the item's chip so the player has what they need to work
// out the correct order themselves.
import l6Milk from '../assets/level6/milk.svg'
import l6Pudding from '../assets/level6/pudding.svg'
import l6Ham from '../assets/level6/ham.svg'
import l6Juice from '../assets/level6/juice.svg'
import l6Cheese from '../assets/level6/cheese.svg'
import l6ZoomShelf from '../assets/level6/zoom-shelf.png'

// Level 10 — "Full Grocery Haul": a big 15-item sort using every compartment
// in the fridge (shelves, crisper, door, freezer) at once.
import l10Tomato from '../assets/level10/tomato.svg'
import l10Banana from '../assets/level10/banana.svg'
import l10Pizza from '../assets/level10/pizza.svg'

export const FRIDGE_IMG = fridgeImg
// Close-up photo of a single fridge shelf, shown when the player taps the
// "Click to zoom" shelf in Level 6 (see components/ZoomShelf.jsx).
export const ZOOM_SHELF_IMG = l6ZoomShelf

export const ITEMS_BY_ID = {
  'boxed-rice':    { id: 'boxed-rice',    label: 'Boxed Rice',   img: boxedRice, category: 'savory', shelf: 'top' },
  'salad':         { id: 'salad',         label: 'Salad',        img: salad },
  'cake':          { id: 'cake',          label: 'Cake',         img: cake, category: 'sweet', shelf: 'top' },
  'milk':          { id: 'milk',          label: 'Milk',         img: milk, category: 'dairy', shelf: 'middle' },
  'eggs':          { id: 'eggs',          label: 'Eggs',         img: eggs, category: 'dairy', shelf: 'middle' },
  'raw-chicken':   { id: 'raw-chicken',   label: 'Raw Chicken',  img: rawChicken, category: 'savory', shelf: 'bottom' },
  'raw-pork':      { id: 'raw-pork',      label: 'Raw Pork',     img: rawPork, category: 'savory', shelf: 'bottom' },
  'soup':          { id: 'soup',          label: 'Soup',         img: soup, category: 'savory', shelf: 'bottom' },

  'fried-chicken': { id: 'fried-chicken', label: 'Fried Chicken', img: friedChicken, category: 'savory', shelf: 'top' },
  'thai-salad':    { id: 'thai-salad',    label: 'Salad',         img: salad },
  'thai-soup':     { id: 'thai-soup',     label: 'Soup',          img: soup },
  'thai-tea':      { id: 'thai-tea',      label: 'Thai Tea',      img: tea, category: 'drink', shelf: 'middle' },
  'curry-rice':    { id: 'curry-rice',    label: 'Curry & Rice',  img: curryRice, category: 'savory', shelf: 'bottom' },
  'noodle-bag':    { id: 'noodle-bag',    label: 'Noodle Salad',  img: noodlesBag, category: 'savory', shelf: 'bottom' },

  'raw-salmon':    { id: 'raw-salmon',    label: 'Raw Salmon',    img: rawSalmon },
  'shrimp':        { id: 'shrimp',        label: 'Shrimp',        img: shrimp },
  'raw-meat':      { id: 'raw-meat',      label: 'Raw Meat',      img: rawMeat },
  'ground-pork':   { id: 'ground-pork',   label: 'Ground Pork',   img: groundPork },

  // Level 1 — fridge parts. `temp` shows on the part's thermometer badge and
  // is the hint the player matches to the right slot.
  'top-shelf':     { id: 'top-shelf',     label: 'Top Shelf',     img: glassShelf,    temp: '4–6°C',  part: 'shelf' },
  'mid-shelf':     { id: 'mid-shelf',     label: 'Middle Shelf',  img: glassShelf,    temp: '0–4°C',  part: 'shelf' },
  'crisper':       { id: 'crisper',       label: 'Crisper Drawer',img: crisperDrawer, temp: '6–10°C', part: 'drawer' },
  'freezer':       { id: 'freezer',       label: 'Freezer Drawer',img: freezerDrawer, temp: '-18°C',  part: 'drawer' },
  'door-top':      { id: 'door-top',      label: 'Upper Door Bin',img: doorBin,       temp: '6°C',    part: 'bin' },
  'door-bottom':   { id: 'door-bottom',   label: 'Lower Door Bin',img: doorBin,       temp: '8°C',    part: 'bin' },

  // Level 3 — Dairy Drawer
  'l3-lettuce':    { id: 'l3-lettuce',    label: 'Lettuce',      img: l3Lettuce },
  'l3-broccoli':   { id: 'l3-broccoli',   label: 'Broccoli',     img: l3Broccoli },
  'l3-apple':      { id: 'l3-apple',      label: 'Apple',        img: l3Apple },
  'l3-carrot':     { id: 'l3-carrot',     label: 'Carrot',       img: l3Carrot },
  'l3-juice':      { id: 'l3-juice',      label: 'Juice',        img: l3Juice, category: 'drink', shelf: 'middle' },
  'l3-ketchup':    { id: 'l3-ketchup',    label: 'Ketchup',      img: l3Ketchup },
  'l3-chili':      { id: 'l3-chili',      label: 'Chili Sauce',  img: l3Chili },
  'l3-butter':     { id: 'l3-butter',     label: 'Butter',       img: l3Butter, category: 'dairy', shelf: 'middle' },

  // Level 5 — Veggie Vault (chilled vs frozen)
  'l5-ice-cream':  { id: 'l5-ice-cream',  label: 'Ice Cream',       img: l5IceCream, category: 'sweet', shelf: 'top' },
  'l5-dumplings':  { id: 'l5-dumplings',  label: 'Frozen Dumplings',img: l5Dumplings },
  'l5-bread':      { id: 'l5-bread',      label: 'Bread',           img: l5Bread, category: 'sweet', shelf: 'top' },
  'l5-lettuce':    { id: 'l5-lettuce',    label: 'Lettuce',         img: l5Lettuce },
  'l5-milk':       { id: 'l5-milk',       label: 'Milk',            img: l5Milk },
  'l5-ice':        { id: 'l5-ice',        label: 'Ice',             img: l5Ice },

  // Level 6 — FEFO Queue (sorted here soonest → latest; `shelf` in the level
  // file is what actually decides correctness — see data/levels/level06.js)
  // `expiry` now shows the real best-before date (D/M/BE) instead of a
  // "days left" countdown, so the player has to compare actual dates —
  // today in-game is 20/05/69.
  'l6-milk':       { id: 'l6-milk',       label: 'Milk',            img: l6Milk,    expiry: '21/05/69' },
  'l6-pudding':    { id: 'l6-pudding',    label: 'Pudding Cup',     img: l6Pudding, expiry: '23/05/69' },
  'l6-ham':        { id: 'l6-ham',        label: 'Sliced Ham',      img: l6Ham,     expiry: '25/05/69' },
  'l6-juice':      { id: 'l6-juice',      label: 'Orange Juice',    img: l6Juice,   expiry: '28/05/69' },
  'l6-cheese':     { id: 'l6-cheese',     label: 'Cheese Block',    img: l6Cheese,  expiry: '03/06/69' },

  // Level 10 — Full Grocery Haul (new items not covered by earlier levels)
  'l10-tomato':    { id: 'l10-tomato',    label: 'Tomato',          img: l10Tomato },
  'l10-banana':    { id: 'l10-banana',    label: 'Banana',          img: l10Banana },
  'l10-pizza':     { id: 'l10-pizza',     label: 'Pizza',           img: l10Pizza },

  // Level 8 — "Fridge Thermometers": same 6 zones as Level 1's fridge-assembly,
  // but the parts being placed are colour-coded thermometers (no shelf/drawer
  // art) instead of physical fridge parts. `thermo: true` tells AssemblyScene
  // to render the big Thermometer glyph as the item's art instead of an <img>.
  // `color` is an explicit override (not derived from the temperature number)
  // so the two 6°C door bins can still look visually distinct.
  'therm-top':         { id: 'therm-top',         label: 'Top Shelf',      temp: '4–6°C',  color: 'blue',  thermo: true, part: 'shelf' },
  'therm-mid':         { id: 'therm-mid',         label: 'Middle Shelf',   temp: '0–4°C',  color: 'blue',  thermo: true, part: 'shelf' },
  'therm-crisper':     { id: 'therm-crisper',     label: 'Crisper Drawer',temp: '6–10°C', color: 'green', thermo: true, part: 'drawer' },
  'therm-freezer':     { id: 'therm-freezer',     label: 'Freezer Drawer',temp: '-18°C',  color: 'blue',  thermo: true, part: 'drawer' },
  'therm-door-top':    { id: 'therm-door-top',    label: 'Upper Door Bin',temp: '6°C',    color: 'red',   thermo: true, part: 'bin' },
  'therm-door-bottom': { id: 'therm-door-bottom', label: 'Lower Door Bin',temp: '6°C',    color: 'green', thermo: true, part: 'bin' },
}

// Used by "randomize"-type levels (see data/levels/level06.js): returns every
// catalog item tagged with a given `category`, each already carrying its own
// canonical correct `shelf` — nothing about the picks is ever hardcoded per
// level, it's always pulled live from this shared catalog.
export const itemsInCategory = (category) =>
  Object.values(ITEMS_BY_ID).filter((it) => it.category === category)
