export default function ItemChip({ item, selected, onClick, mark, small }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'move'
  }
  return (
    <button
      type="button"
      className={
        'chip' +
        (selected ? ' chip--selected' : '') +
        (small ? ' chip--small' : '') +
        (mark === 'correct' ? ' chip--correct' : '') +
        (mark === 'wrong' ? ' chip--wrong' : '')
      }
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <span className="chip-tile">
        <img className="chip-img" src={item.img} alt={item.label} draggable="false" />
      </span>
      <span className="chip-label">{item.label}</span>
      {mark === 'correct' && <span className="chip-mark chip-mark--ok">✓</span>}
      {mark === 'wrong' && <span className="chip-mark chip-mark--no">✗</span>}
    </button>
  )
}
