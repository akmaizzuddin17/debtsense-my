import { useState } from 'react'

export const TRACKER_KEY = 'debtsense_tracker_v1'

export function loadTracker() {
  try { return JSON.parse(localStorage.getItem(TRACKER_KEY) || '{}') } catch { return {} }
}

export function saveMonthEntry(yearMonth, entry) {
  const data = loadTracker()
  data[yearMonth] = { ...data[yearMonth], ...entry, updatedAt: new Date().toISOString() }
  localStorage.setItem(TRACKER_KEY, JSON.stringify(data))
  return data
}

function getYearMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(ym) {
  const [y, m] = ym.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} '${y.slice(2)}`
}

function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return getYearMonth(d)
}

const STATUS_COL  = { SAFE: '#1a9930', WARNING: '#b86e00', DANGER: '#cc2f26' }
const STATUS_BG   = { SAFE: 'rgba(26,153,48,0.10)', WARNING: 'rgba(184,110,0,0.10)', DANGER: 'rgba(204,47,38,0.10)' }

export default function MonthlyTracker({ onViewMonth, onSaveTrackerData }) {
  const [trackerData, setTrackerData] = useState(() => loadTracker())
  const [activeMonth, setActiveMonth] = useState(null)
  const [planForm, setPlanForm]       = useState({ income: '', debts: '', goal: '', notes: '' })
  const [planSaved, setPlanSaved]     = useState(false)

  const currentYM = getYearMonth()
  const months = Array.from({ length: 12 }, (_, i) => addMonths(currentYM, i - 8))

  const reload = () => setTrackerData(loadTracker())

  const clickMonth = (ym) => {
    setActiveMonth(prev => prev === ym ? null : ym)
    setPlanSaved(false)
    const entry = trackerData[ym]
    if (entry?.planned) {
      setPlanForm({ income: entry.income || '', debts: entry.debts || '', goal: entry.goal || '', notes: entry.notes || '' })
    } else {
      setPlanForm({ income: '', debts: '', goal: '', notes: '' })
    }
  }

  const savePlan = (ym) => {
    const updated = saveMonthEntry(ym, { planned: true, income: Number(planForm.income) || 0, debts: Number(planForm.debts) || 0, goal: planForm.goal, notes: planForm.notes })
    setTrackerData(updated)
    if (onSaveTrackerData) onSaveTrackerData(updated)
    setPlanSaved(true)
  }

  const isFuture = ym => ym > currentYM
  const isPast   = ym => ym < currentYM
  const isCurrent = ym => ym === currentYM

  // DSR sparkline (past 8 months with data)
  const sparkData = months.filter(ym => !isFuture(ym) && trackerData[ym]?.dsr != null)
  const maxDSR = Math.max(...sparkData.map(m => trackerData[m].dsr), 70)

  return (
    <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(60,60,67,0.10)', padding: '0 var(--page-px, 24px)' }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🛡️</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--label)', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Threat History</span>
          {sparkData.length > 1 && (
            <span style={{ fontSize: 10, color: 'var(--label-3)', marginLeft: 6 }}>
              {sparkData.length} months tracked
            </span>
          )}
        </div>
        {sparkData.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: 'var(--label-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Vulnerability Trend</span>
            <svg width={120} height={24} style={{ display: 'block' }}>
              {sparkData.map((ym, i) => {
                const x = 4 + (i / (sparkData.length - 1)) * 112
                const y = 20 - ((trackerData[ym].dsr / maxDSR) * 16)
                const col = STATUS_COL[trackerData[ym].dsrStatus] || '#b86e00'
                return <circle key={ym} cx={x} cy={y} r={2.5} fill={col} />
              })}
              <polyline
                points={sparkData.map((ym, i) => `${4 + (i / (sparkData.length - 1)) * 112},${20 - ((trackerData[ym].dsr / maxDSR) * 16)}`).join(' ')}
                fill="none" stroke="rgba(0,196,170,0.5)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Month pills */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
        {months.map(ym => {
          const entry   = trackerData[ym]
          const hasDSR  = entry?.dsr != null
          const planned = entry?.planned
          const col     = hasDSR ? (STATUS_COL[entry.dsrStatus] || '#b86e00') : planned ? '#007aff' : isCurrent(ym) ? 'var(--teal)' : 'var(--label-3)'
          const bg      = hasDSR ? (STATUS_BG[entry.dsrStatus] || 'rgba(184,110,0,0.10)') : planned ? 'rgba(0,122,255,0.08)' : isCurrent(ym) ? 'var(--teal-soft)' : 'rgba(118,118,128,0.07)'
          const isActive = activeMonth === ym
          return (
            <button key={ym} onClick={() => clickMonth(ym)} style={{
              flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '6px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)',
              background: isActive ? col : bg,
              border: `1.5px solid ${isActive ? col : 'transparent'}`,
              transition: 'all 0.15s', minWidth: 60,
            }}>
              <span style={{ fontSize: 10, fontWeight: isCurrent(ym) ? 800 : 600, color: isActive ? '#fff' : col, letterSpacing: '0.2px' }}>
                {isCurrent(ym) ? '● NOW' : formatMonth(ym)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#fff' : col, marginTop: 2 }}>
                {hasDSR ? `${entry.dsr.toFixed(1)}%` : planned ? '📋' : isFuture(ym) ? '+' : '—'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Expanded panel */}
      {activeMonth && (() => {
        const ym    = activeMonth
        const entry = trackerData[ym]
        const future = isFuture(ym)
        const cur    = isCurrent(ym)
        const col    = entry?.dsr != null ? (STATUS_COL[entry.dsrStatus] || '#b86e00') : future ? '#007aff' : 'var(--label-3)'

        return (
          <div style={{ borderTop: '0.5px solid var(--sep)', padding: '14px 4px 16px', marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: col }}>{formatMonth(ym)}</span>
              {cur && <span style={{ fontSize: 10, background: 'var(--teal-soft)', color: 'var(--teal-dark)', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>Current Month</span>}
              {future && <span style={{ fontSize: 10, background: 'rgba(0,122,255,0.08)', color: '#007aff', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>Future Plan</span>}
            </div>

            {/* Past / current month: show stats */}
            {!future && entry?.dsr != null && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 10 }}>
                  {[
                    { label: 'DSR',           value: `${entry.dsr.toFixed(1)}%`,  col: STATUS_COL[entry.dsrStatus] || col },
                    { label: 'Risk',           value: entry.riskLevel || '—',      col: entry.riskLevel === 'LOW' ? '#1a9930' : entry.riskLevel === 'HIGH' ? '#cc2f26' : '#b86e00' },
                    { label: 'Savings Rate',   value: entry.savingsRate != null ? `${Number(entry.savingsRate).toFixed(1)}%` : '—', col: Number(entry.savingsRate) >= 20 ? '#1a9930' : '#b86e00' },
                    { label: '🛡️ Shield',       value: entry.shieldScore != null ? `${entry.shieldScore}/100` : '—', col: entry.shieldScore >= 70 ? '#1a9930' : entry.shieldScore >= 40 ? '#b86e00' : entry.shieldScore != null ? '#cc2f26' : 'var(--label-3)' },
                    { label: 'Income',         value: `RM ${Number(entry.income || 0).toLocaleString()}`, col: 'var(--label)' },
                  ].map(({ label, value, col: c }) => (
                    <div key={label} style={{ background: 'var(--surface-row)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--label-3)', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{value}</div>
                    </div>
                  ))}
                </div>
                {entry.results && onViewMonth && (
                  <button className="btn-ghost" onClick={() => { onViewMonth(entry); setActiveMonth(null) }} style={{ fontSize: 11, padding: '5px 14px' }}>
                    View Full Analysis →
                  </button>
                )}
              </div>
            )}

            {!future && !entry?.dsr && (
              <div style={{ fontSize: 12, color: 'var(--label-3)', fontStyle: 'italic' }}>
                No analysis recorded for this month. Run an analysis to track it.
              </div>
            )}

            {/* Future month: planning form */}
            {future && (
              <div>
                {planSaved ? (
                  <div style={{ fontSize: 12, color: '#1a9930', fontWeight: 600 }}>✓ Plan saved for {formatMonth(ym)}!</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { key: 'income', label: 'Expected Income (RM)', placeholder: 'e.g. 6500' },
                        { key: 'debts',  label: 'Target Debts Total (RM)', placeholder: 'e.g. 2200' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <div style={{ fontSize: 10, color: 'var(--label-3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
                          <input
                            type="number" value={planForm[key]} onChange={e => setPlanForm(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-input)', border: 'none', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: 'var(--label)', fontFamily: 'var(--font)', outline: 'none' }}
                          />
                        </div>
                      ))}
                    </div>
                    <input
                      type="text" value={planForm.goal} onChange={e => setPlanForm(p => ({ ...p, goal: e.target.value }))}
                      placeholder="Goal for this month (e.g. Pay off credit card)"
                      style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-input)', border: 'none', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: 'var(--label)', fontFamily: 'var(--font)', outline: 'none' }}
                    />
                    {planForm.income && planForm.debts && (
                      <div style={{ fontSize: 11, color: '#b86e00', background: 'rgba(184,110,0,0.08)', borderRadius: 8, padding: '6px 10px' }}>
                        Projected DSR: {(Number(planForm.debts) / (Number(planForm.income) || 1) * 100).toFixed(1)}%
                        {' '}({(Number(planForm.debts) / (Number(planForm.income) || 1) * 100) < 40 ? '🟢 SAFE' : (Number(planForm.debts) / (Number(planForm.income) || 1) * 100) < 60 ? '🟡 WARNING' : '🔴 DANGER'})
                      </div>
                    )}
                    <button className="btn-primary" onClick={() => savePlan(ym)} style={{ alignSelf: 'flex-start', padding: '7px 18px', fontSize: 12 }}>
                      Save Plan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
