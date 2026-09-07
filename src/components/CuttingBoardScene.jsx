import { FRIDGE_IMG } from '../gameData.js'
import ItemChip from './ItemChip.jsx'

// Drop-zone rectangles over the left fridge compartment (same coords as Fridge.jsx).
const ZONES = {
  top:    { left: '4%', top: '1%',   width: '44%', height: '16.5%' },
  middle: { left: '4%', top: '17%',  width: '44%', height: '14.5%' },
  bottom: { left: '4%', top: '31%',  width: '44%', height: '14.5%' },
}

const LOCK_REGIONS = {
  leftLower:    { left: '3%',    top: '46%',   width: '45.5%', height: '40%',   lockLeft: '26%',   lockTop: '66%' },
  door:         { left: '51.5%', top: '3%',    width: '46.5%', height: '60%',   lockLeft: '74.5%', lockTop: '33%' },
  freezerRight: { left: '51.5%', top: '63%',   width: '46.5%', height: '25%',   lockLeft: '74.5%', lockTop: '75%' },
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

// A cutting board that can hold ingredients. Draggable (to carry into the
// fridge) and a drop target (to load ingredients onto it).
function Board({ board, items, reveal, draggable, onDropItem, onReturnItem, onPickBoard }) {
  const onDragStart = (e) => {
    if (!draggable) return
    e.dataTransfer.setData('text/plain', 'board:' + board.id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const allowDrop = (e) => { if (!reveal) e.preventDefault() }
  const handleDrop = (e) => {
    if (reveal) return
    const data = e.dataTransfer.getData('text/plain')
    if (!data || data.startsWith('board:')) return // only ingredients land on a board
    e.preventDefault()
    e.stopPropagation()
    onDropItem(data, board.id)
  }
  return (
    <div
      className="cb-board"
      style={{ '--board-color': board.color }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={allowDrop}
      onDrop={handleDrop}
      onClick={() => { if (draggable && onPickBoard) onPickBoard(board.id) }}
      title={board.name + ' — ' + board.hint}
    >
      <div className="cb-board-face">
        <span className="cb-board-handle" />
        <div className="cb-board-items">
          {items.map((it) => {
            const mark = reveal ? (it.board === board.id ? 'correct' : 'wrong') : undefined
            return (
              <ItemChip
                key={it.id}
                item={it}
                small
                iconOnly
                mark={mark}
                onClick={(e) => { e.stopPropagation(); if (!reveal) onReturnItem(it.id) }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function CuttingBoardScene({
  shelves, boards, boardPlacements, placements, itemsById, items,
  selectedId, reveal, locks = [], onDropItemOnBoard, onDropBoardInFridge, onReturnBoard, onReturnItem, onSelect,
}) {
  const itemsOnBoard = (boardId) =>
    items.filter((it) => placements[it.id] === boardId)

  // Boards still on the table (not yet carried into the fridge).
  const tableBoards = (boards || []).filter((b) => boardPlacements[b.id] == null)
  // Ingredients not placed on any board yet.
  const trayItems = items.filter((it) => placements[it.id] == null)

  const lockList = locks.map((k) => LOCK_REGIONS[k]).filter(Boolean)

  const allowDrop = (e) => e.preventDefault()
  // Dropping an ingredient back on the open panel returns it to the tray.
  const handlePanelDrop = (e) => {
    const data = e.dataTransfer.getData('text/plain')
    if (data && !data.startsWith('board:')) { e.preventDefault(); onReturnItem(data) }
  }

  return (
    <>
      <div className="fridge-scene">
        <div className="fridge-img-wrap">
          <img className="fridge-photo" src={FRIDGE_IMG} alt="Fridge" draggable="false" />

          {lockList.map((r, i) => (
            <div key={'ov' + i} className="lock-overlay"
              style={{ left: r.left, top: r.top, width: r.width, height: r.height }} />
          ))}

          {shelves.map((shelf) => {
            const boardsHere = (boards || []).filter((b) => boardPlacements[b.id] === shelf.id)
            return (
              <div
                key={shelf.id}
                className={'cb-slot' + (boardsHere.length > 0 ? ' cb-slot--filled' : '')}
                style={ZONES[shelf.id]}
                onDragOver={(e) => { if (!reveal) e.preventDefault() }}
                onDrop={(e) => {
                  if (reveal) return
                  const data = e.dataTransfer.getData('text/plain')
                  if (data && data.startsWith('board:')) { e.preventDefault(); onDropBoardInFridge(data.slice(6), shelf.id) }
                }}
              >
                {boardsHere.length > 0 ? (
                  boardsHere.map((board) => (
                    <Board
                      key={board.id}
                      board={board}
                      items={itemsOnBoard(board.id)}
                      reveal={reveal}
                      draggable={!reveal}
                      onDropItem={onDropItemOnBoard}
                      onReturnItem={onReturnItem}
                      onPickBoard={onReturnBoard}
                    />
                  ))
                ) : (
                  <span className="cb-slot-hint">Place a board</span>
                )}
              </div>
            )
          })}

          {lockList.map((r, i) => (
            <span key={'lk' + i} className="fridge-lock" style={{ left: r.lockLeft, top: r.lockTop }}>
              <LockIcon />
            </span>
          ))}
        </div>
      </div>

      <div className="cb-panel" onDragOver={allowDrop} onDrop={handlePanelDrop}>
        <div className="cb-panel-title"><span className="cb-step-num">1</span> Drag food onto the right board 🔪</div>
        <div className="cb-tray-items">
          {trayItems.map((it) => (
            <ItemChip
              key={it.id}
              item={it}
              selected={selectedId === it.id}
              onClick={() => onSelect(it.id)}
            />
          ))}
          {trayItems.length === 0 && <div className="cb-empty">All food on boards! ✓</div>}
        </div>

        <div className="cb-panel-title"><span className="cb-step-num">2</span> Then carry the board into the fridge 🧊</div>
        <div className="cb-tray-boards">
          {tableBoards.map((b) => (
            <Board
              key={b.id}
              board={b}
              items={itemsOnBoard(b.id)}
              reveal={reveal}
              draggable={!reveal}
              onDropItem={onDropItemOnBoard}
              onReturnItem={onReturnItem}
            />
          ))}
          {tableBoards.length === 0 && <div className="cb-empty">All boards stored! 🎯</div>}
        </div>
      </div>
    </>
  )
}
