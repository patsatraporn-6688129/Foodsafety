import { FRIDGE_IMG } from '../gameData.js'
import { TEMP_KEY } from '../data/levels/level01.js'
import * as audio from '../lib/audio.js'

// Level 1 assembly view: an empty fridge with slot drop-zones on the left, and
// a tray of parts (each with a temperature badge) + a temperature key on the
// right. Reuses App's generic placement engine — a part is "correct" when it
// lands in the slot whose id matches the part's target shelf.
//
// Levels whose parts are plain colour-coded thermometers (item.thermo, e.g.
// Level 8) skip both the physical part artwork and the bottom temperature-key
// legend — the thermometer glyph the player drags IS the temperature, so a
// separate legend would just repeat it.
export default function AssemblyScene({
  slots, placements, itemsById, selectedId, reveal, hintShelfId,
  onDropItem, onPickPlaced, onSelect,
}) {
  const partInSlot = (slotId) =>
    Object.keys(placements).find((id) => placements[id] === slotId)

  const unplaced = Object.keys(placements)
    .filter((id) => placements[id] === null)
    .map((id) => itemsById[id])

  const isThermoLevel = Object.values(itemsById).some((it) => it?.thermo)

  return (
    <div className="assembly-scene">
      <div className="assembly-fridge">
        <div className="fridge-img-wrap">
          <img className="fridge-photo" src={FRIDGE_IMG} alt="Fridge" draggable="false" />
          {slots.map((slot) => {
            const partId = partInSlot(slot.id)
            const part = partId ? itemsById[partId] : null
            const mark = reveal && part
              ? (part.shelf === slot.id ? 'correct' : 'wrong')
              : undefined
            return (
              <Slot
                key={slot.id}
                slot={slot}
                part={part}
                mark={mark}
                active={!!selectedId && !reveal}
                reveal={reveal}
                hint={slot.id === hintShelfId}
                onDropItem={onDropItem}
                onPickPlaced={onPickPlaced}
                onSlotClick={() => { if (selectedId && !reveal) onDropItem(selectedId, slot.id) }}
              />
            )
          })}
        </div>
      </div>

      <div
        className="assembly-tray"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const id = e.dataTransfer.getData('text/plain')
          if (id) onPickPlaced(id)
        }}
      >
        <div className="tray-title">Fridge Parts</div>
        <div className="parts-grid">
          {unplaced.map((p) => (
            <PartChip
              key={p.id}
              part={p}
              selected={selectedId === p.id}
              onClick={() => onSelect(p.id)}
            />
          ))}
          {unplaced.length === 0 && <div className="tray-empty">All assembled! 🧊</div>}
        </div>

        {!isThermoLevel && (
          <div className="thermo-key">
            {TEMP_KEY.map((t, i) => (
              <div className="thermo-key-item" key={i}>
                <Thermometer temp={t} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Slot({ slot, part, mark, active, reveal, hint, onDropItem, onPickPlaced, onSlotClick }) {
  const allowDrop = (e) => { if (!reveal) e.preventDefault() }
  const handleDrop = (e) => {
    if (reveal) return
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onDropItem(id, slot.id)
  }
  return (
    <div
      className={'afr-slot' + (active ? ' afr-slot--active' : '') +
        (mark === 'correct' ? ' afr-slot--correct' : '') +
        (mark === 'wrong' ? ' afr-slot--wrong' : '') +
        (hint ? ' afr-slot--hint' : '')}
      style={slot.pos}
      onDragOver={allowDrop}
      onDrop={handleDrop}
      onClick={onSlotClick}
    >
      {part ? (
        <button
          type="button"
          className={'afr-part' + (part.thermo ? ' afr-part--thermo' : '')}
          draggable={!reveal}
          onDragStart={(e) => { e.dataTransfer.setData('text/plain', part.id); e.dataTransfer.effectAllowed = 'move'; const drag = e.currentTarget.querySelector('img, .thermo'); if (drag) e.dataTransfer.setDragImage(drag, drag.offsetWidth / 2, drag.offsetHeight / 2); audio.sfxPickup() }}
          onClick={(e) => { e.stopPropagation(); if (!reveal) onPickPlaced(part.id) }}
        >
          {part.thermo ? (
            <Thermometer temp={part.temp} color={part.color} size="md" />
          ) : (
            <>
              <img src={part.img} alt={part.label} draggable="false" />
              <span className="afr-part-temp">{part.temp}</span>
            </>
          )}
          {mark === 'correct' && <span className="afr-mark afr-mark--ok">✓</span>}
          {mark === 'wrong' && <span className="afr-mark afr-mark--no">✗</span>}
        </button>
      ) : (
        <span className="afr-slot-label">{slot.name}</span>
      )}
    </div>
  )
}

function PartChip({ part, selected, onClick }) {
  // Thermo parts (Level 8) ARE a thermometer — no separate shelf/drawer
  // artwork, no name label, just the big colour-coded glyph + reading.
  if (part.thermo) {
    return (
      <button
        type="button"
        className={'part-chip part-chip--thermo' + (selected ? ' part-chip--selected' : '')}
        draggable
        onDragStart={(e) => { e.dataTransfer.setData('text/plain', part.id); e.dataTransfer.effectAllowed = 'move'; const art = e.currentTarget.querySelector('.thermo'); if (art) e.dataTransfer.setDragImage(art, art.offsetWidth / 2, art.offsetHeight / 2); audio.sfxPickup() }}
        onClick={onClick}
      >
        <Thermometer temp={part.temp} color={part.color} size="lg" />
      </button>
    )
  }
  return (
    <button
      type="button"
      className={'part-chip' + (selected ? ' part-chip--selected' : '')}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', part.id); e.dataTransfer.effectAllowed = 'move'; const art = e.currentTarget.querySelector('.part-chip-art'); if (art) e.dataTransfer.setDragImage(art, art.offsetWidth / 2, art.offsetHeight / 2); audio.sfxPickup() }}
      onClick={onClick}
    >
      <span className="part-chip-art"><img src={part.img} alt={part.label} draggable="false" /></span>
      <span className="part-chip-label">{part.label}</span>
      <Thermometer temp={part.temp} small />
    </button>
  )
}

// Named colour overrides for thermo-type parts (Level 8) whose colour is a
// deliberate design choice rather than something derived from the reading —
// e.g. the two 6°C door bins are red vs green purely to tell them apart.
const THERMO_COLORS = { red: '#e0533a', blue: '#3aa0d6', green: '#5cb85c' }

// A thermometer glyph with the temperature underneath. Bulb colour warms up
// as the temperature rises (blue = freezing, red = warm) unless an explicit
// `color` override is given. `size`: 'sm' (default, inline next to a regular
// part's label), 'md' (placed in an assembly slot), 'lg' (the item's whole
// art in the tray, for thermo-type parts).
function Thermometer({ temp, small, color, size = 'sm' }) {
  const n = parseFloat(String(temp).replace('–', '-'))
  const auto = n <= -10 ? '#3aa0d6' : n <= 4 ? '#57b0e0' : n <= 6 ? '#f2b53a' : '#e0533a'
  const fill = THERMO_COLORS[color] || color || auto
  const dims = small || size === 'sm' ? { w: 16, h: 26 } : size === 'md' ? { w: 22, h: 36 } : { w: 34, h: 56 }
  return (
    <span className={'thermo' + (small ? ' thermo--small' : '') + (size === 'lg' ? ' thermo--lg' : '')}>
      <svg viewBox="0 0 24 40" width={dims.w} height={dims.h} aria-hidden="true">
        <rect x="9" y="3" width="6" height="24" rx="3" fill="#fff" stroke="#c7ced3" strokeWidth="1.6" />
        <circle cx="12" cy="31" r="6.5" fill={fill} stroke="#c7ced3" strokeWidth="1.6" />
        <rect x="10.5" y="12" width="3" height="17" rx="1.5" fill={fill} />
      </svg>
      <span className="thermo-temp">{temp}</span>
    </span>
  )
}
