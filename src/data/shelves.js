// Reusable shelf presets. A level can use one of these as-is, or define its
// own shelves array (see level07.js, which adds `locked` shelves).

export const DEFAULT_SHELVES = [
  {
    id: 'top',
    name: 'Top Shelf',
    hint: 'Ready-to-eat & leftovers',
    color: '#7FD3B4',
    locked: false,
  },
  {
    id: 'middle',
    name: 'Middle Shelf',
    hint: 'Dairy & eggs',
    color: '#F6D24B',
    locked: false,
  },
  {
    id: 'bottom',
    name: 'Bottom Shelf',
    hint: 'Raw meat & liquids (lowest, no drips)',
    color: '#F0956B',
    locked: false,
  },
]
