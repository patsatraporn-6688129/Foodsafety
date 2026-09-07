import ItemChip from './ItemChip.jsx'

export default function Tray({ items, selectedId, onSelect, onReturnDrop, wide }) {
  const allowDrop = (e) => e.preventDefault()
  const handleDrop = (e) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onReturnDrop(id)
  }

  return (
    <div
      className="tray"
      onDragOver={allowDrop}
      onDrop={handleDrop}
    >
      <div className="tray-title">Items to Sort</div>
      <div className={'tray-grid' + (wide ? ' tray-grid--wide' : '')}>
        {items.map((it) => (
          <ItemChip
            key={it.id}
            item={it}
            selected={selectedId === it.id}
            onClick={() => onSelect(it.id)}
          />
        ))}
        {items.length === 0 && (
          <div className="tray-empty">All sorted! 🎯</div>
        )}
      </div>
    </div>
  )
}
