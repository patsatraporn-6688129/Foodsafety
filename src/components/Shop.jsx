import { useState } from 'react'
import { SHOP } from '../gameData.js'

function ItemIcon({ icon, tone, badge }) {
  return (
    <div className={`shop-ico shop-ico--${tone}`}>
      <span className="shop-spark shop-spark--tl">✦</span>
      <span className="shop-spark shop-spark--tr">✦</span>
      <span className="shop-spark shop-spark--bl">✦</span>
      <span className="shop-ico-glyph">{icon}</span>
      <span className="shop-ico-badge">{badge}</span>
    </div>
  )
}

export default function Shop({ coins = 0, onBuy, onBack }) {
  const [pending, setPending] = useState(null) // item awaiting confirmation
  const [toast, setToast] = useState('')

  const confirm = async () => {
    if (pending && onBuy) {
      const item = pending
      setPending(null) // close the confirm modal right away; don't block on the network
      const ok = await onBuy(item)
      setToast(ok ? `${item.name} added to your inventory!` : "Not enough coins for that yet.")
      setTimeout(() => setToast(''), 2200)
      return
    }
    setPending(null)
  }

  return (
    <main className="shop-screen">
      <h1 className="shop-title">The Fresh Market</h1>
      <p className="shop-sub">{SHOP.intro}</p>

      <div className="shop-grid">
        {SHOP.items.map((it) => {
          const afford = coins >= it.coins
          return (
            <div className="shop-card" key={it.id}>
              <ItemIcon icon={it.icon} tone={it.tone} badge={it.badge} />
              <h3 className="shop-card-name">{it.name}</h3>
              <p className="shop-card-desc">{it.desc}</p>
              <div className="shop-coins">
                <span className="shop-coin-ico">$</span>
                {it.coins.toLocaleString()} Coins
              </div>
              <button className="shop-buy" disabled={!afford} onClick={() => setPending(it)}>
                {afford ? 'Buy' : 'Not enough coins'}
              </button>
            </div>
          )
        })}
      </div>

      {toast && <p className="shop-toast">{toast}</p>}

      <button className="btn btn-play shop-back" onClick={onBack}>← Back To Menu</button>

      {pending && (
        <div className="shop-modal-overlay" onClick={() => setPending(null)}>
          <div className="shop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shop-modal-ico">
              <ItemIcon icon={pending.icon} tone={pending.tone} badge={pending.badge} />
            </div>
            <h2 className="shop-modal-title">Confirm Purchase?</h2>
            <p className="shop-modal-text">
              Are you sure you want to purchase<br />
              <strong>{pending.name}?</strong> It'll go into your inventory — use it whenever you want, in any level.
            </p>
            <div className="shop-modal-cost">
              <span>Total Cost</span>
              <span className="shop-modal-price">
                <span className="shop-coin-ico">$</span>{pending.coins.toLocaleString()} Coins
              </span>
            </div>
            <button className="shop-modal-confirm" onClick={confirm}>
              Confirm Purchase →
            </button>
            <button className="shop-modal-cancel" onClick={() => setPending(null)}>
               Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
