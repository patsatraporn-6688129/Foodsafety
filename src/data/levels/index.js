// Add a new level? 1) create `levelNN.js` next to this file (copy an
// existing one as a template), 2) import it below and add it to LEVEL_FILES.
// That's it — App.jsx never needs to change.

import { ITEMS_BY_ID, itemsInCategory } from '../items.js'
import level01 from './level01.js'
import level02 from './level02.js'
import level03 from './level03.js'
import level04 from './level04.js'
import level05 from './level05.js'
import level06, { DIFFICULTY_POOLS } from './level06.js'
import level07 from './level07.js'
import level08 from './level08.js'
import level09 from './level09.js'
import level10 from './level10.js'

const LEVEL_FILES = [level01, level02, level03, level04, level05, level06, level07, level08, level09, level10]

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Randomly draws `count` items from each {category, count} pool, straight
// from the shared catalog — never a hardcoded list. Called fresh every time
// a randomize-type level starts, so the picks (and therefore which images
// show up) are different each play.
export const pickRandomItems = (pools) =>
  pools.flatMap(({ category, count }) => shuffle(itemsInCategory(category)).slice(0, count))

// Turn a level file's item id + shelf pairs into full item objects
// (label/img) pulled from the shared catalog. Randomize-type levels skip
// this — their items are resolved at play-time by pickRandomItems() instead.
const buildLevelSet = (levelFile) => ({
  n: levelFile.n,
  shelves: levelFile.shelves,
  // Compartment keys to grey-out + padlock for this level (see Fridge.jsx).
  locks: levelFile.locks || [],
  // 'table' (Level 7) shows a table + trash can instead of the default
  // side tray; 'assembly' (Level 1) shows the fridge-parts scene instead of
  // the food-sorting fridge; omitted / anything else falls back to the tray.
  layout: levelFile.layout || 'tray',
  // Coloured cutting boards for 'boards'-layout levels (Level 4); undefined otherwise.
  boards: levelFile.boards || null,
  // Food Safety Tips shown on the Tips screen before this level starts.
  // Levels without their own set (e.g. Level 6's randomize levels, or any
  // level number that falls back to DEFAULT_LEVEL_SET) leave this empty —
  // App.jsx falls back to the generic TIPS list in that case.
  tips: levelFile.tips || [],
  // Optional itemId -> shelfId map of where items start out (instead of the
  // tray). Used by "fix the mistakes" levels like Level 9, where every item
  // begins already placed, deliberately in the wrong zone. Levels without
  // this just default to the normal empty-tray start (see App.jsx).
  startPlacements: levelFile.startPlacements || null,
  // Optional one-time "story" screen shown before Tips when a level opens
  // with a scripted intro (e.g. Level 10's supermarket run). Omitted for
  // every level without one — see App.jsx's storyForLevel().
  story: levelFile.story || null,
  ...(levelFile.randomize
    ? { randomize: levelFile.randomize }
    // Spread the whole item def so extra fields (e.g. `board` for Level 4)
    // carry through alongside the catalog's label/img.
    : { items: levelFile.items.map((it) => ({ ...ITEMS_BY_ID[it.id], ...it })) }),
})

// { 2: {n, shelves, items}, 6: {n, shelves, randomize}, 7: {...}, ... }
export const LEVEL_SETS = Object.fromEntries(
  LEVEL_FILES.map((lvl) => [lvl.n, buildLevelSet(lvl)])
)

// Fallback used by any level number that doesn't have its own file yet
// (levels 8–20, ...). Currently reuses Level 2's set.
export const DEFAULT_LEVEL_SET = LEVEL_SETS[2]

export { DIFFICULTY_POOLS }
