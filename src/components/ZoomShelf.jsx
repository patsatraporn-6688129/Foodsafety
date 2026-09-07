import { ZOOM_SHELF_IMG } from '../data/items.js'
import ItemChip from './ItemChip.jsx'

// Level 6 — the "zoomed in" close-up of the one shelf the player is allowed
// to use. Reached by tapping the "🔍 Click to zoom" shelf in <Fridge>.
//
// Restocking mechanic: there's no picking a specific slot anymore. The
// player just drags (or clicks) an item onto the shelf — ANYWHERE on it —
// and it always joins the next open slot, in order (pos-1, pos-2, ...).
// The puzzle is entirely about *order*: drag items starting with the one
// expiring soonest, then the next soonest, and so on, so each one lands in
// its correct slot as you go. Visually, the first few cards you place get
// tucked into the back row (small, set back); once that's full, the last
// couple of cards land up front, full-size, stacking on top.
//
// Picking a placed card back up removes it and closes the gap — everything
// behind it shifts one slot toward the front — so the line never has a
// hole in the middle of it.
//
// Visual layout: cards overlap each other like real packages leaning
// together on a shelf (no numbered badges, no dashed "Empty" boxes). To
// keep that overlap purely cosmetic, the scene is built from TWO layers:
//   1. .zoom-hitzones — a single, invisible click/drop target covering the
//      whole shelf. Since a new item always joins the back of the line no
//      matter where you drop it, there's no need for separate per-slot
//      targets any more.
//   2. .zoom-cards — the item art on top. The FIRST three slots to get
//      filled (in drag order) render in the back row, small and set back —
//      like new stock going into the depth of the shelf first. Only once
//      those are full do the next two dropped cards show up in the front
//      row, full-size, stacking on top and overlapping the back row. This
//      layer ignores pointer events itself; only the little chip button
//      re-enables them, so a player can still tap a placed card to pick it
//      back up.
const BACK_ROW_SIZE = 3

export default function ZoomShelf({
  slots, placements, itemsById, selectedId, reveal, hintShelfId,
  onDropItem, onPickPlaced, onShelfClick, onBack, onClearAll,
}) {
  // Any card currently sitting on this shelf? Only then is "Clear Cards"
  // worth showing — and never once the answer's been revealed, so a player
  // can't wipe the board after Check Answers.
  const slotIds = new Set(slots.map((s) => s.id))
  const hasPlaced = Object.values(placements).some((s) => slotIds.has(s))
  const active = !!selectedId && !reveal

  // Slot -> occupying item, in shelf order (slots[0] is the front).
  const resolved = slots.map((slot) => {
    const itemId = Object.entries(placements).find(([, s]) => s === slot.id)?.[0]
    const item = itemId ? itemsById[itemId] : null
    const mark = reveal && item ? (item.shelf === slot.id ? 'correct' : 'wrong') : undefined
    return { slot, item, mark }
  })

  // The next open spot at the back of the line — where any newly-dropped
  // item lands, regardless of where on the shelf it was actually dropped.
  const nextOpenSlot = resolved.find((r) => !r.item)?.slot

  const placeAtBack = (itemId) => {
    if (reveal || !nextOpenSlot) return
    onDropItem(itemId, nextOpenSlot.id)
  }

  // Pick a placed card back up: it leaves the line, and everything that was
  // behind it shifts forward one spot to close the gap.
  const removeAndCompact = (removedId) => {
    if (reveal) return
    const remaining = resolved.filter((r) => r.item && r.item.id !== removedId)
    onPickPlaced(removedId)
    remaining.forEach((entry, i) => {
      const targetSlotId = slots[i].id
      if (entry.slot.id !== targetSlotId) onDropItem(entry.item.id, targetSlotId)
    })
  }

  // Slots fill in order pos-1 -> pos-5 as the player drags cards on (see
  // nextOpenSlot below). We want the FIRST three drags to land in the back
  // row (deep on the shelf, small) and only the LAST two drags to show up
  // in the front row (full-size, overlapping on top) — matching a shelf
  // where new stock is pushed to the back until it's full, then the rest
  // stacks up front. rows[0] is always the front row (rendered lowest,
  // closest — see .zoom-cards' column-reverse in styles.css).
  const backGroup = resolved.slice(0, BACK_ROW_SIZE)
  const frontGroup = resolved.slice(BACK_ROW_SIZE)
  const rows = [frontGroup, backGroup]

  return (
    <div className="zoom-shelf-scene">
      <div className="zoom-shelf-toolbar">
        <button type="button" className="zoom-back-btn" onClick={onBack}>
          ← Back
        </button>
        {!reveal && hasPlaced && onClearAll && (
          <button type="button" className="zoom-clear-btn" onClick={onClearAll}>
            🧹 Clear Cards
          </button>
        )}
      </div>

      <div className="zoom-shelf-img-wrap">
        <img
          className="zoom-shelf-photo"
          src={ZOOM_SHELF_IMG}
          alt="Close-up of the fridge shelf"
          draggable="false"
        />

        {/* The compartment below this shelf isn't used by this level — shown
            closed off, the same way other locked fridge compartments are. */}
        <div className="zoom-lower-lock">
          <span className="zoom-lower-lock-icon"><LockIcon /></span>
        </div>

        {/* Layer 1: one invisible click/drop target for the whole shelf —
            wherever you drop, the item always joins the back of the line. */}
        <ZoomHitzone
          active={active}
          hint={!!hintShelfId && !!nextOpenSlot}
          reveal={reveal}
          full={!nextOpenSlot}
          onDropItem={placeAtBack}
          onShelfClick={() => { if (active && selectedId) placeAtBack(selectedId) }}
        />

        {/* Layer 2: the card art itself. The back row (first three slots
            filled) sits smaller and higher up; the front row (last two
            slots filled) sits low and full-size, stacking on top of it. */}
        <div className="zoom-cards">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={'zoom-row' + (rowIndex === 0 ? ' zoom-row--front' : ' zoom-row--back')}
              style={{ zIndex: rows.length - rowIndex }}
            >
              {row.map(({ slot, item, mark }, i) => (
                <div key={slot.id} className="zoom-card" style={{ zIndex: row.length - i }}>
                  {item && (
                    <ItemChip
                      item={item}
                      small
                      mark={mark}
                      onClick={(e) => { e.stopPropagation(); if (!reveal) removeAndCompact(item.id) }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path d="M8 11V8a4 4 0 1 1 8 0v3" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="5" y="10.5" width="14" height="10.5" rx="2.4" fill="#fff" />
      <circle cx="12" cy="15" r="1.5" fill="#8b9196" />
      <rect x="11.3" y="15" width="1.4" height="3.2" rx=".7" fill="#8b9196" />
    </svg>
  )
}

// A single drop/click target spanning the whole shelf — no per-slot
// targeting any more, since a new item always joins the back of the line
// no matter where on the shelf it lands.
function ZoomHitzone({ active, hint, reveal, full, onDropItem, onShelfClick }) {
  const allowDrop = (e) => { if (!reveal && !full) e.preventDefault() }
  const handleDrop = (e) => {
    if (reveal || full) return
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onDropItem(id)
  }
  return (
    <div
      className={'zoom-hitzone'
        + (active && !full ? ' zoom-hitzone--active' : '')
        + (hint ? ' zoom-hitzone--hint' : '')}
      onDragOver={allowDrop}
      onDrop={handleDrop}
      onClick={onShelfClick}
    />
  )
}
