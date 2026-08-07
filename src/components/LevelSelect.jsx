import { useState } from 'react'
import { LEVELS, PLAYER_STARS } from '../gameData.js'
import Modal from './Modal.jsx'

export default function LevelSelect({ onPlay, onBack }) {
  const [locked, setLocked] = useState(null) // the locked level tapped

  return (
    <main className="levelsel">
      <h1 className="levelsel-title">Level Selection</h1>
      <p className="levelsel-sub">Clean up and earn rewards!</p>

      <div className="levelsel-grid">
        {LEVELS.map((lv) => (
          <LevelNode
            key={lv.n}
            lv={lv}
            onClick={() => {
              if (lv.locked) setLocked(lv)
              else onPlay(lv.n)
            }}
          />
        ))}
      </div>

      <button className="btn btn-play levelsel-back" onClick={onBack}>← Back To Menu</button>

      {locked && (
        <Modal>
          <LockedCard lv={locked} onClose={() => setLocked(null)} />
        </Modal>
      )}
    </main>
  )
}

function LevelNode({ lv, onClick }) {
  if (lv.locked) {
    return (
      <div className="lvl-node">
        <button className="lvl-circle lvl-circle--locked" onClick={onClick}>🔒</button>
        <div className="lvl-name lvl-name--muted">???</div>
      </div>
    )
  }
  const dark = lv.color === '#0d7355'
  return (
    <div className="lvl-node">
      {lv.current && <span className="lvl-play-badge">PLAY</span>}
      <button
        className={'lvl-circle' + (lv.current ? ' lvl-circle--current' : '')}
        style={{ background: lv.color, color: dark ? '#fff' : '#1f2a30' }}
        onClick={onClick}
      >
        {lv.n}
      </button>
      <div className="lvl-stars">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < (lv.stars || 0) ? 'lvl-star on' : 'lvl-star'}>★</span>
        ))}
      </div>
      <div className={'lvl-name' + (lv.current ? ' lvl-name--current' : '')}>{lv.name}</div>
    </div>
  )
}

function LockedCard({ lv, onClose }) {
  const need = lv.needStars || 25
  const pct = Math.min(100, Math.round((PLAYER_STARS / need) * 100))
  return (
    <div className="locked-card">
      <div className="locked-ico">🔒</div>
      <h2 className="locked-title">Level Locked!</h2>
      <p className="locked-text">
        You need {need} stars to unlock this level.<br />Keep sorting to earn more!
      </p>
      <div className="locked-progress-row">
        <span>Progress</span>
        <span className="locked-progress-val">{PLAYER_STARS} / {need}</span>
      </div>
      <div className="locked-bar"><div className="locked-fill" style={{ width: `${pct}%` }} /></div>
      <button className="btn btn-play locked-got" onClick={onClose}>Got It</button>
    </div>
  )
}
