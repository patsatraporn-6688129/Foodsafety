export default function Settings({ settings, onChange, onBack }) {
  const set = (patch) => onChange({ ...settings, ...patch })

  return (
    <main className="settings-screen">
      <div className="settings-card">
        <div className="settings-head">
          <h2>⚙ Game Settings</h2>
          <button className="settings-close" onClick={onBack}>✕</button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <div className="settings-section-title">🔊 AUDIO</div>
            <div className="settings-sliders">
              <Slider
                icon="🎵" label="Music" value={settings.music}
                onChange={(v) => set({ music: v })}
              />
              <Slider
                icon="📣" label="Sound Effects" value={settings.sfx}
                onChange={(v) => set({ sfx: v })}
              />
            </div>
          </section>

          <div className="settings-sep" />

          <section className="settings-section">
            <div className="settings-section-title">🎮 GAMEPLAY</div>
            <div className="settings-grid2">
              <div className="settings-tile">
                <div>
                  <div className="settings-tile-title">Language</div>
                  <div className="settings-tile-sub">Default: English</div>
                </div>
                <select
                  className="settings-select"
                  value={settings.language}
                  onChange={(e) => set({ language: e.target.value })}
                >
                  <option>English</option>
                  <option>ไทย</option>
                  <option>日本語</option>
                </select>
              </div>
              <div className="settings-tile">
                <div>
                  <div className="settings-tile-title">Show Tutorial</div>
                  <div className="settings-tile-sub">Helpful hints for beginners</div>
                </div>
                <button
                  className={'toggle' + (settings.tutorial ? ' toggle--on' : '')}
                  onClick={() => set({ tutorial: !settings.tutorial })}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>
          </section>

          <div className="settings-sep" />

          <section className="settings-section">
            <div className="settings-section-title">🛡 SUPPORT &amp; LEGAL</div>
            <div className="settings-grid3">
              <button className="settings-legal settings-legal--active">↺<br />Restore Purchases</button>
              <button className="settings-legal">🛡<br />Privacy Policy</button>
              <button className="settings-legal">📄<br />Terms of Service</button>
            </div>
          </section>
        </div>

        <div className="settings-foot">
          <span className="settings-version">Version 1.0.2</span>
          <button className="btn btn-play settings-back" onClick={onBack}>← Back To Menu</button>
        </div>
      </div>
    </main>
  )
}

function Slider({ icon, label, value, onChange }) {
  return (
    <div className="slider-wrap">
      <div className="slider-top">
        <span className="slider-label">{icon} {label}</span>
        <span className="slider-val">{value}%</span>
      </div>
      <input
        type="range" min="0" max="100" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
        style={{ '--pct': `${value}%` }}
      />
    </div>
  )
}
