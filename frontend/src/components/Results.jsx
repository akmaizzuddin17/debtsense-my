import { useState, Component } from 'react'
import { ShieldCheck, TrendingUp, AlertTriangle, Zap, User, BarChart3, Map, CreditCard, Search, History, ChevronRight, CheckCircle2, Bot } from 'lucide-react'
import FinancialTwin from './FinancialTwin.jsx'
import ShieldScore from './ShieldScore.jsx'
import AIAssistant from './AIAssistant.jsx'

const toStr = x => {
  if (x === null || x === undefined) return ''
  if (typeof x !== 'object') return String(x)
  return x.action || x.name || x.title || x.text || x.description || x.step || x.tip || x.item || x.value || JSON.stringify(x)
}

/* ─── Error Boundary (prevents blank screen on render crashes) ── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ marginBottom: 12 }}><AlertTriangle size={40} color="var(--orange)" /></div>
        <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 600, color: 'var(--label)', marginBottom: 8 }}>Something went wrong rendering this section</div>
        <div style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-3)', marginBottom: 16 }}>{this.state.error.message}</div>
        <button className="btn-ghost" onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    )
    return this.props.children
  }
}

/* ─── Financial Snapshot (Overview summary card) ─────────────── */
function FinancialSnapshot({ dsr, risk, investment, plan }) {
  if (!dsr || !risk) return null
  try {
    const status   = dsr.dsr_status || 'WARNING'
    const riskLv   = (risk.overall_risk || 'MEDIUM').toUpperCase()
    const savPct   = Number(risk.savings_rate_percentage) || 0
    const investRm = Number(investment?.investable_amount_monthly) || 0
    const twin     = plan?.financial_twin?.name || null
    const colMap   = { SAFE: '#1a9930', WARNING: '#b86e00', DANGER: '#cc2f26' }
    const col      = colMap[status] || '#b86e00'
    const headline = status === 'SAFE'
      ? (savPct >= 20 ? 'Solid financial shape.' : 'Debt under control — build your savings now.')
      : status === 'WARNING' ? 'Debt load is climbing — time to act.' : 'High DSR — urgent action needed.'
    const riskBlurb = riskLv === 'LOW' ? 'low financial risk' : riskLv === 'HIGH' ? 'high financial risk — guard against scams' : 'moderate financial risk'
    const savBlurb  = savPct >= 20 ? `strong ${savPct.toFixed(1)}% savings rate` : `${savPct.toFixed(1)}% savings rate (target: 20%)`
    const investLine = investRm > 0 ? `RM ${investRm.toLocaleString()}/mo available to invest.` : 'Focus on stabilising expenses first.'
    return (
      <div className="glass" style={{ padding: '18px 22px', marginBottom: 20, borderLeft: `3px solid ${col}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--label-3)', fontWeight: 600, marginBottom: 4 }}>DebtSense MY · Financial Snapshot</div>
            <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 700, color: col, marginBottom: 6 }}>{headline}</div>
            <div style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.65, marginBottom: twin ? 8 : 0 }}>
              {`With ${riskBlurb} and ${savBlurb}, ${investLine}`}
            </div>
            {twin && (
              <div style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-3)' }}>
                Financial Twin: <strong style={{ color: 'var(--teal-dark)' }}>{twin}</strong>
                {plan.financial_twin.tagline ? ` — ${plan.financial_twin.tagline}` : ''}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${col}14`, border: `2px solid ${col}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: col }} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: col, marginTop: 4 }}>{status}</div>
          </div>
        </div>
        {dsr.analysis_summary ? (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface-row)', borderRadius: 10, fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', lineHeight: 1.5, fontStyle: 'italic' }}>
            "{dsr.analysis_summary}"
          </div>
        ) : null}
      </div>
    )
  } catch { return null }
}

/* ─── Shared helpers ─────────────────────────────────────────── */

function DSRDonut({ percentage, status }) {
  const capped  = Math.min(percentage || 0, 100)
  const color   = status === 'SAFE' ? 'var(--green)' : status === 'WARNING' ? 'var(--orange)' : 'var(--red)'
  const shadow  = status === 'SAFE' ? 'rgba(40,200,64,0.22)' : status === 'WARNING' ? 'rgba(255,149,0,0.22)' : 'rgba(255,59,48,0.22)'
  const pillCls = status === 'SAFE' ? 'pill pill-safe' : status === 'WARNING' ? 'pill pill-warning' : 'pill pill-danger'
  const deg     = Math.round(capped * 3.6)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'inline-block', marginBottom: 10 }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: `conic-gradient(${color} 0deg ${deg}deg, rgba(60,60,67,0.10) ${deg}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 24px ${shadow}` }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 'var(--sz-title2)', fontWeight: 700, color, letterSpacing: '-0.30px', lineHeight: 1.1 }}>{(percentage || 0).toFixed(1)}%</div>
            <div style={{ fontSize: 9, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--label-3)', fontWeight: 600 }}>DSR</div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 4 }}><span className={pillCls}>{status}</span></div>
      <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>BNM Limit: 60%</div>
    </div>
  )
}

function AgentHeader({ n, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div className="agent-badge">{n}</div>
      <div>
        <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Agent {n}</div>
        <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 600, color: 'var(--label)' }}>{label.replace(/^[^\w\s]+\s*/, '')}</div>
      </div>
    </div>
  )
}

/* ─── Visualizations ─────────────────────────────────────────── */

function AllocationBar({ income, debts, expenses, savings }) {
  const total = income || 1
  const items = [
    { label: 'Debts',    value: debts,               color: 'var(--red)',    pct: (debts / total) * 100 },
    { label: 'Expenses', value: expenses,             color: 'var(--orange)', pct: (expenses / total) * 100 },
    { label: 'Savings',  value: Math.max(0, savings), color: 'var(--green)', pct: (Math.max(0, savings) / total) * 100 },
  ].filter(i => i.value > 0)
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 10, gap: 1 }}>
        {items.map(({ label, color, pct }) => (
          <div key={label} style={{ width: `${pct}%`, background: color, transition: 'width 0.9s ease', minWidth: pct > 0 ? 2 : 0 }} />
        ))}
        <div style={{ flex: 1, background: 'rgba(118,118,128,0.12)' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px' }}>
        {items.map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--label-3)' }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--label-2)' }}>RM {value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExpenseBreakdown({ expenses }) {
  const items = Object.entries(expenses || {})
    .map(([k, v]) => ({ label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: Number(v) || 0 }))
    .filter(i => i.value > 0).sort((a, b) => b.value - a.value)
  if (!items.length) return <div style={{ color: 'var(--label-3)', fontSize: 'var(--sz-footnote)' }}>No expenses entered.</div>
  const max = items[0].value
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(({ label, value }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', marginBottom: 4 }}>
            <span>{label}</span>
            <span style={{ fontWeight: 600, color: 'var(--label)' }}>RM {value.toLocaleString()}</span>
          </div>
          <div className="progress-track">
            <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: 'var(--teal-gradient)', borderRadius: 99, transition: 'width 0.9s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DSRTrend({ history }) {
  if (history.length < 2) return null
  const pts = history.slice(0, 8).reverse()
  const maxDSR = Math.max(...pts.map(p => p.dsr || 0), 80)
  const W = 320, H = 80, PAD = 14
  const coords = pts.map((p, i) => ({
    x: PAD + (i / (pts.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((p.dsr || 0) / maxDSR) * (H - PAD * 2),
  }))
  const line60 = H - PAD - (60 / maxDSR) * (H - PAD * 2)
  const pathD  = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="section-label" style={{ marginBottom: 8 }}>DSR Trend</div>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
        <line x1={PAD} x2={W - PAD} y1={line60} y2={line60} stroke="rgba(255,59,48,0.35)" strokeWidth={1} strokeDasharray="4,3" />
        <text x={W - PAD + 2} y={line60 + 4} fontSize={9} fill="rgba(255,59,48,0.6)">60%</text>
        <path d={pathD} fill="none" stroke="var(--teal)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={3} fill="var(--teal)" />)}
      </svg>
    </div>
  )
}

/* ─── Financial Shield Score ─────────────────────────────────── */

function computeFHS(dsr, risk) {
  if (!dsr || !risk) return null
  const dsrPct    = dsr.dsr_percentage    || 0
  const riskScore = risk.risk_score       || 50
  const savRate   = risk.savings_rate_percentage || 0
  const dComp = Math.max(0, Math.min(400, Math.round((1 - dsrPct / 100) * 400)))
  const rComp = Math.max(0, Math.min(300, Math.round((1 - riskScore / 100) * 300)))
  const sComp = Math.max(0, Math.min(300, Math.round(Math.min(savRate / 20, 1) * 300)))
  const total = dComp + rComp + sComp
  const grade = total >= 850 ? 'S' : total >= 700 ? 'A' : total >= 550 ? 'B' : total >= 400 ? 'C' : 'F'
  const label = total >= 850 ? 'Excellent' : total >= 700 ? 'Good' : total >= 550 ? 'Fair' : total >= 400 ? 'Poor' : 'Critical'
  const color = total >= 700 ? '#1a9930' : total >= 550 ? '#b86e00' : '#cc2f26'
  return { total, grade, label, color, dComp, rComp, sComp }
}

function FHSDisplay({ fhs }) {
  if (!fhs) return null
  const deg = Math.round((fhs.total / 1000) * 360)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
        <div style={{ width: 160, height: 160, borderRadius: '50%', background: `conic-gradient(${fhs.color} 0deg ${deg}deg, rgba(60,60,67,0.08) ${deg}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px ${fhs.color}22` }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: fhs.color, letterSpacing: '-1px', lineHeight: 1 }}>{fhs.grade}</div>
            <div style={{ fontSize: 'var(--sz-subhead)', fontWeight: 700, color: fhs.color }}>{fhs.total}</div>
            <div style={{ fontSize: 9, color: 'var(--label-3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>out of 1000</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 700, color: fhs.color, marginBottom: 2 }}>{fhs.label}</div>
      <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>Financial Shield Score</div>
    </div>
  )
}

/* ─── Savings Projection ─────────────────────────────────────── */

function SavingsProjection({ currentSavings, monthlySavings, months = 12 }) {
  if (!monthlySavings && !currentSavings) return null
  const pts = Array.from({ length: months + 1 }, (_, i) => currentSavings + monthlySavings * i)
  const maxVal = Math.max(...pts)
  const W = 560, H = 100, PAD = 14
  const coords = pts.map((v, i) => ({
    x: PAD + (i / months) * (W - PAD * 2),
    y: H - PAD - (v / maxVal) * (H - PAD * 2),
  }))
  const pathD  = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const areaD  = `${pathD} L ${coords[coords.length - 1].x} ${H - PAD} L ${coords[0].x} ${H - PAD} Z`
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="section-label">12-Month Savings Projection</div>
        <div style={{ fontSize: 'var(--sz-footnote)', color: 'var(--teal)', fontWeight: 700 }}>
          → RM {pts[months].toLocaleString()}
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--teal)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#savGrad)" />
        <path d={pathD} fill="none" stroke="var(--teal)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {[0, 3, 6, 9, 12].map(m => (
          <g key={m}>
            <circle cx={coords[m].x} cy={coords[m].y} r={3.5} fill="var(--teal)" />
            <text x={coords[m].x} y={H - 2} textAnchor="middle" fontSize={9} fill="var(--label-3)">M{m}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginTop: 2 }}>
        <span>Now: RM {currentSavings.toLocaleString()}</span>
        <span>+RM {monthlySavings.toLocaleString()}/mo</span>
        <span>Month 12: RM {pts[12].toLocaleString()}</span>
      </div>
    </div>
  )
}

/* ─── Malaysian Expense Benchmark ────────────────────────────── */

const MY_BENCHMARKS = {
  food: 15, transport: 12, utilities: 6, entertainment: 5,
  subscriptions: 2, medical: 3, parents: 5, other: 5,
}

function BenchmarkChart({ expenses, income }) {
  if (!income) return null
  const items = Object.entries(expenses || {})
    .filter(([, v]) => Number(v) > 0)
    .map(([k, v]) => {
      const val     = Number(v)
      const pct     = (val / income) * 100
      const bench   = MY_BENCHMARKS[k] || 5
      const diff    = pct - bench
      const label   = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      return { key: k, label, val, pct, bench, diff, over: diff > 2 }
    })
    .sort((a, b) => b.diff - a.diff)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map(({ label, val, pct, bench, over }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sz-footnote)', marginBottom: 4 }}>
            <span style={{ color: 'var(--label-2)' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--label-3)' }}>Avg {bench}%</span>
              <span style={{ fontWeight: 700, color: over ? '#cc2f26' : '#1a9930' }}>{pct.toFixed(1)}%</span>
              {over && <span style={{ fontSize: 10, background: 'var(--red-soft)', color: '#cc2f26', borderRadius: 4, padding: '1px 6px' }}>+{(pct - bench).toFixed(1)}%</span>}
            </div>
          </div>
          <div style={{ position: 'relative', height: 6, borderRadius: 99, background: 'rgba(60,60,67,0.08)' }}>
            <div style={{ position: 'absolute', left: 0, height: '100%', width: `${Math.min(bench, 40)}%`, background: 'rgba(60,60,67,0.15)', borderRadius: 99 }} />
            <div style={{ position: 'absolute', left: 0, height: '100%', width: `${Math.min(pct, 40)}%`, background: over ? 'var(--red)' : 'var(--green)', borderRadius: 99, transition: 'width 0.9s ease' }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', padding: '8px 12px', background: 'var(--surface-row)', borderRadius: 10 }}>
        Grey bar = Malaysian average. Your bar = your actual spend.
      </div>
    </div>
  )
}

/* ─── Analytics Tab ──────────────────────────────────────────── */

function AnalyticsTab({ dsr, risk, formData }) {
  const fhs = computeFHS(dsr, risk)
  const income   = Object.values(formData?.income   || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const debts    = Object.values(formData?.debts    || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const expenses = Object.values(formData?.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const savings  = income - debts - expenses
  const curSav   = Number(formData?.currentSavings) || 0
  const monthlySavingsTarget = Number(formData?.monthlySavingsTarget) || Math.max(0, savings)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Financial Shield Score */}
      {fhs && (
        <div className="glass" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${fhs.color}14`, border: `0.5px solid ${fhs.color}33`, borderRadius: 99, padding: '4px 14px', fontSize: 'var(--sz-caption)', fontWeight: 600, color: fhs.color, marginBottom: 20 }}>
            DebtSense MY Financial Shield Score
          </div>
          <FHSDisplay fhs={fhs} />
          <hr className="divider" />
          <div className="section-label" style={{ marginBottom: 14 }}>Score Breakdown</div>
          {[
            { label: 'DSR Component', value: fhs.dComp, max: 400, desc: `DSR ${dsr.dsr_percentage?.toFixed(1)}% of 60% BNM limit` },
            { label: 'Risk Component', value: fhs.rComp, max: 300, desc: `Risk score ${risk.risk_score}/100` },
            { label: 'Savings Component', value: fhs.sComp, max: 300, desc: `Savings rate ${risk.savings_rate_percentage?.toFixed(1)}% of 20% target` },
          ].map(({ label, value, max, desc }) => (
            <div key={label} style={{ marginBottom: 14, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sz-footnote)', marginBottom: 5 }}>
                <span style={{ color: 'var(--label-2)' }}>{label}</span>
                <span style={{ fontWeight: 700, color: 'var(--label)' }}>{value} / {max}</span>
              </div>
              <div className="progress-track">
                <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: 'var(--teal-gradient)', borderRadius: 99, transition: 'width 0.9s ease' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--label-3)', marginTop: 3 }}>{desc}</div>
            </div>
          ))}
          <div style={{ padding: '12px 16px', background: 'var(--surface-row)', borderRadius: 12, fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', lineHeight: 1.6, textAlign: 'left' }}>
            <strong>Grade {fhs.grade} ({fhs.label}) — {fhs.total}/1000.</strong>{' '}
            {fhs.total >= 700
              ? 'Your finances are on a healthy track. Focus on growing investments and reaching your savings goals.'
              : fhs.total >= 500
              ? 'There\'s room to improve. Reducing your DSR and increasing savings rate will raise your score significantly.'
              : 'Your financial health needs attention. Start by reducing high-interest debts and building an emergency fund.'}
          </div>
        </div>
      )}

      {/* Savings projection */}
      {(curSav > 0 || monthlySavingsTarget > 0) && (
        <div className="glass" style={{ padding: '20px 24px' }}>
          <SavingsProjection currentSavings={curSav} monthlySavings={monthlySavingsTarget} />
        </div>
      )}

      {/* Expense benchmark */}
      {income > 0 && (
        <div className="glass" style={{ padding: '20px 24px' }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Spending vs Malaysian Average</div>
          <p style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginBottom: 14 }}>Based on % of monthly income. Red = above average spending for Malaysians.</p>
          <BenchmarkChart expenses={formData?.expenses} income={income} />
        </div>
      )}

      {/* Income allocation */}
      {income > 0 && (
        <div className="glass" style={{ padding: '20px 24px' }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Income Allocation</div>
          <AllocationBar income={income} debts={debts} expenses={expenses} savings={savings} />
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>
            <span>Total Income: RM {income.toLocaleString()}/mo</span>
            <span>Free Cash: <strong style={{ color: savings >= 0 ? '#1a9930' : '#cc2f26' }}>RM {savings.toLocaleString()}</strong></span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Investment Recommendations with Like/Dislike ───────────── */

const INVESTMENT_GUIDES = {
  'ASB': ['Open an ASB account at any Maybank or CIMB branch (for Bumiputera)', 'Minimum initial investment: RM10', 'Set up auto-debit from your salary account', 'Check your balance via ASB Online at asb.com.my'],
  'EPF': ['Log in to i-Akaun at kwsp.gov.my', 'Go to i-Saraan for voluntary contributions if self-employed', 'Transfer from EPF Akaun 3 for flexible access', 'Review your Account 1 (retirement) and Account 2 (pre-retirement)'],
  'Fixed Deposit': ['Compare FD rates at loanstreet.com.my or ringgitplus.com', 'Minimum usually RM1,000–RM5,000 for 3–12 months', 'Check promo rates from CIMB, Maybank, RHB, OCBC', 'Auto-renew option available at most banks'],
  'Gold': ['Sign up at Public Gold (publicgold.com.my) or HelloGold', 'Buy in grams — even 0.5g is fine to start', 'Avoid physical gold (storage risk); use digital gold platforms', 'Good hedge against inflation'],
  'Unit Trust': ['Open a Fundsupermart or Luno account', 'Start with EPF-approved funds or Amanah Saham funds', 'Look for Shariah-compliant options if needed', 'Reinvest dividends automatically'],
}

function InvestmentCard({ rec, idx, liked, onLike, onDislike }) {
  if (!rec?.name) return null
  const isLiked    = liked === 'like'
  const isDisliked = liked === 'dislike'

  // Get guide steps — try to match investment name to known guides
  const guideKey = Object.keys(INVESTMENT_GUIDES).find(k => rec.name?.toUpperCase().includes(k.toUpperCase()))
  const guide    = guideKey ? INVESTMENT_GUIDES[guideKey] : (rec.getting_started_steps?.length ? rec.getting_started_steps : null)

  if (isDisliked) return (
    <div style={{ background: 'var(--surface-row)', borderRadius: 14, padding: '14px 18px', opacity: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-3)', textDecoration: 'line-through' }}>{rec.name}</div>
        <div style={{ fontSize: 10, color: 'var(--label-3)' }}>Not interested</div>
      </div>
      <button className="btn-ghost" onClick={onDislike} style={{ fontSize: 'var(--sz-caption)', padding: '5px 12px' }}>Undo</button>
    </div>
  )

  return (
    <div style={{
      background:    isLiked ? 'var(--green-soft)' : idx === 0 ? 'var(--teal-soft)' : 'var(--surface-row)',
      border:        `0.5px solid ${isLiked ? 'rgba(40,200,64,0.25)' : idx === 0 ? 'var(--teal-border)' : 'transparent'}`,
      borderRadius:  14,
      overflow:      'hidden',
      transition:    'all 0.2s',
    }}>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            {idx === 0 && !isLiked && <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--teal)', fontWeight: 600, marginBottom: 3 }}>Top Pick</div>}
            {isLiked && <div style={{ fontSize: 'var(--sz-caption)', color: '#1a9930', fontWeight: 600, marginBottom: 3 }}>Interested</div>}
            <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 600, color: 'var(--label)' }}>{rec.name}</div>
            <div style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-3)' }}>{rec.platform} · {rec.risk_level} risk</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 700, color: '#1a9930' }}>RM {rec.monthly_amount_rm?.toLocaleString()}/mo</div>
            <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>{rec.expected_return}</div>
          </div>
        </div>
        <div style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', marginBottom: 12, lineHeight: 1.5 }}>{rec.why_suitable}</div>

        {/* Like / Dislike actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onLike}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background:    isLiked ? '#1a9930' : 'var(--surface-input)',
              border:        'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)',
              fontSize:      'var(--sz-footnote)', fontWeight: 600, color: isLiked ? '#fff' : 'var(--label-2)',
              padding:       '9px 0', transition: 'all 0.15s',
            }}
          >{isLiked ? 'Interested' : 'Interested'}</button>
          <button
            onClick={onDislike}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background:    'var(--surface-input)', border: 'none', borderRadius: 10, cursor: 'pointer',
              fontFamily:    'var(--font)', fontSize: 'var(--sz-footnote)', fontWeight: 500,
              color:         'var(--label-3)', padding: '9px 0', transition: 'all 0.15s',
            }}
          >Not for me</button>
        </div>
      </div>

      {/* Expanded getting-started guide when liked */}
      {isLiked && (
        <div className="fade-in" style={{ borderTop: '0.5px solid rgba(40,200,64,0.20)', padding: '16px 18px', background: 'rgba(40,200,64,0.04)' }}>
          <div className="section-label" style={{ color: '#1a9930', marginBottom: 10 }}>Getting Started Guide</div>
          {guide
            ? guide.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div className="agent-badge" style={{ width: 20, height: 20, fontSize: 9, flexShrink: 0, background: 'linear-gradient(135deg,#1a9930,#28c840)' }}>{i + 1}</div>
                <span style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', lineHeight: 1.5 }}>{toStr(step)}</span>
              </div>
            ))
            : <div style={{ background: 'rgba(0,196,170,0.10)', border: '0.5px solid var(--teal-border)', borderRadius: 8, padding: '10px 12px', fontSize: 'var(--sz-footnote)', color: 'var(--teal-dark)' }}>▶ {rec.how_to_start}</div>
          }
        </div>
      )}
    </div>
  )
}

/* ─── Scam Dimension Analysis ───────────────────────────────── */

const DIM_ICONS = {}
const DIM_RISK_COLOR = { HIGH: '#cc2f26', MEDIUM: '#b86e00', LOW: '#1a9930', CLEAN: '#1a9930' }

function ScamDimensions({ dimensions }) {
  if (!dimensions?.length) return null
  return (
    <div data-grid="scam-dimensions" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
      {dimensions.map((d, i) => {
        const c = DIM_RISK_COLOR[d.risk] || '#b86e00'
        return (
          <div key={i} style={{ background: `${c}0d`, border: `0.5px solid ${c}33`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--sz-caption)', fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{d.dimension}</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, background: `${c}20`, color: c, borderRadius: 4, padding: '1px 6px' }}>{d.risk}</span>
            </div>
            <p style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)', lineHeight: 1.5, margin: 0, marginBottom: d.markers_found?.length ? 8 : 0 }}>{d.explanation}</p>
            {d.markers_found?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {d.markers_found.map((m, j) => (
                  <div key={j} style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                    <span style={{ color: c, fontSize: 10, flexShrink: 0, marginTop: 2 }}>▸</span>
                    <span style={{ fontSize: 10, color: 'var(--label-2)', lineHeight: 1.4 }}>{m}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Tax Relief & Zakat Tab ────────────────────────────────── */

const STATUS_COLORS = {
  MAXED:          { bg: 'var(--green-soft)', color: '#1a9930', label: 'Maxed ✓' },
  PARTIAL:        { bg: 'rgba(255,149,0,0.08)', color: '#b86e00', label: 'Partial' },
  UNCLAIMED:      { bg: 'rgba(255,59,48,0.07)', color: '#cc2f26', label: 'Unclaimed' },
  NOT_APPLICABLE: { bg: 'var(--surface-row)', color: 'var(--label-3)', label: 'N/A' },
}

function TaxZakatTab({ formData }) {
  const [loading, setLoading] = useState(false)
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState('')

  const handleCalculate = async () => {
    setLoading(true); setError('')
    let lastErr = null
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 3000))
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 90000)
        const res = await fetch('/api/tax-zakat', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            profile: {
              income:        formData?.income,
              debts:         formData?.debts,
              expenses:      formData?.expenses,
              age:           formData?.age,
              lifeStage:     formData?.lifeStage,
              currentSavings: formData?.currentSavings,
            },
          }),
          signal: controller.signal,
        })
        clearTimeout(timer)
        if (res.status === 429) throw new Error('rate_limited')
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        setData(await res.json())
        setLoading(false)
        return
      } catch (e) {
        lastErr = e
        const raw = e.message || ''
        if (raw === 'rate_limited' || raw.includes('quota')) break
        if (!raw.includes('abort') && !raw.includes('500') && !raw.includes('503') && raw !== 'Failed to fetch') break
      }
    }
    const raw = lastErr?.message || ''
    setError(raw === 'rate_limited' ? 'Too many requests — please wait a moment.' : raw.includes('quota') ? 'AI quota exceeded. Please try again later.' : 'Server is temporarily unavailable. Please try again in a moment.')
    setLoading(false)
  }

  const handlePrint = () => {
    const el = document.getElementById('lhdn-prepsheet')
    if (!el) return
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>LHDN e-Filing Prep Sheet — DebtSense MY</title>
      <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111;max-width:640px;margin:auto}
      h1{font-size:20px}h2{font-size:14px;letter-spacing:.5px;text-transform:uppercase;color:#555;margin-top:24px}
      table{width:100%;border-collapse:collapse;margin-top:10px}td,th{padding:8px 10px;border:1px solid #ddd;font-size:13px;text-align:left}
      th{background:#f4f4f4;font-weight:600}.green{color:#1a7a30}.red{color:#cc2f26}.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px}
      .safe{background:#d4f5dc;color:#1a7a30}.partial{background:#fff3cd;color:#856404}.unclaimed{background:#f8d7da;color:#842029}
      ul{padding-left:20px}li{margin-bottom:6px;font-size:13px}p{font-size:13px;color:#333}
      .footer{margin-top:32px;font-size:11px;color:#888;border-top:1px solid #ddd;padding-top:12px}
      @media print{body{padding:12px}.footer{position:fixed;bottom:0;width:100%}}</style>
      </head><body>${el.innerHTML}
      <div class="footer">Generated by DebtSense MY · Assessment Year 2024 · For estimation purposes only. Consult a tax professional for exact figures.</div>
      </body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 400)
  }

  if (!data) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,122,255,0.08)', border: '0.5px solid rgba(0,122,255,0.20)', borderRadius: 99, padding: '4px 14px', fontSize: 'var(--sz-caption)', fontWeight: 600, color: '#0a5ed9', marginBottom: 20 }}>
          Agent 7 · LHDN AY2024
        </div>
        <div style={{ marginBottom: 14 }}><CreditCard size={48} color="var(--teal)" strokeWidth={1.5} /></div>
        <div style={{ fontSize: 'var(--sz-title2)', fontWeight: 700, color: 'var(--label)', marginBottom: 8 }}>Tax Relief & Zakat Optimizer</div>
        <p style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', marginBottom: 20, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 20px' }}>
          Scan your spending to maximize LHDN tax reliefs and calculate your Zakat obligation. Generates a one-click LHDN e-Filing prep sheet with a documents checklist.
        </p>
        {error && <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.25)', borderRadius: 10, fontSize: 'var(--sz-footnote)', color: '#cc2f26' }}>Error: {error}</div>}
        <button className="btn-primary" onClick={handleCalculate} disabled={loading}
          style={{ background: 'linear-gradient(135deg,#0a5ed9,#007aff)', boxShadow: '0 4px 18px rgba(0,122,255,0.30)', maxWidth: 320, margin: '0 auto' }}>
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />Analyzing LHDN reliefs...</span>
            : 'Calculate My Tax & Zakat'}
        </button>
        <p style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginTop: 10 }}>Estimates based on your income and spending. For AY2024 filing.</p>
      </div>

      {/* What this does */}
      <div className="glass" style={{ padding: '20px 24px' }}>
        <div className="section-label" style={{ marginBottom: 14 }}>What Agent 7 Analyzes</div>
        {[
          { title: 'Tax Relief Gaps',       desc: 'Identifies unclaimed LHDN reliefs — medical, lifestyle, EPF, insurance — and the exact RM you\'re missing.' },
          { title: 'Spending Reallocation', desc: 'Suggests moving money from non-deductible to deductible categories (e.g. OTC meds → medical insurance).' },
          { title: 'Zakat Calculator',      desc: 'If income exceeds nisab (~RM 23,000/yr), calculates your 2.5% zakat obligation monthly and annually.' },
          { title: 'LHDN Prep Sheet',       desc: 'Generates a printable e-Filing checklist with all documents you need to gather before submitting.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '0.5px solid var(--sep)' : 'none' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0, marginTop: 6 }} />
            <div>
              <div style={{ fontSize: 'var(--sz-footnote)', fontWeight: 600, color: 'var(--label)', marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const totalRelief   = data.total_relief_amount     || 0
  const missedRelief  = data.missed_relief_rm         || 0
  const annualIncome  = data.annual_income_estimate   || 0
  const chargeable    = data.estimated_chargeable_income || 0
  const taxPayable    = data.estimated_tax_payable_rm  || 0

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header metrics */}
      <div data-grid="tax-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Annual Income',   value: `RM ${annualIncome.toLocaleString()}`, color: '#1a9930' },
          { label: 'Total Relief',    value: `RM ${totalRelief.toLocaleString()}`, color: '#0a5ed9' },
          { label: 'Est. Tax Payable', value: `RM ${taxPayable.toLocaleString()}`, color: taxPayable > 5000 ? '#cc2f26' : '#b86e00' },
          { label: 'Missed Relief',   value: `RM ${missedRelief.toLocaleString()}`, color: missedRelief > 1000 ? '#cc2f26' : '#1a9930' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass" style={{ padding: '16px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 700, color, letterSpacing: '-0.30px', marginBottom: 3, marginTop: 4 }}>{value}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.3px', textTransform: 'uppercase', color: 'var(--label-3)', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Relief breakdown */}
      {data.relief_items?.length > 0 && (
        <div className="glass" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="section-label">LHDN Relief Breakdown — AY2024</div>
            {missedRelief > 0 && (
              <div style={{ fontSize: 'var(--sz-caption)', fontWeight: 700, color: '#cc2f26', background: 'rgba(255,59,48,0.07)', borderRadius: 8, padding: '3px 10px' }}>
                RM {missedRelief.toLocaleString()} unclaimed
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.relief_items.map((item, i) => {
              const sc = STATUS_COLORS[item.status] || STATUS_COLORS.PARTIAL
              const pct = item.max_rm > 0 ? Math.min((item.claimed_rm / item.max_rm) * 100, 100) : 100
              return (
                <div key={i} style={{ padding: '12px 14px', background: 'var(--surface-row)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <div>
                      <span style={{ fontSize: 'var(--sz-subhead)', fontWeight: 600, color: 'var(--label)' }}>{item.category}</span>
                      <span style={{ marginLeft: 8, fontSize: 10, background: sc.bg, color: sc.color, borderRadius: 6, padding: '2px 7px', fontWeight: 600 }}>{sc.label}</span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 'var(--sz-footnote)', fontWeight: 700, color: 'var(--label)' }}>RM {(item.claimed_rm || 0).toLocaleString()}</span>
                      <span style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}> / RM {(item.max_rm || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div style={{ height: '100%', width: `${pct}%`, background: item.status === 'MAXED' ? 'linear-gradient(90deg,#1a9930,#5dd879)' : 'linear-gradient(90deg,#0a5ed9,#38bdf8)', borderRadius: 99, transition: 'width 0.9s ease' }} />
                  </div>
                  {item.gap_rm > 0 && <div style={{ marginTop: 5, fontSize: 'var(--sz-caption)', color: '#b86e00' }}>Can still claim: RM {item.gap_rm.toLocaleString()}</div>}
                  {item.tip && <div style={{ marginTop: 4, fontSize: 'var(--sz-caption)', color: 'var(--label-3)', fontStyle: 'italic' }}>{item.tip}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reallocation suggestions */}
      {data.reallocation_suggestions?.length > 0 && (
        <div className="glass" style={{ padding: '20px 24px' }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Spending Reallocation to Maximize Relief</div>
          <p style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginBottom: 14 }}>Move money from non-deductible to tax-deductible categories.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.reallocation_suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'rgba(0,122,255,0.05)', border: '0.5px solid rgba(0,122,255,0.15)', borderRadius: 12, alignItems: 'flex-start' }}>
                <div className="agent-badge" style={{ background: 'linear-gradient(135deg,#0a5ed9,#007aff)', flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zakat */}
      {data.zakat_applicable && (
        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#1a7a30,#28c840)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>زكاة</span>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Zakat Pendapatan</div>
              <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 700, color: '#fff' }}>Zakat Calculator</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--sz-title2)', fontWeight: 700, color: '#fff' }}>RM {(data.zakat_annual_rm || 0).toLocaleString()}/yr</div>
              <div style={{ fontSize: 'var(--sz-caption)', color: 'rgba(255,255,255,0.8)' }}>RM {(data.zakat_monthly_rm || 0).toLocaleString()}/mo</div>
            </div>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <p style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.6, marginBottom: 12 }}>{data.zakat_explanation}</p>
            <div style={{ background: 'var(--green-soft)', borderRadius: 10, padding: '10px 14px', fontSize: 'var(--sz-caption)', color: '#1a7a30' }}>
              Pay online at: <strong>ezakat.islam.gov.my</strong> or via your state's Zakat collection centre (e.g. LZS, MAIWP, MAINPP)
            </div>
          </div>
        </div>
      )}

      {/* Tax tips */}
      {data.tax_tips?.length > 0 && (
        <div className="glass" style={{ padding: '20px 24px' }}>
          <div className="section-label" style={{ marginBottom: 12 }}>Tax Saving Tips for You</div>
          {data.tax_tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < data.tax_tips.length - 1 ? '0.5px solid var(--sep)' : 'none' }}>
              <span style={{ color: '#0a5ed9', fontWeight: 700, flexShrink: 0 }}>›</span>
              <span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.5 }}>{toStr(tip)}</span>
            </div>
          ))}
        </div>
      )}

      {/* LHDN Prep Sheet */}
      {data.lhdn_checklist?.length > 0 && (
        <div className="glass" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="section-label">LHDN e-Filing Prep Sheet</div>
              <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>Everything you need before opening e-Daftar / e-Filing</div>
            </div>
            <button className="btn-ghost" onClick={handlePrint} style={{ fontSize: 'var(--sz-caption)', padding: '7px 14px', flexShrink: 0 }}>
              Print / Save PDF
            </button>
          </div>

          {/* Printable content */}
          <div id="lhdn-prepsheet">
            <h1 style={{ margin: 0 }}>LHDN e-Filing Prep Sheet</h1>
            <p style={{ margin: '4px 0 20px', color: 'var(--label-3)', fontSize: 'var(--sz-caption)' }}>Assessment Year 2024 · Generated by DebtSense MY · For estimation only</p>

            <div data-grid="lhdn-summary" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Annual Gross Income',  value: `RM ${annualIncome.toLocaleString()}` },
                { label: 'Total Relief Claimed',  value: `RM ${totalRelief.toLocaleString()}` },
                { label: 'Chargeable Income',     value: `RM ${chargeable.toLocaleString()}` },
                { label: 'Est. Tax Payable',       value: `RM ${taxPayable.toLocaleString()}` },
                { label: 'Tax Bracket',            value: data.tax_bracket || '—' },
                { label: 'Zakat (if applicable)',  value: data.zakat_applicable ? `RM ${data.zakat_annual_rm?.toLocaleString()}/yr` : 'Not applicable' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--surface-row)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 'var(--sz-subhead)', fontWeight: 700, color: 'var(--label)' }}>{value}</div>
                </div>
              ))}
            </div>

            <div className="section-label" style={{ marginBottom: 10 }}>Documents Checklist</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {data.lhdn_checklist.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'var(--surface-row)', borderRadius: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: '1.5px solid rgba(60,60,67,0.22)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label)', lineHeight: 1.5 }}>{toStr(item)}</span>
                </div>
              ))}
            </div>

            {data.relief_items?.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div className="section-label" style={{ marginBottom: 10 }}>Relief Summary</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--sz-footnote)' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-row)' }}>
                      {['Category', 'Estimated Claim', 'Cap', 'Gap'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 'var(--sz-caption)', color: 'var(--label-3)', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', borderBottom: '0.5px solid var(--sep)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.relief_items.map((item, i) => {
                      const sc = STATUS_COLORS[item.status] || STATUS_COLORS.PARTIAL
                      return (
                        <tr key={i} style={{ borderBottom: '0.5px solid var(--sep)' }}>
                          <td style={{ padding: '9px 12px', color: 'var(--label)' }}>{item.category}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: sc.color }}>RM {(item.claimed_rm || 0).toLocaleString()}</td>
                          <td style={{ padding: '9px 12px', color: 'var(--label-3)' }}>RM {(item.max_rm || 0).toLocaleString()}</td>
                          <td style={{ padding: '9px 12px', color: item.gap_rm > 0 ? '#cc2f26' : '#1a9930', fontWeight: 600 }}>{item.gap_rm > 0 ? `RM ${item.gap_rm.toLocaleString()}` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(0,122,255,0.06)', border: '0.5px solid rgba(0,122,255,0.18)', borderRadius: 10, fontSize: 'var(--sz-caption)', color: '#0a5ed9' }}>
            File at: <strong>efiling.hasil.gov.my</strong> · LHDN Helpline: <strong>1-800-88-5436</strong> · These are estimates — verify with your actual receipts.
          </div>
          <button className="btn-ghost" onClick={() => setData(null)} style={{ marginTop: 12, fontSize: 'var(--sz-caption)' }}>↩ Recalculate</button>
        </div>
      )}
    </div>
  )
}

