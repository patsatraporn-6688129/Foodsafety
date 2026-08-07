# 🧊 Fridge Master

A React food-safety sorting game built from the "Fridge Master / Store It Right" mockups.
Sort foods onto the correct fridge shelf before the timer runs out.

## How to play
1. **Play** → read the **Food Safety Tips** → **Start Sorting!**
2. Move each item from the tray onto the right shelf. Two ways:
   - **Drag & drop** the item onto a shelf (desktop), or
   - **Tap an item** to pick it up, then **tap a shelf** to drop it (works on touch).
   - Tap an already-placed item to send it back to the tray.
3. When all 8 items are placed, press **Check Answers**.
4. Correct picks are marked ✓, wrong ones ✗. Score = correct × 100, minus wrong,
   plus a time bonus on a perfect sort.

## Food-safety rules (win condition)
Matches the answer-key PDF:

| Shelf | Rule | Items |
|-------|------|-------|
| **Top** | Ready-to-eat & leftovers | Boxed Rice, Salad, Cake |
| **Middle** | Dairy & eggs | Milk, Eggs |
| **Bottom** | Raw meat & liquids (lowest, so juices can't drip) | Raw Chicken, Raw Pork, Soup |

## Run it
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

## Structure
- `src/gameData.js` — items, shelves, tips, scoring constants (edit to add levels/items).
- `src/App.jsx` — screens (menu / tips / game / result), timer, scoring.
- `src/components/` — `Fridge`, `Tray`, `ItemChip`, `Modal`.
- `src/styles.css` — the visual theme from the mockups.
