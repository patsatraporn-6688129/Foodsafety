// Food items and the fridge shelves they belong on (food-safety rules).
// Shelf ids: "top" = ready-to-eat / leftovers, "middle" = dairy,
// "bottom" = raw meat & liquids (kept low so juices can't drip onto other food).

import fridgeImg from './assets/fridge.png'
import boxedRice from './assets/boxed-rice.png'
import salad from './assets/salad.png'
import cake from './assets/cake.png'
import milk from './assets/milk.png'
import eggs from './assets/eggs.png'
import rawChicken from './assets/raw-chicken.png'
import rawPork from './assets/raw-pork.png'
import soup from './assets/soup.png'

export const FRIDGE_IMG = fridgeImg

export const SHELVES = [
  {
    id: 'top',
    name: 'Top Shelf',
    hint: 'Ready-to-eat & leftovers',
    color: '#7FD3B4',
  },
  {
    id: 'middle',
    name: 'Middle Shelf',
    hint: 'Dairy & eggs',
    color: '#F6D24B',
  },
  {
    id: 'bottom',
    name: 'Bottom Shelf',
    hint: 'Raw meat & liquids (lowest, no drips)',
    color: '#F0956B',
  },
]

export const ITEMS = [
  { id: 'boxed-rice',  label: 'Boxed Rice',  img: boxedRice,  shelf: 'top' },
  { id: 'salad',       label: 'Salad',       img: salad,      shelf: 'top' },
  { id: 'cake',        label: 'Cake',        img: cake,       shelf: 'top' },
  { id: 'milk',        label: 'Milk',        img: milk,       shelf: 'middle' },
  { id: 'eggs',        label: 'Eggs',        img: eggs,       shelf: 'middle' },
  { id: 'raw-chicken', label: 'Raw Chicken', img: rawChicken, shelf: 'bottom' },
  { id: 'raw-pork',    label: 'Raw Pork',    img: rawPork,    shelf: 'bottom' },
  { id: 'soup',        label: 'Soup',        img: soup,       shelf: 'bottom' },
]

export const TIPS = [
  {
    title: 'Raw Food',
    img: rawChicken,
    text: 'Keep raw meat on the bottom shelf, away from cooked food.',
  },
  {
    title: 'Cooked Food',
    img: cake,
    text: 'Store cooked & ready-to-eat food up top, separate from raw food.',
  },
  {
    title: 'Dairy',
    img: milk,
    text: 'Milk and eggs stay cool in the middle of the fridge.',
  },
]

// Level Selection screen. `stars` = earned (null = not yet played / locked).
export const LEVELS = [
  { n: 1, name: 'The Snack Bin', color: '#f4a3a3', stars: 3, unlocked: true },
  { n: 2, name: 'Soda Stack',    color: '#7fd3b4', stars: 3, unlocked: true },
  { n: 3, name: 'Dairy Drawer',  color: '#f4de3b', stars: 3, unlocked: true },
  { n: 4, name: 'Fruit Oasis',   color: '#f7c6c6', stars: 3, unlocked: true },
  { n: 5, name: 'Veggie Vault',  color: '#0d7355', stars: 3, unlocked: true },
  { n: 6, name: 'Sauce Station', color: '#57c4a6', stars: 0, unlocked: true, current: true },
  { n: 7, name: '???', locked: true, needStars: 25 },
  { n: 8, name: '???', locked: true, needStars: 30 },
  { n: 9, name: '???', locked: true, needStars: 35 },
  { n: 10, name: '???', locked: true, needStars: 40 },
  { n: 11, name: '???', locked: true, needStars: 45 },
  { n: 12, name: '???', locked: true, needStars: 50 },
]

// Stars the player currently has (drives the "Level Locked" progress bar).
export const PLAYER_STARS = 15

export const LEVEL_TIME = 180 // seconds (3:00)
export const CORRECT_POINTS = 300
export const WRONG_POINTS = -75
export const TIME_BONUS_PER_SEC = 10 // added on a perfect sort
export const START_SCORE = 480 // matches the HUD score in the mockups

// Rewards screen (static showcase, matching the mockup)
export const REWARDS = {
  unlockedCount: 12,
  totalCount: 48,
  mysteryCountdown: '04:12:35',
  items: [
    { name: 'Golden Croissant', emoji: '🥐', state: 'claimed' },
    { name: 'Rainbow Cake', emoji: '🍰', state: 'unlock' },
    { name: 'Shiny Soda', emoji: '🥤', state: 'locked', unlockAt: 'LVL 15' },
  ],
  achievements: [
    { name: 'Master Sorter', desc: 'Organize 500 total items.', pct: 85, icon: '⭐', color: '#57c4a6' },
    { name: 'Speed Demon', desc: 'Finish a level in under 60 seconds.', pct: 40, icon: '⚡', color: '#f4de3b' },
    { name: 'Clean Fridge', desc: 'Achieve 3 stars on all Level 1 stages.', pct: 100, icon: '🧼', color: '#f4a08c' },
  ],
}
