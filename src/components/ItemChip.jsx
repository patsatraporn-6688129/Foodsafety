import * as audio from '../lib/audio.js'

export default function ItemChip({ item, selected, onClick, mark, small, iconOnly, labelOnTop }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'move'
    // Use just the icon tile as the drag image. Without this, some browsers
    // (Safari) render a glitchy default ghost with stray label text floating
    // around the fridge/tray.
    const tile = e.currentTarget.querySelector('.chip-tile')
    if (tile) e.dataTransfer.setDragImage(tile, tile.offsetWidth / 2, tile.offsetHeight / 2)
    audio.sfxPickup()
  }
  return (
    <button
      type="button"
      className={
        'chip' +
        (selected ? ' chip--selected' : '') +
        (small ? ' chip--small' : '') +
        (iconOnly ? ' chip--icon' : '') +
        (mark === 'correct' ? ' chip--correct' : '') +
        (mark === 'wrong' ? ' chip--wrong' : '') +
        (labelOnTop ? ' chip--label-top' : '')
      }
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      {/* labelOnTop (Level 6's zoomed shelf): the name pops up as a little
          floating pill ABOVE the card instead of living inside it, so it
          stays readable even when the cards themselves sit close together. */}
      {!iconOnly && labelOnTop && <span className="chip-label chip-label--top">{item.label}</span>}
      <span className="chip-tile">
        <img className="chip-img" src={item.img} alt={item.label} draggable="false" />
      </span>
      {!iconOnly && !labelOnTop && <span className="chip-label">{item.label}</span>}
      {!iconOnly && item.expiry && <span className="chip-expiry">📅 {item.expiry}</span>}
      {mark === 'correct' && <span className="chip-mark chip-mark--ok">✓</span>}
      {mark === 'wrong' && <span className="chip-mark chip-mark--no">✗</span>}
    </button>
  )
}
