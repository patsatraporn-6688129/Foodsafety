import { useEffect, useState } from 'react'
import { REWARDS } from '../gameData.js'
import { getMysteryBoxStatus, claimMysteryBox } from '../lib/mysteryBox.js'

const DAY_MS = 24 * 60 * 60 * 1000

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// What to show for each reward the backend can roll — see
// backend/daily-mystery-box.sql for the actual odds (65% / 20% / 15%).
function describeReward(rewardType, rewardAmount) {
  if (rewardType === 'multiplier') return { emoji: '🛍', text: 'Score x2 — added to your inventory' }
  return { emoji: '💡', text: `${rewardAmount} Free Hint${rewardAmount > 1 ? 's' : ''} — added to your inventory` }
}

export default function Rewards({ session, onReward, onBack }) {
  const r = REWARDS
  const [lastClaimedAt, setLastClaimedAt] = useState(null) // Date, or null = never claimed
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [opening, setOpening] = useState(false)
  const [wonReward, setWonReward] = useState(null) // { emoji, text } once claimed this visit

  const userId = session?.user?.id ?? null

  // Ask the backend where this player's box actually stands — this is the
  // source of truth (not localStorage), so it can't be reset client-side.
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    let cancelled = false
    getMysteryBoxStatus().then(({ lastClaimedAt: lc }) => {
      if (!cancelled) { setLastClaimedAt(lc); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [userId])

  // Real 1-second ticking clock, not a fake fixed countdown.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const elapsed = lastClaimedAt ? now - lastClaimedAt.getTime() : DAY_MS
  const ready = elapsed >= DAY_MS
  const msLeft = DAY_MS - elapsed
  const progressPct = Math.min(100, Math.round((elapsed / DAY_MS) * 100))

  const claimBox = async () => {
    if (!ready || !userId || opening) return
    setOpening(true)
    const res = await claimMysteryBox()
    setOpening(false)
    if (!res.ok) {
      // Server disagreed (e.g. another tab already claimed it, or clock
      // drift) — trust it and refresh the countdown instead of pretending.
      if (res.nextAvailableAt) setLastClaimedAt(new Date(res.nextAvailableAt.getTime() - DAY_MS))
      return
    }
    setLastClaimedAt(new Date())
    setWonReward(describeReward(res.rewardType, res.rewardAmount))
    onReward?.(res.rewardType, res.rewardAmount)
  }

  return (
    <main className="rewards-screen">
      <h1 className="rewards-title">Your Rewards</h1>
      <p className="rewards-sub">Keep organizing to unlock more yummy items!</p>

      <div className="mystery-card">
        <div className="mystery-ico">🎁</div>
        <div className="mystery-body">
          <h3>Daily Mystery Box</h3>
          <p>
            {wonReward
              ? 'Box opened — here\'s what you got:'
              : ready
                ? 'A surprise reward is ready — come open it!'
                : 'A surprise reward awaits inside! Come back once the timer runs out.'}
          </p>
          {wonReward ? (
            <div className="mystery-reward">
              <span className="mystery-reward-ico">{wonReward.emoji}</span>
              <span>{wonReward.text}</span>
            </div>
          ) : (
            <>
              <div className="mystery-bar">
                <div className="mystery-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mystery-meta">
                <span>{ready ? 'Ready!' : 'Waiting…'}</span>
                <span>{ready ? '00:00:00' : formatCountdown(msLeft)}</span>
              </div>
            </>
          )}
          {!wonReward && ready && !loading && (
            <button
              className="btn btn-play"
              style={{ marginTop: 12, width: '100%' }}
              onClick={claimBox}
              disabled={opening}
            >
              {opening ? 'Opening…' : 'Open Box 🎁'}
            </button>
          )}
          {wonReward && (
            <p style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
              Nice! Come back in 24 hours for another surprise.
            </p>
          )}
        </div>
      </div>

      <div className="rewards-row-head">
        <h2>Unlocked Items</h2>
        <span className="rewards-count">{r.unlockedCount} / {r.totalCount}</span>
      </div>
      <div className="unlocked-grid">
        {r.items.map((it) => (
          <div className={'unlocked-card unlocked-card--' + it.state} key={it.name}>
            <div className="unlocked-ico">{it.emoji}</div>
            <div className="unlocked-name">{it.name}</div>
            {it.state === 'claimed' && <div className="tag tag-claimed">CLAIMED</div>}
            {it.state === 'unlock' && <button className="tag tag-unlock">UNLOCK</button>}
            {it.state === 'locked' && <div className="tag tag-locked">🔒 {it.unlockAt}</div>}
          </div>
        ))}
      </div>

      <h2 className="rewards-ach-head">Achievements</h2>
      <div className="ach-list">
        {r.achievements.map((a) => (
          <div className="ach-row" key={a.name}>
            <div className="ach-ico" style={{ background: a.color }}>{a.icon}</div>
            <div className="ach-main">
              <div className="ach-top">
                <span className="ach-name">{a.name}</span>
                <span className="ach-pct">{a.pct}%</span>
              </div>
              <div className="ach-bar"><div className="ach-fill" style={{ width: `${a.pct}%` }} /></div>
              <div className="ach-desc">{a.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-play rewards-back" onClick={onBack}>← Back To Menu</button>
    </main>
  )
}
