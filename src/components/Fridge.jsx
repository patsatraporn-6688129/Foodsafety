import { FRIDGE_IMG } from '../gameData.js'
import ItemChip from './ItemChip.jsx'

// Drop-zone rectangles over the left compartment. The compartment shelves span
// ~1%–50% of the image width, and the glass surfaces sit at ~17.7%, 31.7% and
// 45.7% of the height. Each zone's BOTTOM lands on a shelf; items rest on it.
const ZONES = {
  top:    { left: '4%', top: '1%',   width: '44%', height: '16.5%' },
  middle: { left: '4%', top: '17%',  width: '44%', height: '14.5%' },
  bottom: { left: '4%', top: '31%',  width: '44%', height: '14.5%' },
}

// Locked compartments: a translucent grey overlay + a centred white padlock,
// matching the reference art.
const LOCK_REGIONS = [
  // left crisper + freezer drawers
  { left: '3%',  top: '47%', width: '45.5%', height: '51%', lockLeft: '26%', lockTop: '61%' },
  // right door bins
  { left: '51.5%', top: '6%',  width: '46.5%', height: '57%', lockLeft: '74.5%', lockTop: '34%' },
  // bottom-right freezer
  { left: '51.5%', top: '65.5%', width: '46.5%', height: '32.5%', lockLeft: '74.5%', lockTop: '81%' },
]

export default function Fridge({
  shelves, placements, itemsById, selectedId, reveal,
  onDropItem, onPickPlaced, onShelfClick,
}) {
  return (
    <div className="fridge-scene">
      <div className="fridge-img-wrap">
        <img className="fridge-photo" src={FRIDGE_IMG} alt="Fridge" draggable="false" />

        {/* Grey overlays over the locked areas */}
        {LOCK_REGIONS.map((r, i) => (
          <div
            key={'ov' + i}
            className="lock-overlay"
            style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
          />
        ))}

        {/* Drop zones */}
        {shelves.map((shelf) => {
          const items = Object.entries(placements)
            .filter(([, s]) => s === shelf.id)
            .map(([id]) => itemsById[id])
          return (
            <Zone
              key={shelf.id}
              shelf={shelf}
              items={items}
              active={!!selectedId && !reveal}
              reveal={reveal}
              onDropItem={onDropItem}
              onPickPlaced={onPickPlaced}
              onShelfClick={onShelfClick}
            />
          )
        })}

        {/* Centred white padlocks */}
        {LOCK_REGIONS.map((r, i) => (
          <span
            key={'lk' + i}
            className="fridge-lock"
            style={{ left: r.lockLeft, top: r.lockTop }}
          >
            <LockIcon />
          </span>
        ))}
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

function Zone({ shelf, items, active, reveal, onDropItem, onPickPlaced, onShelfClick }) {
  const allowDrop = (e) => { if (!reveal) e.preventDefault() }
  const handleDrop = (e) => {
    if (reveal) return
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onDropItem(id, shelf.id)
  }
  return (
    <div
      className={'zone' + (active ? ' zone--active' : '')}
      style={{ ...ZONES[shelf.id], '--shelf-color': shelf.color }}
      onDragOver={allowDrop}
      onDrop={handleDrop}
      onClick={() => { if (!reveal) onShelfClick(shelf.id) }}
    >
      <span className="zone-tag">{shelf.name}</span>
      <div className="zone-items">
        {items.map((it) => {
          const mark = reveal ? (it.shelf === shelf.id ? 'correct' : 'wrong') : undefined
          return (
            <ItemChip
              key={it.id}
              item={it}
              small
              mark={mark}
              onClick={(e) => { e.stopPropagation(); if (!reveal) onPickPlaced(it.id) }}
            />
          )
        })}
      </div>
    </div>
  )
}
