import { useState } from 'react'
import ItemChip from './ItemChip.jsx'
import binImg from '../assets/bin.png'

// Same role as <Tray>, but styled as a table with food sitting on top and a
// trash can underneath — items can be dragged from the table into the
// fridge, or dragged onto the trash can to send them back to the table.
export default function TableScene({ items, selectedId, onSelect, onReturnDrop, onTrashDrop }) {
  const [trashOver, setTrashOver] = useState(false)

  const allowDrop = (e) => e.preventDefault()

  const handleTableDrop = (e) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onReturnDrop(id)
  }

  const handleTrashDrop = (e) => {
    e.preventDefault()
    setTrashOver(false)
    const id = e.dataTransfer.getData('text/plain')
    if (id) onTrashDrop(id)
  }

  return (
    <div className="table-scene">
      <div className="table-title">Items to Sort</div>

      <div className="table-top" onDragOver={allowDrop} onDrop={handleTableDrop}>
        <div className="table-items">
          {items.map((it) => (
            <ItemChip
              key={it.id}
              item={it}
              selected={selectedId === it.id}
              onClick={() => onSelect(it.id)}
            />
          ))}
          {items.length === 0 && (
            <div className="table-empty">All sorted! 🎯</div>
          )}
        </div>
        <span className="table-leg table-leg--l" />
        <span className="table-leg table-leg--r" />
      </div>

      <div
        className={'trash-zone' + (trashOver ? ' trash-zone--over' : '')}
        onDragOver={allowDrop}
        onDragEnter={() => setTrashOver(true)}
        onDragLeave={() => setTrashOver(false)}
        onDrop={handleTrashDrop}
        title="Drag an item here to throw it away for good"
      >
        <img className="trash-img" src={binImg} alt="Trash" draggable="false" />
      </div>
    </div>
  )
}