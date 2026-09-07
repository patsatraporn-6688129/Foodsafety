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

// Named fridge compartments that a level can grey-out + padlock when they're
// not used as drop targets (keeps players from wondering where things go).
// Each level lists the keys it wants locked in its data file (`locks: [...]`).
const LOCK_REGIONS = {
  // individual left shelves
  leftTop:      { left: '3%',    top: '2%',    width: '45.5%', height: '14%',   lockLeft: '26%',   lockTop: '9%' },
  leftMid:      { left: '3%',    top: '31%',   width: '45.5%', height: '14%',   lockLeft: '26%',   lockTop: '38%' },
  leftUpperMid: { left: '3%',    top: '17.5%', width: '45.5%', height: '13%',   lockLeft: '26%',   lockTop: '24%' },

  // whole bottom-left: crisper + freezer drawers, one big lock (centred lower).
  // Bottom stops at ~86% — right at the last drawer's edge, above the base/legs.
  leftLower:    { left: '3%',    top: '46%',   width: '45.5%', height: '40%',   lockLeft: '26%',   lockTop: '66%' },
  // bottom-left freezer drawers only (crisper above stays open)
  leftFreezer:  { left: '3%',    top: '64%',   width: '45.5%', height: '22%',   lockLeft: '26%',   lockTop: '75%' },
  // the whole right door (covers up to the top rim)
  door:         { left: '51.5%', top: '3%',    width: '46.5%', height: '60%',   lockLeft: '74.5%', lockTop: '33%' },
  // bottom-right freezer — stops at ~88% (base below)
  freezerRight: { left: '51.5%', top: '63%',   width: '46.5%', height: '25%',   lockLeft: '74.5%', lockTop: '75%' },
}

export default function Fridge({
  shelves, placements, itemsById, selectedId, reveal, hintShelfId,
  onDropItem, onPickPlaced, onShelfClick, onZoomClick, locks = [],
}) {
  const lockList = locks.map((k) => LOCK_REGIONS[k]).filter(Boolean)
  return (
    <div className="fridge-scene">
      <div className="fridge-img-wrap">
        <img className="fridge-photo" src={FRIDGE_IMG} alt="Fridge" draggable="false" />

        {/* Grey overlays over the unused compartments for this level */}
        {lockList.map((r, i) => (
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
              hint={shelf.id === hintShelfId}
              onDropItem={onDropItem}
              onPickPlaced={onPickPlaced}
              onShelfClick={onShelfClick}
              onZoomClick={onZoomClick}
            />
          )
        })}

        {/* Centred white padlocks over the locked compartments */}
        {lockList.map((r, i) => (
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

function Zone({ shelf, items, active, reveal, hint, onDropItem, onPickPlaced, onShelfClick, onZoomClick }) {
  const locked = !!shelf.locked
  const isZoom = !!shelf.zoomTrigger
  const allowDrop = (e) => { if (!reveal && !locked && !isZoom) e.preventDefault() }
  const handleDrop = (e) => {
    if (reveal || locked || isZoom) return
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onDropItem(id, shelf.id)
  }
  const handleClick = () => {
    if (locked) return
    if (isZoom) { onZoomClick?.(shelf.id); return }
    if (!reveal) onShelfClick(shelf.id)
  }
  return (
    <div
      className={'zone'
        + (active && !locked && !isZoom ? ' zone--active' : '')
        + (locked ? ' zone--locked' : '')
        + (isZoom ? ' zone--zoom' : '')
        + (hint && !locked ? ' zone--hint' : '')}
      style={{ ...(shelf.zone || ZONES[shelf.id]), '--shelf-color': shelf.color }}
      onDragOver={allowDrop}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <span className="zone-tag">{shelf.name}</span>
      {locked ? (
        <div className="zone-lock" title="Sort the shelf above first">
          <span className="zone-lock-icon"><LockIcon /></span>
        </div>
      ) : isZoom ? (
        <div className="zone-zoom">
          <span className="zone-zoom-icon">🔍</span>
          <span className="zone-zoom-label">Click to zoom</span>
        </div>
      ) : (
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
      )}
    </div>
  )
}
