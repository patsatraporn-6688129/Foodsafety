import { useEffect, useState } from 'react'
import { LEVELS } from '../gameData.js'
import { supabase } from '../lib/supabaseClient.js'
import Modal from './Modal.jsx'

export default function LevelSelect({ onPlay, onBack }) {
  const [locked, setLocked] = useState(null) // the locked level tapped
  const [starsByLevel, setStarsByLevel] = useState({})
  const [totalStars, setTotalStars] = useState(0)
  const [loading, setLoading] = useState(true)

  // Pull the player's real progress from Supabase instead of using the
  // static mock numbers — per-level best_stars from game_progress, and
  // the accumulated total from users.total_stars (kept in sync by the
  // submit_level_result RPC every time a level finishes).
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (!cancelled) setLoading(false); return }

      const [{ data: progressRows }, { data: userRow }] = await Promise.all([
        supabase.from('game_progress').select('level, best_stars').eq('user_id', user.id),
        supabase.from('users').select('total_stars').eq('id', user.id).maybeSingle(),
      ])

      if (cancelled) return
      const map = {}
      ;(progressRows || []).forEach((row) => { map[row.level] = row.best_stars })
      setStarsByLevel(map)
      setTotalStars(userRow?.total_stars ?? 0)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Merge the static level metadata (name/color/order) with the real
  // per-level star counts we just fetched, then work out locking + the
  // "current" (next-to-play) level dynamically instead of trusting the
  // static `unlocked`/`current` flags in gameData.js.
  //
  // Locking rule: only levels that actually have game content (i.e. were
  // NOT hardcoded `locked: true` as a "???" placeholder in gameData.js) can
  // ever be reached. Among those real levels, level 1 is always open and
  // every next one unlocks only once the previous real level has at least
  // 1 star. Placeholder "???" levels (11, 12 — no level data file yet)
  // stay locked no matter what, since there's nothing to play there.
  let prevCleared = true // level 1 is always open
  let currentSet = false
  const levels = LEVELS.map((lv) => {
    const stars = starsByLevel[lv.n] ?? 0
    if (lv.locked) {
      // Placeholder level with no content yet — always locked.
      return { ...lv, stars, locked: true, current: false, reason: 'no-content' }
    }
    const locked = !prevCleared
    // First real, unlocked level the player hasn't earned a star on yet.
    const current = !locked && !currentSet && stars === 0
    if (current) currentSet = true
    prevCleared = !locked && stars > 0
    return { ...lv, stars, locked, current, reason: 'sequential' }
  })

  return (
    <main className="levelsel">
      <h1 className="levelsel-title">Level Selection</h1>
      <p className="levelsel-sub">
        {loading ? 'Loading your progress…' : `⭐ ${totalStars} stars collected`}
      </p>

      <div className="levelsel-grid">
        {levels.map((lv) => (
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
      <span className={'lvl-play-badge' + (lv.current ? ' is-current' : '')}>PLAY</span>
      <button
        className={'lvl-circle' + (lv.current ? ' lvl-circle--current' : '')}
        style={{ background: lv.color, color: dark ? '#fff' : '#1f2a30' }}
        onClick={onClick}
      >
        {lv.n}
      </button>
      <div className="lvl-stars">
        <span className={(lv.stars || 0) > 0 ? 'lvl-star-count on' : 'lvl-star-count'}>
          ★ {lv.stars || 0}/3
        </span>
      </div>
      <div className={'lvl-name' + (lv.current ? ' lvl-name--current' : '')}>{lv.name}</div>
    </div>
  )
}

function LockedCard({ lv, onClose }) {
  const isNoContent = lv.reason === 'no-content'
  return (
    <div className="locked-card">
      <div className="locked-ico">🔒</div>
      <h2 className="locked-title">Level Locked!</h2>
      <p className="locked-text">
        {isNoContent
          ? <>This level isn't ready yet.<br />Check back soon!</>
          : <>Complete the previous level<br />to unlock this one!</>}
      </p>
      <button className="btn btn-play locked-got" onClick={onClose}>Got It</button>
    </div>
  )
}
