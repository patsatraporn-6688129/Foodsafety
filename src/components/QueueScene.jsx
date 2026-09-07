import ItemChip from './ItemChip.jsx'

// Level 6 — "FEFO Queue": instead of sorting into fridge zones, items sit in
// one row of numbered slots that represent a shelf viewed front-to-back.
// The player's job is ordering, not zoning: the item that expires soonest
// belongs in slot 1 (front, closest to hand), the one that lasts longest
// belongs in the last slot (back). Every slot's `id` (pos-1, pos-2, ...) is
// just a shelf id as far as the rest of the game is concerned, so scoring,
// hints, and the reveal (correct/wrong) marks all reuse the exact same
// `item.shelf === slot.id` check as every other layout — no special-casing
// needed anywhere else in App.jsx.
export default function QueueScene({
  slots, placements, itemsById, selectedId, reveal, hintShelfId,
  onDropItem, onPickPlaced, onShelfClick,
}) {
  return (
    <div className="queue-scene">
      <div className="queue-arrows">
        <span className="queue-arrow-label queue-arrow-label--front">⟵ Front · Use First</span>
        <span className="queue-arrow-label queue-arrow-label--back">Use Last · Back ⟶</span>
      </div>
      <div className="queue-shelf">
        <div className="queue-shelf-plank" />
        {slots.map((slot, i) => {
          const itemId = Object.entries(placements).find(([, s]) => s === slot.id)?.[0]
          const item = itemId ? itemsById[itemId] : null
          const mark = reveal && item ? (item.shelf === slot.id ? 'correct' : 'wrong') : undefined
          return (
            <QueueSlot
              key={slot.id}
              slot={slot}
              index={i}
              item={item}
              mark={mark}
              active={!!selectedId && !reveal}
              hint={slot.id === hintShelfId}
              reveal={reveal}
              onDropItem={onDropItem}
              onPickPlaced={onPickPlaced}
              onShelfClick={onShelfClick}
            />
          )
        })}
      </div>
    </div>
  )
}

function QueueSlot({ slot, index, item, mark, active, hint, reveal, onDropItem, onPickPlaced, onShelfClick }) {
  const allowDrop = (e) => { if (!reveal) e.preventDefault() }
  const handleDrop = (e) => {
    if (reveal) return
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onDropItem(id, slot.id)
  }
  return (
    <div
      className={'queue-slot'
        + (active ? ' queue-slot--active' : '')
        + (hint ? ' queue-slot--hint' : '')
        + (item ? ' queue-slot--filled' : '')}
      onDragOver={allowDrop}
      onDrop={handleDrop}
      onClick={() => { if (!reveal && active) onShelfClick(slot.id) }}
    >
      <span className="queue-slot-badge">{index + 1}</span>
      {item ? (
        <ItemChip
          item={item}
          small
          mark={mark}
          onClick={(e) => { e.stopPropagation(); if (!reveal) onPickPlaced(item.id) }}
        />
      ) : (
        <div className="queue-slot-empty">Empty</div>
      )}
      <span className="queue-slot-name">{slot.name}</span>
    </div>
  )
}
