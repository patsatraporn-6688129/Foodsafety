import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  SHELVES, ITEMS, TIPS,
  LEVEL_TIME, CORRECT_POINTS, WRONG_POINTS, TIME_BONUS_PER_SEC, START_SCORE,
} from './gameData.js'
import Fridge from './components/Fridge.jsx'
import Tray from './components/Tray.jsx'
import Modal from './components/Modal.jsx'
import Settings from './components/Settings.jsx'
import Rewards from './components/Rewards.jsx'
import LevelSelect from './components/LevelSelect.jsx'

const emptyPlacements = () =>
  ITEMS.reduce((acc, it) => ((acc[it.id] = null), acc), {})

export default function App() {
  // menu | tips | game | result | settings | rewards | levels
  const [screen, setScreen] = useState('menu')
  const [prevScreen, setPrevScreen] = useState('menu')
  const [level, setLevel] = useState(1)
  const [total, setTotal] = useState(START_SCORE)
  const [placements, setPlacements] = useState(emptyPlacements)
  const [selectedId, setSelectedId] = useState(null)
  const [timeLeft, setTimeLeft] = useState(LEVEL_TIME)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [result, setResult] = useState(null) // { correct,total,score,timeBonus,reason }
  const [settings, setSettings] = useState({
    music: 80, sfx: 65, tutorial: true, language: 'English',
  })

  const itemsById = useMemo(
    () => Object.fromEntries(ITEMS.map((i) => [i.id, i])),
    []
  )

  const placedCount = Object.values(placements).filter(Boolean).length
  const allPlaced = placedCount === ITEMS.length

  // Countdown timer
  useEffect(() => {
    if (!running || paused || timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running, paused, timeLeft])

  const finish = useCallback((reason) => {
    let correct = 0
    ITEMS.forEach((it) => {
      if (placements[it.id] === it.shelf) correct++
    })
    const base = correct * CORRECT_POINTS + (ITEMS.length - correct) * WRONG_POINTS
    const perfect = correct === ITEMS.length
    const timeBonus = reason === 'timeup'
      ? Math.max(0, timeLeft) * 2
      : (perfect ? timeLeft * TIME_BONUS_PER_SEC : Math.round(timeLeft * 2))
    const gained = Math.max(0, base + timeBonus)
    const newTotal = total + gained
    setTotal(newTotal)
    setRunning(false)
    setResult({ correct, total: ITEMS.length, score: newTotal, timeBonus, reason, perfect })
    setScreen('result')
  }, [placements, timeLeft, total])

  const checkAnswers = useCallback(() => finish('checked'), [finish])

  // Auto-finish (Time Up) when the clock hits zero
  useEffect(() => {
    if (running && !paused && timeLeft <= 0) finish('timeup')
  }, [running, paused, timeLeft, finish])

  const startLevel = (lvl = level) => {
    setLevel(lvl)
    setPlacements(emptyPlacements())
    setSelectedId(null)
    setTimeLeft(LEVEL_TIME)
    setResult(null)
    setPaused(false)
    setRunning(true)
    setScreen('game')
  }

  const placeItem = (itemId, shelfId) => {
    if (screen === 'result') return
    setPlacements((p) => ({ ...p, [itemId]: shelfId }))
    setSelectedId(null)
  }
  const returnItem = (itemId) => {
    if (screen === 'result') return
    setPlacements((p) => ({ ...p, [itemId]: null }))
    setSelectedId(null)
  }

  const liveScore = useMemo(() => {
    let s = total
    ITEMS.forEach((it) => {
      if (placements[it.id] === it.shelf) s += CORRECT_POINTS
    })
    return s
  }, [placements, total])

  const trayItems = ITEMS.filter((it) => placements[it.id] === null)

  const openSettings = () => { setPrevScreen(screen); setScreen('settings') }
  const openRewards = () => { setPrevScreen('menu'); setScreen('rewards') }

  const goMenu = () => {
    setRunning(false)
    setPaused(false)
    setScreen('menu')
  }

  const inGame = screen === 'game' || screen === 'result'

  return (
    <div className="app">
      <Header
        inGame={inGame}
        title={inGame ? 'Store It Right' : 'Fridge Master'}
        paused={paused}
        onPause={() => setPaused((p) => !p)}
        onHome={goMenu}
        onSettings={openSettings}
      />

      <div className="page">
        {screen === 'menu' && (
          <Menu
            onPlay={() => setScreen('tips')}
            onLevels={() => setScreen('levels')}
            onSettings={openSettings}
            onRewards={openRewards}
          />
        )}

        {screen === 'levels' && (
          <LevelSelect onPlay={(n) => startLevel(n)} onBack={() => setScreen('menu')} />
        )}

        {screen === 'tips' && <Tips onStart={() => startLevel(1)} />}

        {screen === 'settings' && (
          <Settings
            settings={settings}
            onChange={setSettings}
            onBack={() => setScreen(prevScreen === 'settings' ? 'menu' : prevScreen)}
          />
        )}

        {screen === 'rewards' && <Rewards onBack={() => setScreen('menu')} />}

        {inGame && (
          <>
            <Hud level={level} timeLeft={timeLeft} score={liveScore} />
            <div className="board">
              <Fridge
                shelves={SHELVES}
                placements={placements}
                itemsById={itemsById}
                selectedId={selectedId}
                reveal={screen === 'result'}
                onDropItem={placeItem}
                onPickPlaced={returnItem}
                onShelfClick={(shelfId) => {
                  if (selectedId) placeItem(selectedId, shelfId)
                }}
              />
              <Tray
                items={trayItems}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId((s) => (s === id ? null : id))}
                onReturnDrop={returnItem}
              />
            </div>

            {screen === 'game' && (
              <div className="actions">
                <button
                  className="btn btn-check"
                  disabled={!allPlaced}
                  onClick={checkAnswers}
                >
                  {allPlaced
                    ? 'Check Answers ✓'
                    : `Place all items (${placedCount}/${ITEMS.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ----- Result: Level Completed / Time Up ----- */}
      {screen === 'result' && result && (
        <Modal>
          {result.reason === 'timeup'
            ? <TimeUpCard result={result} onRetry={() => startLevel(level)} onMenu={goMenu} />
            : <LevelCompleteCard
                result={result}
                onNext={() => startLevel(level + 1)}
                onReplay={() => startLevel(level)}
              />}
        </Modal>
      )}

      {/* ----- Pause ----- */}
      {paused && screen === 'game' && (
        <Modal>
          <PauseCard
            level={level}
            score={liveScore}
            onResume={() => setPaused(false)}
            onRestart={() => { setPaused(false); startLevel(level) }}
            onSettings={openSettings}
            onMenu={goMenu}
          />
        </Modal>
      )}
    </div>
  )
}

/* ---------- Header ---------- */
function Header({ inGame, title, paused, onPause, onHome, onSettings }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={onHome}>
          <span className="brand-ico">🧊</span>
          <span>{title}</span>
        </button>
        <div className="topbar-actions">
          {inGame
            ? (
              <button className="round-btn" onClick={onPause} title="Pause">
                {paused ? <PlayGlyph /> : <PauseGlyph />}
              </button>
            )
            : <button className="round-btn" title="Help"><HelpGlyph /></button>}
          <button className="round-btn" onClick={onSettings} title="Settings"><GearGlyph /></button>
        </div>
      </div>
    </header>
  )
}

/* ---------- Header icon glyphs (bold, fill the button) ---------- */
function PauseGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="5" width="4.2" height="14" rx="1.6" fill="currentColor" />
      <rect x="13.8" y="5" width="4.2" height="14" rx="1.6" fill="currentColor" />
    </svg>
  )
}
function PlayGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5Z" fill="currentColor" />
    </svg>
  )
}
function GearGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M19.14 12.94a7.49 7.49 0 0 0 0-1.88l2-1.57a.5.5 0 0 0 .12-.64l-1.9-3.29a.5.5 0 0 0-.61-.22l-2.39 1a7.3 7.3 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.8a.5.5 0 0 0-.5.42l-.36 2.54a7.3 7.3 0 0 0-1.62.94l-2.39-1a.5.5 0 0 0-.61.22L2.81 8.85a.5.5 0 0 0 .12.64l2 1.57a7.49 7.49 0 0 0 0 1.88l-2 1.57a.5.5 0 0 0-.12.64l1.9 3.29a.5.5 0 0 0 .61.22l2.39-1a7.3 7.3 0 0 0 1.62.94l.36 2.54a.5.5 0 0 0 .5.42h3.8a.5.5 0 0 0 .5-.42l.36-2.54a7.3 7.3 0 0 0 1.62-.94l2.39 1a.5.5 0 0 0 .61-.22l1.9-3.29a.5.5 0 0 0-.12-.64ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z" />
    </svg>
  )
}
function HelpGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.9 15.5h-1.8v-1.8h1.8Zm1.87-6.98-.81.83c-.65.66-1.06 1.2-1.06 2.4h-1.8v-.45c0-.88.41-1.68 1.06-2.34l1.12-1.14a1.8 1.8 0 0 0-1.28-3.07 1.8 1.8 0 0 0-1.8 1.8H8.4a3.6 3.6 0 1 1 6.37 2.28Z" />
    </svg>
  )
}

/* ---------- Menu ---------- */
function Menu({ onPlay, onLevels, onSettings, onRewards }) {
  return (
    <main className="menu">
      <div className="logo-badge">
        <div className="logo-fridge">🧊</div>
        <div className="logo-dot logo-dot--red" />
        <div className="logo-dot logo-dot--yellow" />
      </div>
      <h1 className="title">FRIDGE<br />MASTER</h1>
      <p className="subtitle">ORGANIZE YOUR WORLD</p>

      <button className="btn btn-play menu-play" onClick={onPlay}>
        <span className="play-badge">▶</span>
        <span>Play</span>
      </button>

      <div className="menu-row">
        <button className="pill pill-teal" onClick={onLevels}>
          <span className="pill-ico">▦</span>Levels
        </button>
        <button className="pill pill-grey" onClick={onSettings}>
          <span className="pill-ico">⚙</span>Settings
        </button>
        <button className="pill pill-orange" onClick={onRewards}>
          <span className="pill-ico">🏆</span>Rewards
        </button>
      </div>
    </main>
  )
}

/* ---------- Tips ---------- */
function Tips({ onStart }) {
  return (
    <main className="tips">
      <div className="tips-heading">Food Safety Tips</div>
      <div className="tips-grid">
        {TIPS.map((t) => (
          <div className="tip-card" key={t.title}>
            <div className="tip-img"><img src={t.img} alt={t.title} /></div>
            <h3>{t.title}</h3>
            <p>{t.text}</p>
          </div>
        ))}
      </div>
      <button className="btn btn-play tips-start" onClick={onStart}>Start Sorting! →</button>
      <p className="tips-note">TAP TO BEGIN YOUR JOURNEY</p>
    </main>
  )
}

/* ---------- HUD ---------- */
function Hud({ level, timeLeft, score }) {
  const pct = Math.round((timeLeft / LEVEL_TIME) * 100)
  const mm = Math.floor(timeLeft / 60)
  const ss = String(timeLeft % 60).padStart(2, '0')
  return (
    <div className="hud">
      <div className="hud-level">
        <span>Level {level}</span>
        <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className={`timer ${timeLeft <= 15 ? 'timer--low' : ''}`}>⏱ {mm}:{ss}</div>
      <div className="hud-score">
        <span className="hud-score-label">Score</span>
        <span className="hud-score-val">⭐ {score.toLocaleString()}</span>
      </div>
    </div>
  )
}

/* ---------- Level Complete ---------- */
function LevelCompleteCard({ result, onNext, onReplay }) {
  const { correct, total: tot, score, timeBonus } = result
  const stars = correct >= tot ? 3 : correct >= tot * 0.66 ? 2 : correct > 0 ? 1 : 0
  return (
    <div className="end-card">
      <h2 className="end-title">Level Completed!</h2>
      <p className="end-sub">{stars === 3 ? 'PERFECTLY ORGANIZED!' : `${correct}/${tot} SORTED CORRECTLY`}</p>
      <div className="stars">
        {[0, 1, 2].map((i) => <span key={i} className={i < stars ? 'star on' : 'star'}>★</span>)}
      </div>
      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-label">FINAL SCORE</div>
          <div className="stat-val stat-val--green">{score.toLocaleString()}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">TIME BONUS</div>
          <div className="stat-val stat-val--red">+{timeBonus.toLocaleString()}</div>
        </div>
      </div>
      <button className="btn btn-play end-primary" onClick={onNext}>Next Level →</button>
      <button className="btn btn-mint" onClick={onReplay}>↻ Replay</button>
    </div>
  )
}

/* ---------- Time Up ---------- */
function TimeUpCard({ result, onRetry, onMenu }) {
  const { score, timeBonus } = result
  return (
    <div className="end-card">
      <div className="end-clock">🕐</div>
      <h2 className="end-title">Time Up!</h2>
      <p className="end-sub2">Too bad, you didn't finish sorting in time.</p>
      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-label">FINAL SCORE</div>
          <div className="stat-val stat-val--green">{score.toLocaleString()}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">TIME BONUS</div>
          <div className="stat-val stat-val--red">+{timeBonus.toLocaleString()}</div>
        </div>
      </div>
      <button className="btn btn-play end-primary" onClick={onRetry}>Try Again ↻</button>
      <button className="btn btn-mint" onClick={onMenu}>⌂ Main Menu</button>
    </div>
  )
}

/* ---------- Pause ---------- */
function PauseCard({ level, score, onResume, onRestart, onSettings, onMenu }) {
  return (
    <div className="pause-card">
      <h2 className="end-title">Game Pause</h2>
      <button className="btn btn-play end-primary" onClick={onResume}>Resume Game →</button>
      <button className="btn btn-mint" onClick={onRestart}>↻ Restart level</button>
      <button className="btn btn-mint" onClick={onSettings}>⚙ Setting</button>
      <button className="btn btn-mint" onClick={onMenu}>⌂ Main Menu</button>
      <div className="pause-stats">
        <div><div className="stat-label">LEVEL</div><div className="pause-stat-val">{level}</div></div>
        <div className="pause-divider" />
        <div><div className="stat-label">SCORE</div><div className="pause-stat-val">{score.toLocaleString()}</div></div>
      </div>
    </div>
  )
}
