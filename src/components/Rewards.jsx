import { REWARDS } from '../gameData.js'

export default function Rewards({ onBack }) {
  const r = REWARDS
  return (
    <main className="rewards-screen">
      <h1 className="rewards-title">Your Rewards</h1>
      <p className="rewards-sub">Keep organizing to unlock more yummy items!</p>

      <div className="mystery-card">
        <div className="mystery-ico">🎁</div>
        <div className="mystery-body">
          <h3>Daily Mystery Box</h3>
          <p>A surprise item awaits inside! Come back in 4 hours to open it.</p>
          <div className="mystery-bar"><div className="mystery-fill" style={{ width: '62%' }} /></div>
          <div className="mystery-meta">
            <span>Waiting…</span>
            <span>{r.mysteryCountdown}</span>
          </div>
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