/* ─── Scam Threat Map ────────────────────────────────────────── */

function ScamThreatMap({ dsr, risk, formData }) {
  const dsrPct         = dsr?.dsr_percentage || 0
  const riskScore      = risk?.risk_score    || 0
  const savingsRate    = risk?.savings_rate_percentage || 0
  const emergencyMo    = risk?.emergency_fund_months   || 0
  const age            = Number(formData?.age) || 30
  const riskAppetite   = formData?.riskAppetite || 'Moderate'

  const scams = [
    { name: 'Macau Scam (Impersonation)', score: Math.min(100, Math.round(dsrPct * 0.7 + riskScore * 0.3)), why: 'Debt stress makes urgency tactics and fake-authority calls effective' },
    { name: 'Ah Long / Loan Sharks',      score: Math.min(100, Math.round(dsrPct * 0.8 + (emergencyMo < 1 ? 25 : 0))), why: 'High DSR signals desperation for quick, no-questions cash' },
    { name: 'Fake Investment Schemes',    score: Math.min(100, Math.round((100 - savingsRate) * 0.45 + (riskAppetite === 'Aggressive' ? 30 : 0) + riskScore * 0.15)), why: 'Savings gap creates strong desire for outsized returns' },
    { name: 'Job / Part-Time Scams',      score: Math.min(100, Math.round((age < 30 ? 45 : age < 35 ? 28 : 15) + riskScore * 0.25)), why: 'Younger workers are primary targets for fake WFH gig deposits' },
    { name: 'Love / Romance Scam',        score: Math.min(100, Math.round((age < 35 ? 32 : 18) + (savingsRate < 5 ? 20 : 0) + riskScore * 0.1)), why: 'Financial stress lowers guard against emotional manipulation' },
    { name: 'Phishing (Bank / LHDN)',     score: Math.min(100, Math.round(28 + riskScore * 0.2)), why: 'Digital banking threats affect all financial profiles' },
    { name: 'Crypto / Forex Rugpull',     score: Math.min(100, Math.round((riskAppetite === 'Aggressive' ? 55 : riskAppetite === 'Moderate' ? 32 : 14) + riskScore * 0.15)), why: 'High-risk appetite makes speculative schemes attractive' },
  ].sort((a, b) => b.score - a.score)

  return (
    <div className="glass" style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 5 }}>
          Scam Targeting Profile — Based on Your Financial Data
        </div>
        <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>
          How closely you match the typical victim profile for each scam type
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {scams.map(({ name, score, why }) => {
          const level    = score >= 65 ? 'ACTIVE THREAT' : score >= 35 ? 'MODERATE' : 'LOW'
          const tColor   = score >= 65 ? '#cc2f26' : score >= 35 ? '#b86e00' : '#1a9930'
          const tBg      = score >= 65 ? 'rgba(255,59,48,0.08)' : score >= 35 ? 'rgba(255,149,0,0.08)' : 'rgba(40,200,64,0.08)'
          const barColor = score >= 65 ? 'linear-gradient(90deg,var(--teal),#ffb830,var(--red))' : score >= 35 ? 'linear-gradient(90deg,var(--teal),#ffb830)' : 'var(--teal-gradient)'
          return (
            <div key={name} style={{ background: 'var(--surface-row)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 'var(--sz-subhead)', fontWeight: 600, color: 'var(--label)', flex: 1 }}>{name}</span>
                <span style={{ fontSize: 9, fontWeight: 700, background: tBg, color: tColor, borderRadius: 6, padding: '2px 8px', flexShrink: 0 }}>{level}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: tColor, flexShrink: 0, minWidth: 32, textAlign: 'right' }}>{score}%</span>
              </div>
              <div style={{ position: 'relative', height: 5, borderRadius: 99, background: 'rgba(60,60,67,0.08)', marginBottom: 5 }}>
                <div style={{ position: 'absolute', left: 0, height: '100%', width: `${score}%`, borderRadius: 99, background: barColor, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--label-3)' }}>{why}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Threat Assessment Brief (client-side, Fraud Profile tab) ── */

function ThreatAssessmentBrief({ formData }) {
  const totalIncome   = Object.values(formData?.income   || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const totalDebts    = Object.values(formData?.debts    || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const totalExpenses = Object.values(formData?.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const dsr           = totalIncome > 0 ? (totalDebts / totalIncome) * 100 : 0
  const savingsRate   = totalIncome > 0 ? Math.max(0, (totalIncome - totalDebts - totalExpenses) / totalIncome * 100) : 0
  const emergencyMo   = totalExpenses > 0 ? (Number(formData?.currentSavings) || 0) / totalExpenses : 0
  const age           = Number(formData?.age) || 30
  const riskAppetite  = formData?.riskAppetite || 'Moderate'

  const threats = []
  if (dsr > 50)              threats.push('High debt load signals financial desperation — prime target for predatory loan offers and get-rich-quick schemes')
  if (emergencyMo < 3)       threats.push("Low liquidity buffer means you're vulnerable to urgent payment scams (fake summons, Maybank 'fraud alert' calls)")
  if (savingsRate < 10)      threats.push('Savings gap creates susceptibility to fake high-yield investment promises (7–30% monthly returns claimed)')
  if (age < 30)              threats.push('Younger demographic heavily targeted by job scams and social engineering via WhatsApp/Telegram')
  if (riskAppetite === 'Aggressive') threats.push('Investment interest makes you a target for crypto/forex/MLM schemes promising outsized returns')

  if (!threats.length) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(40,200,64,0.08)', border: '0.5px solid rgba(40,200,64,0.22)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
      <CheckCircle2 size={20} color="#1a9930" />
      <div style={{ fontSize: 'var(--sz-subhead)', color: '#1a9930', lineHeight: 1.5 }}>
        Your financial profile shows strong resilience indicators. Maintain your good habits and stay vigilant against digital fraud.
      </div>
    </div>
  )

  return (
    <div style={{ background: 'rgba(28,28,30,0.04)', border: '0.5px solid rgba(255,59,48,0.22)', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <AlertTriangle size={14} color="#cc2f26" />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#cc2f26', textTransform: 'uppercase', letterSpacing: '1px' }}>THREAT ASSESSMENT</span>
      </div>
      <p style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)', marginBottom: 10, lineHeight: 1.5 }}>
        Based on your financial profile, here's why scammers would target you specifically:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {threats.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: '#cc2f26', flexShrink: 0, fontWeight: 700, fontSize: 12 }}>›</span>
            <span style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)', lineHeight: 1.5 }}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 'var(--sz-caption)', color: 'var(--teal-dark)', background: 'var(--teal-soft)', borderRadius: 10, padding: '8px 12px' }}>
        Financial resilience is your best defence. Complete the Defence Roadmap to reduce your threat exposure.
      </div>
    </div>
  )
}

/* ─── Scam Shield (in Results) ───────────────────────────────── */

function ScamShieldTab({ dsr, risk, formData }) {
  const dsrPct    = dsr?.dsr_percentage || 0
  const riskScore = risk?.risk_score    || 0
  const vulnScore = Math.min(100, Math.round(dsrPct * 0.65 + riskScore * 0.35))
  const level     = vulnScore >= 65 ? 'HIGH' : vulnScore >= 35 ? 'MEDIUM' : 'LOW'
  const vColor    = vulnScore >= 65 ? '#cc2f26' : vulnScore >= 35 ? '#b86e00' : '#1a9930'
  const deg       = Math.round(vulnScore * 3.6)

  const SCAMS = {
    HIGH:   [{ name:'Macau Scam (JDAS)', desc:'Fake authorities demand urgent payments. High-debt victims are primary targets.' }, { name:'Ah Long', desc:'Unlicensed lenders with extreme rates — harassment and violence follow.' }, { name:'Skim Cepat Kaya', desc:'"Invest RM500, get RM5000 in 7 days." Targets financial desperation.' }, { name:'Phantom Job Scam', desc:'Work-from-home deposits disappear with your money.' }],
    MEDIUM: [{ name:'HYIP Investment Scams', desc:'High-yield schemes targeting those seeking passive income.' }, { name:'E-Commerce Review Jobs', desc:'Fake task apps collect deposits then stop paying.' }, { name:'Prize / Lottery Scams', desc:'"You won! Pay RM200 processing fee." Exploits hope when money is tight.' }],
    LOW:    [{ name:'Phishing', desc:'Fake Maybank2u, CIMB, Touch\'n Go SMS/emails.' }, { name:'Online Shopping Scams', desc:'Fake Shopee/Lazada listings taking payment without delivery.' }],
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Vulnerability score */}
      <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: vulnScore >= 65 ? 'linear-gradient(135deg,#cc2f26,#ff6b5b)' : vulnScore >= 35 ? 'linear-gradient(135deg,#b86e00,#ffb830)' : 'linear-gradient(135deg,#1a9930,#28c840)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <ShieldCheck size={32} color="rgba(255,255,255,0.90)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Track 5 · Secure Digital</div>
            <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 700, color: '#fff' }}>Scam Vulnerability Analysis</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `conic-gradient(rgba(255,255,255,0.9) 0deg ${deg}deg, rgba(255,255,255,0.25) ${deg}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{vulnScore}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>RISK</div>
              </div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', marginTop: 4 }}>{level} RISK</div>
          </div>
        </div>
        <div style={{ padding: '18px 24px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', marginBottom: 6 }}>
              <span>Vulnerability Score</span><span style={{ fontWeight: 700, color: vColor }}>{vulnScore}/100</span>
            </div>
            <div className="progress-track">
              <div style={{ height: '100%', borderRadius: 99, width: `${vulnScore}%`, background: vulnScore >= 65 ? 'linear-gradient(90deg,var(--red),#ff6b5b)' : vulnScore >= 35 ? 'linear-gradient(90deg,var(--orange),#ffb830)' : 'linear-gradient(90deg,var(--green),#5dd879)', transition: 'width 0.9s ease' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {(SCAMS[level] || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--surface-row)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: vColor, flexShrink: 0, marginTop: 6 }} />
                <div>
                  <div style={{ fontSize: 'var(--sz-footnote)', fontWeight: 600, color: 'var(--label)', marginBottom: 1 }}>{s.name}</div>
                  <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--teal-soft)', border: '0.5px solid var(--teal-border)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--teal-dark)' }}>
              Report: <strong>BNMTELELINK 1-300-88-5465</strong> · <strong>bnm.gov.my</strong> · PDRM: <strong>0-800-886-565</strong>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary — why this score */}
      <div className="glass" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#cc2f26,#ff6b5b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bot size={18} color="#fff" /></div>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Why You Have This Score</div>
            <p style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.7, margin: 0 }}>
              {vulnScore >= 65
                ? `Your DSR of ${dsrPct.toFixed(1)}% is above the safe threshold, meaning ${dsrPct.toFixed(1)}% of your income goes to debt repayment. Combined with a ${risk?.overall_risk || 'HIGH'} risk profile and risk score of ${riskScore}/100, you are in a financially stressed state — the primary condition scammers exploit. High-DSR individuals are 3× more likely to fall for Macau scams, Ah Long schemes, and quick-rich investment fraud because the desperation to improve finances overrides caution.`
                : vulnScore >= 35
                ? `Your DSR of ${dsrPct.toFixed(1)}% sits in the moderate range — you're managing debts but without much buffer. Your ${risk?.overall_risk || 'MEDIUM'} risk score of ${riskScore}/100 means you have some vulnerabilities. Scammers often target this middle group with "reasonable-sounding" investment offers (7–15% monthly returns) and installment-based fraud schemes that appear affordable on paper.`
                : `Your DSR of ${dsrPct.toFixed(1)}% is within safe limits, and your ${risk?.overall_risk || 'LOW'} risk profile (score ${riskScore}/100) indicates stable finances. While your financial desperation level is low, digital fraud such as phishing, fake e-commerce, and social engineering can target anyone regardless of financial status — staying vigilant is essential.`
              }
            </p>
          </div>
        </div>

        {/* Key risk factors driving the score */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {[
            { label: 'DSR Contribution', value: `${Math.round(dsrPct * 0.65)}pts`, sub: `${dsrPct.toFixed(1)}% DSR × 65% weight`, color: dsrPct >= 60 ? '#cc2f26' : dsrPct >= 40 ? '#b86e00' : '#1a9930' },
            { label: 'Risk Score Contribution', value: `${Math.round(riskScore * 0.35)}pts`, sub: `${riskScore}/100 risk × 35% weight`, color: riskScore >= 60 ? '#cc2f26' : riskScore >= 40 ? '#b86e00' : '#1a9930' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: 'var(--surface-row)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--label-3)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginTop: 3 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(204,47,38,0.06)', border: '0.5px solid rgba(204,47,38,0.18)', borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)', lineHeight: 1.5 }}>
            To check a suspicious offer or message, use the <strong>Scam Checker</strong> tool in the input section — paste any WhatsApp, SMS, or email offer for a 3-dimension forensic analysis.
          </div>
        </div>
      </div>

      {/* Scam Threat Map */}
      <ScamThreatMap dsr={dsr} risk={risk} formData={formData} />
    </div>
  )
}

/* ─── History Tab ────────────────────────────────────────────── */

function HistoryTab({ history, onViewHistory }) {
  if (!history.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ marginBottom: 14 }}><History size={48} color="var(--label-3)" strokeWidth={1.5} /></div>
      <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 600, color: 'var(--label)', marginBottom: 8 }}>No history yet</div>
      <div style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)' }}>Run your first analysis to start tracking your financial progress.</div>
    </div>
  )
  const statusColor = s => s === 'SAFE' ? '#1a9930' : s === 'WARNING' ? '#b86e00' : '#cc2f26'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <DSRTrend history={history} />
      <div>
        <div className="section-label" style={{ marginBottom: 12 }}>Past Analyses ({history.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((entry, i) => (
            <div key={entry.id} className="glass-sm" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: entry.dsr != null ? `conic-gradient(${statusColor(entry.status)} 0deg ${Math.min(entry.dsr, 100) * 3.6}deg, rgba(60,60,67,0.10) ${Math.min(entry.dsr, 100) * 3.6}deg)` : 'rgba(118,118,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: statusColor(entry.status) }}>{entry.dsr?.toFixed(0)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--sz-subhead)', fontWeight: 600, color: 'var(--label)' }}>{entry.label}</div>
                  <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>Income RM {(entry.income || 0).toLocaleString()} · DSR {entry.dsr?.toFixed(1)}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {i === 0 && <span className="pill pill-teal" style={{ fontSize: 10 }}>Latest</span>}
                <span className={`pill ${entry.status === 'SAFE' ? 'pill-safe' : entry.status === 'WARNING' ? 'pill-warning' : 'pill-danger'}`}>{entry.status}</span>
                <button className="btn-ghost" onClick={() => onViewHistory(entry)} style={{ padding: '6px 14px', fontSize: 'var(--sz-caption)' }}>View →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Fraud Vulnerability Tab (Agent 8) ─────────────────────── */

const RISK_LEVEL_STYLE = {
  HIGH:    { bg: 'rgba(255,59,48,0.07)',  border: 'rgba(255,59,48,0.22)',  color: '#cc2f26', pill: 'pill-danger'  },
  MEDIUM:  { bg: 'rgba(255,149,0,0.07)', border: 'rgba(255,149,0,0.22)', color: '#b86e00', pill: 'pill-warning' },
  LOW:     { bg: 'rgba(40,200,64,0.07)', border: 'rgba(40,200,64,0.22)', color: '#1a9930', pill: 'pill-safe'    },
}

function FraudVulnerabilityTab({ formData }) {
  const [loading,  setLoading]  = useState(false)
  const [data,     setData]     = useState(null)
  const [err,      setErr]      = useState('')

  const handleAnalyze = async () => {
    setLoading(true); setErr(''); setData(null)
    const totalIncome = Object.values(formData?.income || {}).reduce((a, b) => a + (Number(b) || 0), 0)
    const totalDebts  = Object.values(formData?.debts  || {}).reduce((a, b) => a + (Number(b) || 0), 0)
    const body = {
      totalMonthlyIncome: totalIncome,
      totalMonthlyDebts:  totalDebts,
      expenses:           formData?.expenses || {},
      currentSavings:     formData?.currentSavings || 0,
      age:                formData?.age || 25,
      lifeStage:          formData?.lifeStage || 'young_adult',
      riskAppetite:       formData?.riskAppetite || 'moderate',
    }
    let lastErr = null
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 3000))
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 90000)
        const res = await fetch('/api/fraud-profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
        clearTimeout(timer)
        if (res.status === 429) throw new Error('rate_limited')
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        setData(await res.json())
        setLoading(false)
        return
      } catch (e) {
        lastErr = e
        const raw = e.message || ''
        if (raw === 'rate_limited' || raw.includes('quota')) break
        if (!raw.includes('abort') && !raw.includes('500') && !raw.includes('503') && raw !== 'Failed to fetch') break
      }
    }
    const raw = lastErr?.message || ''
    setErr(raw === 'rate_limited' ? 'Too many requests — please wait a moment.' : raw.includes('quota') ? 'AI quota exceeded. Please try again later.' : 'Server is temporarily unavailable. Please try again in a moment.')
    setLoading(false)
  }

  const score    = data?.vulnerability_score || 0
  const level    = data?.overall_level || 'MEDIUM'
  const lvlStyle = RISK_LEVEL_STYLE[level] || RISK_LEVEL_STYLE.MEDIUM
  const deg      = Math.round(score * 3.6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header card */}
      <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#5856d6,#af52de)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Search size={32} color="rgba(255,255,255,0.90)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Track 5 · Secure Digital · Agent 8</div>
            <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 700, color: '#fff' }}>Financial Fraud Vulnerability Profiler</div>
            <div style={{ fontSize: 'var(--sz-caption)', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Identifies your personal fraud attack surface & money-mule risk</div>
          </div>
          {data && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `conic-gradient(rgba(255,255,255,0.9) 0deg ${deg}deg, rgba(255,255,255,0.25) ${deg}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.20)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>RISK</div>
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', marginTop: 4 }}>{level}</div>
            </div>
          )}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Threat Assessment Brief — shown immediately, no API call needed */}
          <ThreatAssessmentBrief formData={formData} />

          {!data && !loading && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ marginBottom: 14 }}><Search size={48} color="#5856d6" strokeWidth={1.5} /></div>
              <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 600, color: 'var(--label)', marginBottom: 8 }}>Know Your Fraud Attack Surface</div>
              <div style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', marginBottom: 20, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 20px' }}>
                Based on your financial profile, this agent identifies whether you're at risk of being recruited as a money mule, targeted by predatory lenders, or vulnerable to specific fraud entry points.
              </div>
              {err && <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.25)', borderRadius: 10, fontSize: 'var(--sz-footnote)', color: '#cc2f26' }}>Error: {err}</div>}
              <button className="btn-primary" onClick={handleAnalyze}
                style={{ background: 'linear-gradient(135deg,#5856d6,#af52de)', boxShadow: '0 4px 18px rgba(88,86,214,0.40)' }}>
                Analyze My Fraud Risk
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 16px', borderColor: 'rgba(88,86,214,0.25)', borderTopColor: '#5856d6', width: 36, height: 36 }} />
              <div style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)' }}>Profiling your fraud vulnerabilities…</div>
            </div>
          )}

          {data && (
            <div className="fade-in">
              {/* Overall level */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', marginBottom: 6 }}>
                <span>Vulnerability Score</span><span style={{ fontWeight: 700, color: lvlStyle.color }}>{score}/100 · {level}</span>
              </div>
              <div className="progress-track" style={{ marginBottom: 16 }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${score}%`, background: level === 'HIGH' ? 'linear-gradient(90deg,#cc2f26,#ff6b5b)' : level === 'MEDIUM' ? 'linear-gradient(90deg,#b86e00,#ffb830)' : 'linear-gradient(90deg,#1a9930,#5dd879)', transition: 'width 0.9s ease' }} />
              </div>

              {/* AI Summary */}
              {data.summary && (
                <div style={{ display: 'flex', gap: 12, background: 'rgba(88,86,214,0.07)', border: '0.5px solid rgba(88,86,214,0.20)', borderRadius: 14, padding: '14px 16px', marginBottom: 18, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#5856d6,#af52de)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bot size={16} color="#fff" /></div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#5856d6', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5 }}>AI Assessment</div>
                    <p style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.7, margin: 0 }}>{data.summary}</p>
                  </div>
                </div>
              )}

              {/* Money Mule + Predatory Loan cards */}
              <div data-grid="fraud-risks" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {[
                  { title: 'Money Mule Risk', level: data.money_mule_risk, explanation: data.money_mule_explanation },
                  { title: 'Predatory Loan Risk', level: data.predatory_loan_risk, explanation: data.predatory_loan_explanation },
                ].map(({ title, level: lv, explanation }) => {
                  const s = RISK_LEVEL_STYLE[lv] || RISK_LEVEL_STYLE.MEDIUM
                  return (
                    <div key={title} style={{ background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ fontSize: 'var(--sz-footnote)', fontWeight: 700, color: s.color, marginBottom: 6 }}>{title}</div>
                      <span className={`pill ${s.pill}`} style={{ fontSize: 10, marginBottom: 8, display: 'inline-block' }}>{lv || '—'}</span>
                      <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)', lineHeight: 1.5, marginTop: 6 }}>{explanation}</div>
                    </div>
                  )
                })}
              </div>

              {/* Fraud Entry Points */}
              {data.fraud_entry_points?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div className="section-label" style={{ color: '#cc2f26', marginBottom: 8 }}>Your Fraud Entry Points</div>
                  {data.fraud_entry_points.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '0.5px solid var(--sep)', alignItems: 'flex-start' }}>
                      <span style={{ color: '#cc2f26', flexShrink: 0, fontWeight: 700 }}>›</span>
                      <span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.5 }}>{toStr(pt)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Protective Actions */}
              {data.protective_actions?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div className="section-label" style={{ color: '#1a9930', marginBottom: 8 }}>Protective Actions</div>
                  {data.protective_actions.map((action, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '0.5px solid var(--sep)', alignItems: 'flex-start' }}>
                      <span style={{ color: '#1a9930', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label)', lineHeight: 1.5 }}>{toStr(action)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Digital Safety Tips */}
              {data.digital_safety_tips?.length > 0 && (
                <div style={{ background: 'rgba(88,86,214,0.06)', border: '0.5px solid rgba(88,86,214,0.18)', borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
                  <div className="section-label" style={{ color: '#5856d6', marginBottom: 8 }}>Digital Safety Tips</div>
                  {data.digital_safety_tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', alignItems: 'flex-start' }}>
                      <span style={{ color: '#5856d6', flexShrink: 0 }}>›</span>
                      <span style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', lineHeight: 1.5 }}>{toStr(tip)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: '10px 14px', background: 'rgba(88,86,214,0.06)', border: '0.5px solid rgba(88,86,214,0.18)', borderRadius: 10, fontSize: 'var(--sz-caption)', color: '#5856d6' }}>
                Report scams: <strong>CCID Scam Response Centre 997</strong> · <strong>BNM: 1-300-88-5465</strong> · <strong>NACSA: 1-300-88-0032</strong>
              </div>
              <button className="btn-ghost" onClick={() => setData(null)} style={{ marginTop: 12, fontSize: 'var(--sz-caption)' }}>↩ Re-analyze</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Left Sidebar Metric Cards ─────────────────────────────── */

function SidebarCard({ title, icon, children }) {
  return (
    <div className="glass" style={{ padding: '14px 16px', borderRadius: 22 }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          {icon && <span style={{ color: 'var(--label-3)' }}>{icon}</span>}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        </div>
      )}
      {children}
    </div>
  )
}

function ShieldSidebarCard({ shield, fhs }) {
  const score  = shield?.score ?? (fhs ? Math.round(fhs.total / 10) : null)
  const label  = shield?.level || fhs?.label || 'Calculating...'
  const color  = fhs?.color || (shield?.level === 'Excellent' || shield?.level === 'Good' ? '#1a9930' : shield?.level === 'Fair' ? '#b86e00' : '#cc2f26')
  if (score === null) return null
  const r = 28, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <SidebarCard title="Shield Score" icon={<ShieldCheck size={11} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(60,60,67,0.10)" strokeWidth="6" />
            <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--sz-subhead)', fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginTop: 1 }}>Financial Shield</div>
          {fhs && <div style={{ fontSize: 10, color: 'var(--label-3)', marginTop: 2 }}>Grade {fhs.grade} · {fhs.total}/1000</div>}
        </div>
      </div>
    </SidebarCard>
  )
}

function DSRSidebarCard({ dsr }) {
  if (!dsr) return null
  const pct    = dsr.dsr_percentage || 0
  const status = dsr.dsr_status || 'WARNING'
  const color  = status === 'SAFE' ? '#1a9930' : status === 'WARNING' ? '#b86e00' : '#cc2f26'
  const barBg  = status === 'SAFE' ? 'linear-gradient(90deg,#00c4aa,#28c840)' : status === 'WARNING' ? 'linear-gradient(90deg,#ff9500,#ffb830)' : 'linear-gradient(90deg,#ff3b30,#ff6b5b)'
  return (
    <SidebarCard title="Debt Ratio (DSR)" icon={<TrendingUp size={11} />}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--sz-title2)', fontWeight: 800, color, letterSpacing: '-0.3px' }}>{pct.toFixed(1)}%</span>
        <span className={`pill ${status === 'SAFE' ? 'pill-safe' : status === 'WARNING' ? 'pill-warning' : 'pill-danger'}`} style={{ fontSize: 9 }}>{status}</span>
      </div>
      <div style={{ position: 'relative', height: 8, borderRadius: 99, background: 'rgba(60,60,67,0.08)', marginBottom: 4 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(pct, 100)}%`, background: barBg, borderRadius: 99, transition: 'width 0.9s ease' }} />
        <div style={{ position: 'absolute', left: '60%', top: '-2px', height: 'calc(100% + 4px)', width: 2, background: 'rgba(204,47,38,0.50)', borderRadius: 1 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--label-3)' }}>
        <span>0%</span>
        <span style={{ color: 'rgba(204,47,38,0.7)' }}>BNM limit 60%</span>
        <span>100%</span>
      </div>
      {dsr.headroom_rm > 0 && <div style={{ marginTop: 6, fontSize: 'var(--sz-caption)', color: 'var(--teal-dark)', fontWeight: 600 }}>Headroom: RM {Number(dsr.headroom_rm).toLocaleString()}</div>}
    </SidebarCard>
  )
}

function RiskSidebarCard({ risk }) {
  if (!risk) return null
  const score = risk.risk_score || 0
  const level = (risk.overall_risk || 'MEDIUM').toUpperCase()
  const color = level === 'LOW' ? '#1a9930' : level === 'HIGH' ? '#cc2f26' : '#b86e00'
  const barBg = level === 'LOW' ? 'linear-gradient(90deg,#00c4aa,#28c840)' : level === 'HIGH' ? 'linear-gradient(90deg,#ff3b30,#ff6b5b)' : 'linear-gradient(90deg,#ff9500,#ffb830)'
  return (
    <SidebarCard title="Risk Profile" icon={<AlertTriangle size={11} />}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--sz-title2)', fontWeight: 800, color, letterSpacing: '-0.3px' }}>{score}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--label-3)' }}>/100</span></span>
        <span className={`pill ${level === 'LOW' ? 'pill-safe' : level === 'HIGH' ? 'pill-danger' : 'pill-warning'}`} style={{ fontSize: 9 }}>{level}</span>
      </div>
      <div className="progress-track" style={{ marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${score}%`, background: barBg, borderRadius: 99, transition: 'width 0.9s ease' }} />
      </div>
      {risk.savings_rate_percentage !== undefined && (
        <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)' }}>
          Savings rate: <strong style={{ color: risk.savings_rate_percentage >= 20 ? '#1a9930' : '#b86e00' }}>{Number(risk.savings_rate_percentage).toFixed(1)}%</strong>
          <span style={{ color: 'var(--label-3)' }}> / 20% target</span>
        </div>
      )}
    </SidebarCard>
  )
}

function TwinSidebarCard({ twin }) {
  if (!twin?.name) return null
  return (
    <SidebarCard title="Financial Twin" icon={<User size={11} />}>
      <div style={{ fontSize: 'var(--sz-subhead)', fontWeight: 700, color: 'var(--label)', marginBottom: 3 }}>{twin.name}</div>
      {twin.tagline && <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--teal-dark)', marginBottom: 6, fontStyle: 'italic' }}>"{twin.tagline}"</div>}
      {twin.description && <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)', lineHeight: 1.5 }}>{String(twin.description).slice(0, 90)}{String(twin.description).length > 90 ? '…' : ''}</div>}
    </SidebarCard>
  )
}

function QuickWinsSidebarCard({ quickWins }) {
  if (!quickWins?.length) return null
  return (
    <SidebarCard title="Quick Wins" icon={<Zap size={11} />}>
      {quickWins.slice(0, 3).map((win, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '0.5px solid var(--sep)' : 'none', alignItems: 'flex-start' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--teal-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 8, color: '#fff', fontWeight: 700, marginTop: 2 }}>{i + 1}</div>
          <span style={{ fontSize: 11, color: 'var(--label-2)', lineHeight: 1.45 }}>{toStr(win)}</span>
        </div>
      ))}
    </SidebarCard>
  )
}

/* ─── Main Results Component ─────────────────────────────────── */

export default function Results({ results, formData, history, onReset, onViewHistory }) {
  const { dsr, risk, purchase, investment, plan, shield } = results || {}
  const [activeTab, setActiveTab] = useState('overview')
  const [investLiked, setInvestLiked] = useState({})  // { [i]: 'like' | 'dislike' }

  const totalIncome   = Object.values(formData?.income   || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const totalDebts    = Object.values(formData?.debts    || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const totalExpenses = Object.values(formData?.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const totalSavings  = totalIncome - totalDebts - totalExpenses
  const fhs           = computeFHS(dsr, risk)

  const TABS = [
    { id: 'overview',      Icon: BarChart3,   label: 'Threat Brief' },
    { id: 'dsr_risk',      Icon: TrendingUp,  label: 'DSR & Risk' },
    { id: 'investments',   Icon: TrendingUp,  label: 'Wealth Defence' },
    { id: 'analytics',     Icon: BarChart3,   label: 'Analytics' },
    { id: 'tax_zakat',     Icon: CreditCard,  label: 'Tax & Zakat' },
    { id: 'roadmap',       Icon: Map,         label: 'Defence Roadmap' },
    { id: 'scam_shield',   Icon: ShieldCheck, label: 'Scam Risk' },
    { id: 'fraud_profile', Icon: Search,      label: 'Fraud Profile' },
    { id: 'history',       Icon: History,     label: `History (${history?.length || 0})` },
  ]

  return (
    <ErrorBoundary>
    <div>
      {/* ── TAB BAR ─────────────────────────────────── */}
      <div data-role="tab-bar" style={{ position: 'sticky', top: 'var(--navbar-h)', zIndex: 90, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(60,60,67,0.08)', padding: '0 var(--page-px)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 2, height: 48, alignItems: 'center', minWidth: 'max-content' }}>
          {TABS.map(tab => {
            const TabIcon = tab.Icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background:    activeTab === tab.id ? 'var(--teal-soft)' : 'transparent',
                border:        activeTab === tab.id ? '0.5px solid var(--teal-border)' : '0.5px solid transparent',
                borderRadius:  10, color: activeTab === tab.id ? 'var(--teal-dark)' : 'var(--label-2)',
                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 'var(--sz-footnote)',
                fontWeight: activeTab === tab.id ? 600 : 400, letterSpacing: '-0.08px',
                padding: '6px 12px', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
                <TabIcon size={12} />
                {tab.label}
              </button>
            )
          })}
          <div style={{ marginLeft: 'auto', paddingLeft: 12 }}>
            <button className="btn-ghost" onClick={onReset} style={{ fontSize: 'var(--sz-caption)', padding: '6px 14px' }}>New Analysis</button>
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 290px', gap: 20, maxWidth: 1680, margin: '0 auto', padding: '24px var(--page-px) 60px', alignItems: 'start' }}>

        {/* ── LEFT SIDEBAR: Metric Cards ── */}
        <div style={{ position: 'sticky', top: 'calc(var(--navbar-h) + 48px + 24px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ShieldSidebarCard shield={results?.shield} fhs={fhs} />
          <DSRSidebarCard dsr={dsr} />
          <RiskSidebarCard risk={risk} />
          {plan?.financial_twin && <TwinSidebarCard twin={plan.financial_twin} />}
          {plan?.quick_wins?.length > 0 && <QuickWinsSidebarCard quickWins={plan.quick_wins} />}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ minWidth: 0 }}>

        {/* ── OVERVIEW / THREAT BRIEF ───────────────── */}
        {activeTab === 'overview' && (
          <div className="fade-in">

            {/* ── THREAT POSTURE SUMMARY ── */}
            {(() => {
              const vulnScore  = Math.min(100, Math.round((dsr?.dsr_percentage || 0) * 0.65 + (risk?.risk_score || 0) * 0.35))
              const vulnLevel  = vulnScore >= 65 ? 'HIGH' : vulnScore >= 35 ? 'MEDIUM' : 'LOW'
              const vulnColor  = vulnScore >= 65 ? '#cc2f26' : vulnScore >= 35 ? '#b86e00' : '#1a9930'
              return (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>THREAT POSTURE SUMMARY</div>
                  <div data-grid="threat-posture" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                    {[
                      { label: 'Shield Score',       value: shield ? `${shield.score}/100` : '—', sub: shield?.level || 'Run analysis',  color: shield?.levelColor || 'var(--label-3)' },
                      { label: 'Scam Vulnerability', value: vulnLevel,                             sub: `${vulnScore}/100`,               color: vulnColor },
                      { label: 'Debt Exposure',      value: `${(dsr?.dsr_percentage || 0).toFixed(1)}%`, sub: 'vs 60% BNM limit',       color: dsr?.dsr_status === 'SAFE' ? '#1a9930' : dsr?.dsr_status === 'WARNING' ? '#b86e00' : '#cc2f26' },
                      { label: 'Liquidity Defence',  value: `${risk?.emergency_fund_months || 0}mo`, sub: 'Emergency fund',             color: (risk?.emergency_fund_months || 0) >= 3 ? '#1a9930' : '#cc2f26' },
                      { label: 'Wealth Building',    value: investment?.investment_readiness || 'N/A', sub: `RM ${investment?.investable_amount_monthly?.toLocaleString() || 0}/mo`, color: investment?.investment_readiness === 'READY' ? '#1a9930' : investment?.investment_readiness === 'PARTIALLY READY' ? '#b86e00' : '#cc2f26' },
                    ].map(({ label, value, sub, color }) => (
                      <div key={label} className="glass-sm" style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--sz-caption)', fontWeight: 700, color, marginBottom: 2, letterSpacing: '-0.2px', marginTop: 2 }}>{value}</div>
                        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--label-3)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 10, color: 'var(--label-3)' }}>{sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── SHIELD SCORE ── */}
            <ErrorBoundary>
              <ShieldScore shield={shield} />
            </ErrorBoundary>

            {plan?.financial_twin && <div style={{ marginBottom: 24 }}><FinancialTwin twin={plan.financial_twin} /></div>}

            {/* AI Narrative Summary */}
            <ErrorBoundary>
              <FinancialSnapshot dsr={dsr} risk={risk} investment={investment} plan={plan} />
            </ErrorBoundary>

            {/* Metric cards */}
            <div data-grid="overview-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'DSR', value: `${dsr?.dsr_percentage?.toFixed(1) || 0}%`, sub: dsr?.dsr_status, color: dsr?.dsr_status === 'SAFE' ? '#1a9930' : dsr?.dsr_status === 'WARNING' ? '#b86e00' : '#cc2f26' },
                { label: 'Risk Score', value: `${risk?.risk_score || 0}/100`, sub: risk?.overall_risk, color: risk?.overall_risk === 'LOW' ? '#1a9930' : risk?.overall_risk === 'MEDIUM' ? '#b86e00' : '#cc2f26' },
                { label: 'Savings Rate', value: `${risk?.savings_rate_percentage?.toFixed(1) || 0}%`, sub: 'Target: 20%', color: (risk?.savings_rate_percentage || 0) >= 20 ? '#1a9930' : '#b86e00' },
                { label: fhs ? 'Health Score' : 'To Invest', value: fhs ? `${fhs.grade} ${fhs.total}` : `RM ${investment?.investable_amount_monthly?.toLocaleString() || 0}`, sub: fhs ? fhs.label : investment?.investment_readiness, color: fhs ? fhs.color : 'var(--teal)' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="glass" style={{ padding: '16px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: label === 'Health Score' ? 'var(--sz-headline)' : 'var(--sz-title2)', fontWeight: 700, color, letterSpacing: '-0.30px', lineHeight: 1.1, marginBottom: 4, marginTop: 2 }}>{value}</div>
                  <div style={{ fontSize: 9, letterSpacing: '0.3px', textTransform: 'uppercase', color: 'var(--label-3)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>{sub}</div>
                </div>
              ))}
            </div>

            {totalIncome > 0 && (
              <div className="glass" style={{ padding: '18px 20px', marginBottom: 20 }}>
                <div className="section-label" style={{ marginBottom: 10 }}>Income Allocation</div>
                <AllocationBar income={totalIncome} debts={totalDebts} expenses={totalExpenses} savings={totalSavings} />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>
                  <span>Total: RM {totalIncome.toLocaleString()}/mo</span>
                  <span>Remaining: <strong style={{ color: totalSavings >= 0 ? '#1a9930' : '#cc2f26' }}>RM {totalSavings.toLocaleString()}</strong></span>
                </div>
              </div>
            )}

            {plan?.quick_wins?.length > 0 && (
              <div className="glass" style={{ padding: '18px 20px', marginBottom: 20 }}>
                <div className="section-label" style={{ marginBottom: 10 }}>Quick Wins — Take Action Today</div>
                {plan.quick_wins.slice(0, 4).map((win, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < 3 ? '0.5px solid var(--sep)' : 'none', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--teal)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label)' }}>{toStr(win)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Purchase verdict summary card (shown in Overview if purchase was run with full analysis) */}
            {purchase && (
              <div className="glass" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: purchase.verdict === 'BUY' ? 'rgba(26,153,48,0.12)' : purchase.verdict === 'AVOID' ? 'rgba(204,47,38,0.12)' : 'rgba(184,110,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckCircle2 size={22} color={purchase.verdict === 'BUY' ? '#1a9930' : purchase.verdict === 'AVOID' ? '#cc2f26' : '#b86e00'} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--label-3)', fontWeight: 600, marginBottom: 2 }}>Purchase Verdict (Agent 3)</div>
                  <div style={{ fontSize: 'var(--sz-headline)', fontWeight: 700, color: purchase.verdict === 'BUY' ? '#1a9930' : purchase.verdict === 'AVOID' ? '#cc2f26' : '#b86e00', marginBottom: 3 }}>{purchase.verdict}</div>
                  <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)', lineHeight: 1.5 }}>{purchase.reasoning?.slice(0, 120)}{purchase.reasoning?.length > 120 ? '…' : ''}</div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 'var(--sz-title2)', fontWeight: 700, color: 'var(--label)' }}>{purchase.affordability_score}/100</div>
                  <div style={{ fontSize: 9, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Affordability</div>
                </div>
              </div>
            )}

            <div data-grid="overview-nav" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { tab: 'dsr_risk',      Icon: TrendingUp,  label: 'DSR & Risk Details',         sub: `${dsr?.dsr_percentage?.toFixed(1) || 0}% DSR · ${dsr?.dsr_status}` },
                { tab: 'analytics',     Icon: BarChart3,   label: 'Analytics & Shield Score',   sub: fhs ? `Grade ${fhs.grade} — ${fhs.label}` : 'Financial deep-dive' },
                { tab: 'tax_zakat',     Icon: CreditCard,  label: 'Tax & Zakat',                sub: 'LHDN reliefs + Zakat calc (Agent 7)' },
                { tab: 'scam_shield',   Icon: ShieldCheck, label: 'Scam Risk Profile',          sub: 'Which scams target you most' },
                { tab: 'fraud_profile', Icon: Search,      label: 'Fraud Attack Surface',       sub: 'Your personal fraud profile (Agent 8)' },
              ].map(({ tab, Icon: NavIcon, label, sub }) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'var(--surface-row)', border: '0.5px solid var(--sep)', borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--font)', padding: '14px', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,196,170,0.06)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--surface-row)'}>
                  <div style={{ marginBottom: 6 }}><NavIcon size={18} color="var(--teal)" /></div>
                  <div style={{ fontSize: 'var(--sz-footnote)', fontWeight: 600, color: 'var(--label)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>{sub}</div>
                </button>
              ))}
            </div>

            {/* ── Certificate Download ── */}
            {(() => {
              const handleCert = () => {
                const today      = new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
                const shieldTxt  = shield ? `${shield.score}/100` : 'N/A'
                const shieldLvl  = shield?.levelColor || '#00c4aa'
                const vulnScore  = Math.min(100, Math.round((dsr?.dsr_percentage || 0) * 0.65 + (risk?.risk_score || 0) * 0.35))
                const vulnLevel  = vulnScore >= 65 ? 'HIGH' : vulnScore >= 35 ? 'MEDIUM' : 'LOW'
                const vulnColor  = vulnScore >= 65 ? '#ff3b30' : vulnScore >= 35 ? '#ff9500' : '#28c840'
                const twin       = plan?.financial_twin?.name || 'N/A'
                const twinEmoji  = ''
                const threatLvl  = risk?.overall_risk || 'N/A'
                const threatColor= threatLvl === 'HIGH' ? '#ff3b30' : threatLvl === 'MEDIUM' ? '#ff9500' : '#28c840'
                const w = window.open('', '_blank')
                w.document.write(`<!DOCTYPE html><html><head><title>DebtSense MY — Financial Shield Certificate</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0c10;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,-apple-system,sans-serif;padding:24px}.cert{background:linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03));border:1px solid rgba(0,196,170,0.35);border-radius:28px;padding:48px 44px;width:560px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.5)}.shield{font-size:68px;margin-bottom:12px}.brand{font-size:11px;font-weight:700;color:rgba(0,196,170,0.8);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:3px}.title{font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:6px}.subtitle{font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:28px}.divider{height:1px;background:linear-gradient(90deg,transparent,rgba(0,196,170,0.4),transparent);margin:24px 0}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0}.metric{background:rgba(255,255,255,0.06);border:0.5px solid rgba(255,255,255,0.12);border-radius:16px;padding:18px 14px}.mval{font-size:22px;font-weight:800;margin-bottom:5px}.mlabel{font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.8px}.footer{font-size:10px;color:rgba(255,255,255,0.25);line-height:1.7;margin-top:20px}@media print{body{background:#fff}.cert{background:#fff;border-color:#00c4aa;box-shadow:none}.brand,.title{color:#111}.mval{color:inherit!important}.mlabel,.footer,.subtitle{color:#666}.metric{background:#f5f5f5;border-color:#e0e0e0}}</style>
</head><body><div class="cert">
<div class="shield" style="font-size:48px;color:#00c4aa">DS</div>
<div class="brand">DebtSense MY</div>
<div class="title">Financial Shield Certificate</div>
<div class="subtitle">Track 5: Secure Digital · Project 2030 Hackathon</div>
<div class="divider"></div>
<div class="metrics">
<div class="metric"><div class="mval" style="color:${shieldLvl}">${shieldTxt}</div><div class="mlabel">Shield Score</div></div>
<div class="metric"><div class="mval" style="color:${vulnColor}">${vulnLevel}</div><div class="mlabel">Scam Vulnerability</div></div>
<div class="metric"><div class="mval" style="color:#fff">${twinEmoji} ${twin}</div><div class="mlabel">Financial Twin</div></div>
<div class="metric"><div class="mval" style="color:${threatColor}">${threatLvl}</div><div class="mlabel">Threat Level</div></div>
</div>
<div class="divider"></div>
<div class="footer">Analysed: ${today}<br>Powered by Gemini 2.5 Flash · GDG On Campus UTM</div>
</div></body></html>`)
                w.document.close(); w.focus(); setTimeout(() => w.print(), 500)
              }
              return (
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <button onClick={handleCert} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,rgba(88,86,214,0.12),rgba(0,122,255,0.12))', border: '0.5px solid rgba(88,86,214,0.30)', borderRadius: 14, padding: '11px 24px', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 'var(--sz-subhead)', fontWeight: 700, color: '#5856d6', transition: 'all 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(88,86,214,0.20),rgba(0,122,255,0.20))'}
                    onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(88,86,214,0.12),rgba(0,122,255,0.12))'}>
                    Download Shield Certificate
                  </button>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── DSR & RISK ────────────────────────────── */}
        {activeTab === 'dsr_risk' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {dsr && (
              <div className="glass" style={{ padding: '24px' }}>
                <AgentHeader n="1" label="Threat Surface Scanner" />
                <div data-grid="dsr-main" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 24, alignItems: 'start', marginBottom: 20 }}>
                  <DSRDonut percentage={dsr.dsr_percentage} status={dsr.dsr_status} />
                  <div>
                    {[
                      { label: 'Monthly Debt Total',  value: `RM ${dsr.monthly_debt_total?.toLocaleString()}`,  color: '#cc2f26' },
                      { label: 'Monthly Income',       value: `RM ${dsr.monthly_income_total?.toLocaleString()}`,  color: '#1a9930' },
                      { label: 'DSR Headroom',         value: `RM ${dsr.headroom_rm?.toLocaleString()} (${dsr.headroom_percentage?.toFixed(1)}%)`, color: 'var(--teal)' },
                      { label: 'Biggest Debt',         value: dsr.biggest_debt_category || 'None', color: 'var(--label)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--sep)' }}>
                        <span style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-2)' }}>{label}</span>
                        <span style={{ fontSize: 'var(--sz-footnote)', fontWeight: 700, color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-row)', borderRadius: 12, padding: '14px 16px', fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.6 }}>{dsr.analysis_summary}</div>
              </div>
            )}
            {formData?.expenses && (
              <div className="glass" style={{ padding: '20px 24px' }}>
                <div className="section-label" style={{ marginBottom: 14 }}>Monthly Expense Breakdown</div>
                <ExpenseBreakdown expenses={formData.expenses} />
              </div>
            )}
            {risk && (
              <div className="glass" style={{ padding: '24px' }}>
                <AgentHeader n="2" label="Vulnerability Scanner" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)' }}>Risk Score</span>
                  <span style={{ fontSize: 'var(--sz-subhead)', fontWeight: 700, color: risk.overall_risk === 'LOW' ? '#1a9930' : risk.overall_risk === 'MEDIUM' ? '#b86e00' : '#cc2f26' }}>{risk.risk_score}/100 — {risk.overall_risk}</span>
                </div>
                <div className="progress-track" style={{ marginBottom: 16 }}>
                  <div className={`progress-fill${risk.risk_score > 65 ? '-danger' : risk.risk_score > 40 ? '-warning' : ''}`} style={{ width: `${risk.risk_score}%` }} />
                </div>
                <div data-grid="risk-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: (risk.savings_rate_percentage || 0) >= 20 ? 'var(--green-soft)' : 'var(--orange-soft)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                    <div className="section-label" style={{ marginBottom: 4 }}>Savings Rate</div>
                    <div style={{ fontSize: 'var(--sz-title2)', fontWeight: 700, color: (risk.savings_rate_percentage || 0) >= 20 ? '#1a9930' : '#b86e00' }}>{risk.savings_rate_percentage?.toFixed(1)}%</div>
                    <div style={{ fontSize: 10, color: 'var(--label-3)' }}>Target: 20%</div>
                  </div>
                  <div style={{ background: (risk.emergency_fund_months || 0) >= 3 ? 'var(--green-soft)' : 'var(--red-soft)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                    <div className="section-label" style={{ marginBottom: 4 }}>Emergency Fund</div>
                    <div style={{ fontSize: 'var(--sz-title2)', fontWeight: 700, color: (risk.emergency_fund_months || 0) >= 3 ? '#1a9930' : '#cc2f26' }}>{risk.emergency_fund_months} mo</div>
                    <div style={{ fontSize: 10, color: 'var(--label-3)' }}>Target: 3–6 months</div>
                  </div>
                </div>
                {risk.risk_factors?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div className="section-label" style={{ color: '#cc2f26', marginBottom: 8 }}>Risk Factors</div>
                    {risk.risk_factors.map((f, i) => <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '0.5px solid var(--sep)' }}><span style={{ color: 'var(--red)', flexShrink: 0 }}>›</span><span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)' }}>{toStr(f)}</span></div>)}
                  </div>
                )}
                {risk.positive_factors?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div className="section-label" style={{ color: '#1a9930', marginBottom: 8 }}>Positive Factors</div>
                    {risk.positive_factors.map((f, i) => <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '0.5px solid var(--sep)' }}><span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span><span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)' }}>{toStr(f)}</span></div>)}
                  </div>
                )}
                <div style={{ background: 'var(--surface-row)', borderRadius: 12, padding: '14px 16px', fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.6 }}>{risk.risk_summary}</div>
              </div>
            )}
          </div>
        )}

        {/* ── INVESTMENTS ───────────────────────────── */}
        {activeTab === 'investments' && investment && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass" style={{ padding: '20px 24px' }}>
              <AgentHeader n="4" label="Wealth Defence Planner" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--teal-soft)', border: '0.5px solid var(--teal-border)', borderRadius: 14, marginBottom: 18 }}>
                <div>
                  <div className="section-label" style={{ marginBottom: 2 }}>Your Monthly Investment Budget</div>
                  <div style={{ fontSize: 'var(--sz-title1)', fontWeight: 700, color: 'var(--teal)', letterSpacing: '-0.50px' }}>RM {investment.investable_amount_monthly?.toLocaleString()}</div>
                </div>
                <span className={`pill ${investment.investment_readiness?.toUpperCase() === 'READY' ? 'pill-safe' : investment.investment_readiness?.toUpperCase() === 'PARTIALLY READY' ? 'pill-warning' : 'pill-danger'}`}>
                  {investment.investment_readiness}
                </span>
              </div>
              <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginBottom: 14 }}>
                Tap "Interested" on a recommendation to see a personalized getting-started guide.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {investment.recommendations?.map((rec, i) => (
                  <InvestmentCard
                    key={i}
                    rec={rec}
                    idx={i}
                    liked={investLiked[i]}
                    onLike={() => setInvestLiked(prev => ({ ...prev, [i]: prev[i] === 'like' ? null : 'like' }))}
                    onDislike={() => setInvestLiked(prev => ({ ...prev, [i]: prev[i] === 'dislike' ? null : 'dislike' }))}
                  />
                ))}
              </div>
              {investment.projected_1year_rm > 0 && (
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--green-soft)', borderRadius: 12 }}>
                  <span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)' }}>Projected 12-month portfolio growth</span>
                  <span style={{ fontSize: 'var(--sz-headline)', fontWeight: 700, color: '#1a9930' }}>+RM {investment.projected_1year_rm?.toLocaleString()}</span>
                </div>
              )}
              {investment.investment_summary && (
                <div style={{ marginTop: 14, background: 'var(--surface-row)', borderRadius: 12, padding: '14px 16px', fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.6 }}>{investment.investment_summary}</div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ─────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="fade-in">
            <AnalyticsTab dsr={dsr} risk={risk} formData={formData} />
          </div>
        )}

        {/* ── TAX & ZAKAT ───────────────────────────── */}
        {activeTab === 'tax_zakat' && (
          <div className="fade-in">
            <TaxZakatTab formData={formData} />
          </div>
        )}

        {/* ── ROADMAP ───────────────────────────────── */}
        {activeTab === 'roadmap' && plan && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass" style={{ padding: '20px 24px' }}>
              <AgentHeader n="5" label="3-Month Defence Roadmap" />
              {[
                { key: 'month_1', label: 'Month 1', gradient: 'linear-gradient(135deg,#ff9500,#ffb830)' },
                { key: 'month_2', label: 'Month 2', gradient: 'linear-gradient(135deg,#007aff,#5ac8fa)' },
                { key: 'month_3', label: 'Month 3', gradient: 'linear-gradient(135deg,#28c840,#5dd879)' },
              ].map(({ key, label, gradient }) => plan[key] && (
                <div key={key} style={{ borderRadius: 14, overflow: 'hidden', border: '0.5px solid rgba(60,60,67,0.08)', marginBottom: 12 }}>
                  <div style={{ background: gradient, padding: '10px 18px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--sz-subhead)', color: '#fff' }}>{label}</span>
                    <span style={{ fontSize: 'var(--sz-footnote)', color: 'rgba(255,255,255,0.85)' }}>{plan[key].theme}</span>
                  </div>
                  <div style={{ background: 'var(--surface-row)', padding: '14px 18px' }}>
                    {plan[key].actions?.map((action, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                        <div className="agent-badge" style={{ width: 20, height: 20, fontSize: 9, flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', lineHeight: 1.5 }}>{toStr(action)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(plan.projected_dsr_month3 > 0 || plan.projected_savings_month3 > 0) && (
                <div data-grid="roadmap-proj" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {plan.projected_dsr_month3 > 0 && <div style={{ background: 'var(--green-soft)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}><div className="section-label" style={{ marginBottom: 4 }}>Projected DSR Month 3</div><div style={{ fontSize: 'var(--sz-title2)', fontWeight: 700, color: '#1a9930' }}>{plan.projected_dsr_month3?.toFixed(1)}%</div></div>}
                  {plan.projected_savings_month3 > 0 && <div style={{ background: 'var(--teal-soft)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}><div className="section-label" style={{ marginBottom: 4 }}>Target Savings Month 3</div><div style={{ fontSize: 'var(--sz-title2)', fontWeight: 700, color: 'var(--teal)' }}>RM {plan.projected_savings_month3?.toLocaleString()}/mo</div></div>}
                </div>
              )}
            </div>
            {plan.quick_wins?.length > 0 && (
              <div className="glass" style={{ padding: '18px 20px' }}>
                <div className="section-label" style={{ marginBottom: 10 }}>Quick Wins</div>
                {plan.quick_wins.map((win, i) => <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < plan.quick_wins.length - 1 ? '0.5px solid var(--sep)' : 'none' }}><span style={{ color: 'var(--teal)', fontWeight: 700, flexShrink: 0 }}>✓</span><span style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label)' }}>{toStr(win)}</span></div>)}
              </div>
            )}
            {plan.malaysian_resources?.length > 0 && (
              <div className="glass" style={{ padding: '18px 20px' }}>
                <div className="section-label" style={{ marginBottom: 10 }}>Malaysian Resources</div>
                {plan.malaysian_resources.map((r, i) => <div key={i} style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', padding: '5px 0', borderBottom: i < plan.malaysian_resources.length - 1 ? '0.5px solid var(--sep)' : 'none' }}>› {toStr(r)}</div>)}
              </div>
            )}
            {plan.overall_message && (
              <div style={{ background: 'var(--teal-soft)', border: '0.5px solid var(--teal-border)', borderRadius: 16, padding: '18px 20px', fontSize: 'var(--sz-subhead)', color: 'var(--label)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "{plan.overall_message}"
              </div>
            )}
          </div>
        )}

        {/* ── SCAM SHIELD ───────────────────────────── */}
        {activeTab === 'scam_shield' && (
          <div className="fade-in">
            <ScamShieldTab dsr={dsr} risk={risk} formData={formData} />
          </div>
        )}

        {/* ── FRAUD PROFILE ─────────────────────────── */}
        {activeTab === 'fraud_profile' && (
          <div className="fade-in">
            <FraudVulnerabilityTab formData={formData} />
          </div>
        )}

        {/* ── HISTORY ───────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="fade-in">
            <HistoryTab history={history || []} onViewHistory={onViewHistory} />
          </div>
        )}
        </div>{/* end main content */}

        {/* ── RIGHT SIDEBAR: AI Assistant ── */}
        <ErrorBoundary>
          <AIAssistant results={results} formData={formData} />
        </ErrorBoundary>

      </div>{/* end 3-column grid */}
    </div>
    </ErrorBoundary>
  )
}
