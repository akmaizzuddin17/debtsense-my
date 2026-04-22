import { useState, useEffect } from 'react'

const LIFE_STAGES = ['Student', 'Fresh Graduate', 'Working Adult', 'Married (No Kids)', 'Married (With Kids)', 'Pre-Retirement']
const RISK_LEVELS = ['Conservative', 'Moderate', 'Aggressive']

const DEFAULT_INCOME   = { salary: '', freelance: '', rental: '', investment: '', other: '' }
const DEFAULT_DEBTS    = { car_loan: '', housing_loan: '', ptptn: '', credit_card_min: '', personal_loan: '', other_loan: '' }
const DEFAULT_EXPENSES = { food: '', transport: '', utilities: '', entertainment: '', subscriptions: '', medical: '', parents: '', other: '' }

const FORM_KEY = 'debtsense_form_v1'
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(FORM_KEY) || '{}') } catch { return {} }
}

// Must live outside component — otherwise React remounts on every keystroke, killing focus
function InputRow({ label, sublabel, field, state, setter }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--sep)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label)', letterSpacing: '-0.24px' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginTop: 1 }}>{sublabel}</div>}
      </div>
      <div style={{ position: 'relative', width: 140, flexShrink: 0 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-3)', fontSize: 'var(--sz-footnote)', fontWeight: 500, pointerEvents: 'none' }}>RM</span>
        <input
          type="number"
          placeholder="0"
          value={state[field]}
          onChange={e => setter(prev => ({ ...prev, [field]: e.target.value }))}
          style={{ paddingLeft: 38, textAlign: 'right', paddingRight: 12 }}
        />
      </div>
    </div>
  )
}

// Single-state input row for non-object state values
function SingleRow({ label, sublabel, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--sep)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label)', letterSpacing: '-0.24px' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', marginTop: 1 }}>{sublabel}</div>}
      </div>
      <div style={{ position: 'relative', width: 140, flexShrink: 0 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-3)', fontSize: 'var(--sz-footnote)', fontWeight: 500, pointerEvents: 'none' }}>RM</span>
        <input
          type="number"
          placeholder="0"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ paddingLeft: 38, textAlign: 'right', paddingRight: 12 }}
        />
      </div>
    </div>
  )
}

// Standalone scam checker — outside InputForm so it never remounts on parent re-render
function ScamCheckerSection() {
  const [offer,     setOffer]     = useState('')
  const [checking,  setChecking]  = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')

  const handleCheck = async () => {
    if (!offer.trim()) return
    setChecking(true); setResult(null); setError('')
    try {
      const res = await fetch('/api/scam-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerText: offer }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setResult(await res.json())
    } catch (e) { setError(e.message) }
    finally { setChecking(false) }
  }

  const verdictColor  = result?.verdict === 'LIKELY_SCAM' ? '#cc2f26' : result?.verdict === 'SUSPICIOUS' ? '#b86e00' : '#1a9930'
  const verdictBg     = result?.verdict === 'LIKELY_SCAM' ? 'rgba(255,59,48,0.07)' : result?.verdict === 'SUSPICIOUS' ? 'rgba(255,149,0,0.07)' : 'rgba(40,200,64,0.07)'
  const verdictBorder = result?.verdict === 'LIKELY_SCAM' ? 'rgba(255,59,48,0.20)' : result?.verdict === 'SUSPICIOUS' ? 'rgba(255,149,0,0.20)' : 'rgba(40,200,64,0.20)'

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.20)', borderRadius: 99, padding: '4px 12px', fontSize: 'var(--sz-caption)', fontWeight: 600, color: '#cc2f26', marginBottom: 10 }}>
          Agent 6 · Track 5 Secure Digital
        </div>
        <div className="t-title2" style={{ marginBottom: 4 }}>Scam Offer Checker</div>
        <p style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)' }}>
          Got a suspicious loan offer, investment scheme, or WhatsApp message? Paste it here — our AI checks it against known Malaysian scam patterns instantly. No full analysis needed.
        </p>
      </div>

      <div className="glass" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <label style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', display: 'block', marginBottom: 10 }}>Paste the suspicious offer or message</label>
        <textarea
          value={offer}
          onChange={e => setOffer(e.target.value)}
          placeholder={'Examples:\n• "Invest RM500, get RM3000 in 7 days guaranteed!"\n• "Work from home, earn RM200/day, deposit RM100 first"\n• "You have won RM50,000! Pay RM150 processing fee to claim"\n• A loan offer with very high interest rate'}
          rows={6}
          style={{
            fontFamily: 'var(--font)', fontSize: 'var(--sz-subhead)', letterSpacing: '-0.24px',
            color: 'var(--label)', background: 'var(--surface-input)', border: 'none',
            borderRadius: 14, padding: '14px 16px', width: '100%', outline: 'none',
            resize: 'vertical', lineHeight: 1.6, display: 'block', boxSizing: 'border-box',
            transition: 'background 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.background = 'rgba(118,118,128,0.17)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,196,170,0.22)' }}
          onBlur={e => { e.target.style.background = 'var(--surface-input)'; e.target.style.boxShadow = 'none' }}
        />
        <div style={{ marginTop: 12 }}>
          <button
            className="btn-primary"
            onClick={handleCheck}
            disabled={!offer.trim() || checking}
            style={{ background: 'linear-gradient(135deg,#cc2f26,#ff6b5b)', boxShadow: '0 4px 18px rgba(204,47,38,0.35)' }}
          >
            {checking
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Analyzing with AI...
                </span>
              : 'Check This Offer'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,59,48,0.08)', border: '0.5px solid rgba(255,59,48,0.25)', borderRadius: 12, fontSize: 'var(--sz-footnote)', color: '#cc2f26', marginBottom: 16 }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div className="fade-in" style={{ background: verdictBg, border: `0.5px solid ${verdictBorder}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${verdictBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>AI Verdict</div>
              <div style={{ fontSize: 'var(--sz-title2)', fontWeight: 700, color: verdictColor }}>
                {result.verdict === 'LIKELY_SCAM' ? 'LIKELY SCAM' : result.verdict === 'SUSPICIOUS' ? 'SUSPICIOUS' : 'LOOKS LEGITIMATE'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--sz-title1)', fontWeight: 700, color: verdictColor }}>{result.confidence}%</div>
              <div style={{ fontSize: 10, color: 'var(--label-3)' }}>confidence</div>
            </div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {result.similar_known_scam && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(255,59,48,0.06)', borderRadius: 10 }}>
                <span style={{ fontSize: 'var(--sz-caption)', fontWeight: 600, color: '#cc2f26' }}>Similar to: </span>
                <span style={{ fontSize: 'var(--sz-footnote)', fontWeight: 700, color: 'var(--label)' }}>{result.similar_known_scam}</span>
              </div>
            )}
            {/* 3-Dimension Forensic Breakdown */}
            {result.analysis_dimensions?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {result.analysis_dimensions.map((d, i) => {
                  const c = d.risk === 'HIGH' ? '#cc2f26' : d.risk === 'MEDIUM' ? '#b86e00' : '#1a9930'
                  return (
                    <div key={i} style={{ background: `${c}0d`, border: `0.5px solid ${c}33`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{d.dimension}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, background: `${c}20`, color: c, borderRadius: 3, padding: '1px 5px' }}>{d.risk}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--label-2)', lineHeight: 1.45 }}>{d.explanation}</p>
                      {d.markers_found?.length > 0 && d.markers_found.map((m, j) => (
                        <div key={j} style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'flex-start' }}>
                          <span style={{ color: c, fontSize: 9, flexShrink: 0, marginTop: 2 }}>▸</span>
                          <span style={{ fontSize: 9, color: 'var(--label-3)', lineHeight: 1.4 }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
            {result.red_flags?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div className="section-label" style={{ color: '#cc2f26', marginBottom: 6 }}>Red Flags</div>
                {result.red_flags.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '0.5px solid var(--sep)' }}>
                    <span style={{ color: '#cc2f26', flexShrink: 0 }}>›</span>
                    <span style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-2)' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {result.legitimate_indicators?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div className="section-label" style={{ color: '#1a9930', marginBottom: 6 }}>Legitimate Signs</div>
                {result.legitimate_indicators.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0' }}>
                    <span style={{ color: '#1a9930', flexShrink: 0 }}>›</span>
                    <span style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-2)' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: 'var(--surface-row)', borderRadius: 10, padding: '12px 14px', marginBottom: 10, fontSize: 'var(--sz-footnote)', color: 'var(--label)', lineHeight: 1.6, fontWeight: 500 }}>{result.recommended_action}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--teal-soft)', border: '0.5px solid var(--teal-border)', borderRadius: 10, padding: '9px 12px', fontSize: 'var(--sz-caption)', color: 'var(--teal-dark)' }}>
              {result.report_to}
            </div>
          </div>
          <button className="btn-ghost" onClick={() => { setResult(null); setOffer('') }} style={{ margin: '0 20px 16px', justifyContent: 'center' }}>
            Check Another Offer
          </button>
        </div>
      )}

      <div style={{ padding: '16px 18px', background: 'var(--surface-row)', borderRadius: 14 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Common Malaysian Scams to Watch</div>
        {[
          { name: 'Macau Scam (JDAS)', desc: 'Impersonates BNM, LHDN, police. Demands urgent payments.' },
          { name: 'Skim Cepat Kaya', desc: 'Returns > 10%/month are illegal and impossible.' },
          { name: 'E-Commerce Review Jobs', desc: 'Fake tasks requiring deposit — disappears after.' },
          { name: 'Ah Long / Illegal Lenders', desc: 'No license, extreme rates, harassment and violence.' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '0.5px solid var(--sep)' : 'none' }}>
            <div>
              <div style={{ fontSize: 'var(--sz-footnote)', fontWeight: 600, color: 'var(--label)' }}>{s.name}</div>
              <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)' }}>{s.desc}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12, fontSize: 'var(--sz-caption)', color: 'var(--teal-dark)', background: 'var(--teal-soft)', borderRadius: 10, padding: '8px 12px' }}>
          Report scams: <strong>BNMTELELINK 1-300-88-5465</strong> · PDRM Cyber: <strong>0-800-886-565</strong>
        </div>
      </div>
    </div>
  )
}

const SECTIONS = [
  { id: 'finances',   label: 'My Finances' },
  { id: 'purchase',   label: 'Buy Advice' },
  { id: 'scam_check', label: 'Scam Checker' },
]

export default function InputForm({ onAnalyze }) {
  const _s = loadSaved()
  const [income,                 setIncome]                 = useState({ ...DEFAULT_INCOME,   ..._s.income })
  const [debts,                  setDebts]                  = useState({ ...DEFAULT_DEBTS,    ..._s.debts })
  const [expenses,               setExpenses]               = useState({ ...DEFAULT_EXPENSES, ..._s.expenses })
  const [currentSavings,         setCurrentSavings]         = useState(_s.currentSavings         || '')
  const [monthlySavingsTarget,   setMonthlySavingsTarget]   = useState(_s.monthlySavingsTarget   || '')
  const [monthlyInvestmentBudget,setMonthlyInvestmentBudget]= useState(_s.monthlyInvestmentBudget|| '')
  const [age,                    setAge]                    = useState(_s.age                    || '')
  const [lifeStage,              setLifeStage]              = useState(_s.lifeStage              || 'Working Adult')
  const [riskAppetite,           setRiskAppetite]           = useState(_s.riskAppetite           || 'Moderate')
  const [purchaseItem,           setPurchaseItem]           = useState(_s.purchaseItem           || '')
  const [purchaseCost,           setPurchaseCost]           = useState(_s.purchaseCost           || '')
  const [purchaseMethod,         setPurchaseMethod]         = useState(_s.purchaseMethod         || 'cash')
  const [loading,                setLoading]                = useState(false)
  const [loadingMsg,             setLoadingMsg]             = useState('')
  const [activeSection,          setActiveSection]          = useState('finances')
  const [completedAgents,        setCompletedAgents]        = useState([])
  const [lastSaved,              setLastSaved]              = useState(null)
  const [quickPurchaseResult,    setQuickPurchaseResult]    = useState(null)
  const [quickPurchaseLoading,   setQuickPurchaseLoading]   = useState(false)

  // Auto-save to localStorage (debounced 600ms)
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(FORM_KEY, JSON.stringify({
        income, debts, expenses, currentSavings, monthlySavingsTarget,
        monthlyInvestmentBudget, age, lifeStage, riskAppetite, purchaseItem, purchaseCost, purchaseMethod,
      }))
      setLastSaved(new Date())
    }, 600)
    return () => clearTimeout(t)
  }, [income, debts, expenses, currentSavings, monthlySavingsTarget, monthlyInvestmentBudget, age, lifeStage, riskAppetite, purchaseItem, purchaseCost, purchaseMethod])

  const totalIncome   = Object.values(income).reduce((a, b) => a + (Number(b) || 0), 0)
  const totalDebts    = Object.values(debts).reduce((a, b) => a + (Number(b) || 0), 0)
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + (Number(b) || 0), 0)
  const remaining     = totalIncome - totalDebts - totalExpenses
  const dsrPreview    = totalIncome > 0 ? ((totalDebts / totalIncome) * 100).toFixed(1) : '—'

  const stageToAgent = { dsr: 0, risk: 1, purchase: 2, investment: 3, plan: 4 }

  const loadDemoData = () => {
    setIncome({ salary: '4200', freelance: '600', rental: '', investment: '120', other: '' })
    setDebts({ car_loan: '650', housing_loan: '', ptptn: '150', credit_card_min: '80', personal_loan: '', other_loan: '' })
    setExpenses({ food: '800', transport: '350', utilities: '180', entertainment: '220', subscriptions: '55', medical: '100', parents: '300', other: '120' })
    setCurrentSavings('3500')
    setMonthlySavingsTarget('500')
    setMonthlyInvestmentBudget('300')
    setAge('27')
    setLifeStage('Working Adult')
    setRiskAppetite('Moderate')
    setPurchaseItem('iPhone 16 Pro')
    setPurchaseCost('5499')
    setPurchaseMethod('installment')
    setActiveSection('income')
  }

  const checkPurchase = async () => {
    if (!purchaseItem) { alert('Please enter what you want to buy!'); return }
    if (totalIncome === 0) { alert('Please enter your income in My Finances first!'); return }
    setQuickPurchaseLoading(true)
    setQuickPurchaseResult(null)
    try {
      const profile = { income, debts, expenses, currentSavings: Number(currentSavings) || 0, age: Number(age) || 25, lifeStage, riskAppetite }
      const purchasePayload = { item: purchaseItem, estimatedCost: Number(purchaseCost) || 0, paymentMethod: purchaseMethod }
      const res = await fetch('/api/quick-purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile, purchaseItem: purchasePayload }) })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setQuickPurchaseResult(data)
    } catch (e) {
      alert('Purchase check failed: ' + e.message)
    } finally {
      setQuickPurchaseLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (totalIncome === 0) { alert('Please enter at least your monthly income!'); return }
    setLoading(true)
    setCompletedAgents([])

    const profile = {
      income, debts, expenses,
      age: Number(age) || 25, lifeStage, riskAppetite,
      currentSavings:          Number(currentSavings)         || 0,
      monthlySavingsTarget:    Number(monthlySavingsTarget)   || 0,
      monthlyInvestmentBudget: Number(monthlyInvestmentBudget)|| 0,
    }
    const purchase = purchaseItem
      ? { item: purchaseItem, estimatedCost: Number(purchaseCost) || 0, paymentMethod: purchaseMethod }
      : null

    const collectedResults = {}
    try {
      const response = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ profile, purchaseItem: purchase }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || `Server error: ${response.status}`)
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let parsed
          try { parsed = JSON.parse(line.slice(6)) } catch { continue }
          if (parsed.stage === 'status') setLoadingMsg(parsed.data.message)
          else if (parsed.stage === 'error') throw new Error(parsed.data.message)
          else {
            collectedResults[parsed.stage] = parsed.data
            const idx = stageToAgent[parsed.stage]
            if (idx !== undefined) setCompletedAgents(prev => [...prev, idx])
          }
        }
      }

      if (!collectedResults.dsr && !collectedResults.risk) throw new Error('Analysis failed to start — check your backend is running.')
      onAnalyze({ income, debts, expenses, currentSavings, monthlySavingsTarget, monthlyInvestmentBudget, age, lifeStage, riskAppetite, purchaseItem: purchase }, collectedResults)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--navbar-h))' }}>

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <aside data-role="form-sidebar" style={{
        width:          'var(--sidebar-w)',
        flexShrink:     0,
        position:       'sticky',
        top:            'var(--navbar-h)',
        height:         'calc(100vh - var(--navbar-h))',
        overflowY:      'auto',
        borderRight:    '0.5px solid var(--sep)',
        background:     'rgba(255,255,255,0.48)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding:        '28px 24px',
        display:        'flex',
        flexDirection:  'column',
        gap:            18,
      }}>

        {/* Hero */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--teal-soft)', border: '0.5px solid var(--teal-border)', borderRadius: 99, padding: '4px 12px', fontSize: 'var(--sz-caption)', fontWeight: 600, color: 'var(--teal-dark)', letterSpacing: '0.3px', marginBottom: 10 }}>
            5 AI Agents · Gemini 2.5 Flash
          </div>
          <h1 style={{ fontSize: 'var(--sz-title1)', fontWeight: 700, letterSpacing: '-0.50px', lineHeight: 1.22, color: 'var(--label)', marginBottom: 6 }}>
            Know Your<br /><span style={{ color: 'var(--teal)' }}>Financial Truth.</span>
          </h1>
          <p style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', lineHeight: 1.5 }}>Malaysia's AI financial threat intelligence. Scan your debt risk, build your defence portfolio & generate a 3-month hardening plan.</p>
        </div>

        {/* Live Summary */}
        <div className="glass-sm" style={{ padding: '14px 16px' }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Live Summary</div>
          {[
            { label: 'Monthly Income',  value: totalIncome,   color: '#1a9930' },
            { label: 'Debt Payments',   value: totalDebts,    color: '#cc2f26' },
            { label: 'Living Expenses', value: totalExpenses, color: '#b86e00' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '0.5px solid var(--sep)' }}>
              <span style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)' }}>{label}</span>
              <span style={{ fontSize: 'var(--sz-footnote)', fontWeight: 600, color }}>RM {value.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0 2px' }}>
            <span style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)' }}>Remaining</span>
            <span style={{ fontSize: 'var(--sz-subhead)', fontWeight: 700, color: remaining >= 0 ? '#1a9930' : '#cc2f26' }}>RM {remaining.toLocaleString()}</span>
          </div>
          {totalIncome > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--sz-caption)', marginBottom: 4 }}>
                <span style={{ color: 'var(--label-3)' }}>DSR Preview</span>
                <span style={{ fontWeight: 700, color: parseFloat(dsrPreview) > 60 ? '#cc2f26' : parseFloat(dsrPreview) > 40 ? '#b86e00' : '#1a9930' }}>{dsrPreview}%</span>
              </div>
              <div className="progress-track">
                <div className={`progress-fill${parseFloat(dsrPreview) > 60 ? '-danger' : parseFloat(dsrPreview) > 40 ? '-warning' : ''}`} style={{ width: `${Math.min(parseFloat(dsrPreview) || 0, 100)}%` }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--label-3)', marginTop: 3 }}>BNM limit: 60%</div>
            </div>
          )}
        </div>

        {/* Section Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Sections</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background:    activeSection === s.id ? 'var(--teal-soft)' : 'transparent',
              border:        activeSection === s.id ? '0.5px solid var(--teal-border)' : '0.5px solid transparent',
              borderRadius:  12,
              color:         activeSection === s.id ? 'var(--teal-dark)' : 'var(--label-2)',
              cursor:        'pointer',
              fontFamily:    'var(--font)',
              fontSize:      'var(--sz-subhead)',
              fontWeight:    activeSection === s.id ? 600 : 400,
              letterSpacing: '-0.24px',
              padding:       '9px 12px',
              textAlign:     'left',
              transition:    'all 0.15s',
              width:         '100%',
            }}>
              {s.label}
              {s.id === 'savings' && (Number(currentSavings) > 0 || Number(monthlySavingsTarget) > 0) && (
                <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: 99, padding: '1px 7px' }}>✓</span>
              )}
              {s.id === 'purchase' && purchaseItem && (
                <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--teal-soft)', color: 'var(--teal)', borderRadius: 99, padding: '1px 7px' }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Analyze / Loading */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          {loading ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <div className="spinner" />
                <span style={{ fontSize: 'var(--sz-caption)', color: 'var(--teal)', fontWeight: 600 }}>{loadingMsg || 'Starting agents...'}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((n, i) => (
                  <div key={i} className="agent-badge" style={{
                    background: completedAgents.includes(i) ? 'var(--teal-gradient)' : 'rgba(118,118,128,0.15)',
                    color:      completedAgents.includes(i) ? '#fff' : 'var(--label-3)',
                    transition: 'all 0.3s',
                  }}>{completedAgents.includes(i) ? '✓' : n}</div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <button className="btn-primary" onClick={handleAnalyze} disabled={totalIncome === 0}>
                {totalIncome === 0 ? 'Enter income to continue' : 'Run Security Scan'}
              </button>
              {lastSaved && (
                <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--label-3)', marginBottom: 2 }}>
                  ✓ Auto-saved {lastSaved.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <button onClick={loadDemoData} style={{
                marginTop: 8, width: '100%', background: 'transparent', border: '0.5px solid var(--sep)',
                borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 'var(--sz-caption)',
                color: 'var(--label-3)', padding: '8px', transition: 'all 0.15s',
              }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--surface-row)'; e.currentTarget.style.color = 'var(--label-2)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--label-3)' }}
              >
                Try Demo Data
              </button>
              <p style={{ fontSize: 10, color: 'var(--label-3)', textAlign: 'center', marginTop: 6 }}>
                Data stays in your browser. Nothing stored.
              </p>
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '36px var(--page-px) 60px' }}>

        {/* ── COMBINED FINANCES ───────────────────────── */}
        {activeSection === 'finances' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <div className="t-title2" style={{ marginBottom: 4 }}>My Financial Profile</div>
              <p style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)' }}>
                Fill in your monthly figures. Everything auto-saves — come back anytime to update.
              </p>
            </div>

            {/* Income */}
            <div className="glass" style={{ padding: '0 24px 8px' }}>
              <div style={{ padding: '14px 0 8px', marginBottom: 2 }}>
                <span style={{ fontSize: 'var(--sz-caption)', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Income</span>
                <span style={{ marginLeft: 10, fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>Total: <strong style={{ color: '#1a9930' }}>RM {totalIncome.toLocaleString()}</strong></span>
              </div>
              <InputRow label="Salary / Gaji"           sublabel="Net pay after EPF & SOCSO"      field="salary"     state={income} setter={setIncome} />
              <InputRow label="Freelance / Side Hustle" sublabel="Commission, gig work, part-time" field="freelance"  state={income} setter={setIncome} />
              <InputRow label="Rental Income"           sublabel="From property you rent out"      field="rental"     state={income} setter={setIncome} />
              <InputRow label="Investment Returns"      sublabel="Dividends, unit trust, EPF"      field="investment" state={income} setter={setIncome} />
              <InputRow label="Other Income"            sublabel="Any other regular income"        field="other"      state={income} setter={setIncome} />
            </div>

            {/* Debts */}
            <div className="glass" style={{ padding: '0 24px 8px' }}>
              <div style={{ padding: '14px 0 8px', marginBottom: 2 }}>
                <span style={{ fontSize: 'var(--sz-caption)', fontWeight: 700, color: '#cc2f26', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Debt Payments</span>
                <span style={{ marginLeft: 10, fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>Total: <strong style={{ color: '#cc2f26' }}>RM {totalDebts.toLocaleString()}</strong></span>
              </div>
              <InputRow label="Car Loan (Kereta)"       sublabel="Monthly instalment"             field="car_loan"        state={debts} setter={setDebts} />
              <InputRow label="Housing Loan / Mortgage" sublabel="Monthly instalment"             field="housing_loan"    state={debts} setter={setDebts} />
              <InputRow label="PTPTN"                   sublabel="Student loan repayment"         field="ptptn"           state={debts} setter={setDebts} />
              <InputRow label="Credit Card"             sublabel="Minimum monthly payment"        field="credit_card_min" state={debts} setter={setDebts} />
              <InputRow label="Personal Loan"           sublabel="Monthly instalment"             field="personal_loan"   state={debts} setter={setDebts} />
              <InputRow label="Other Loans"             sublabel="Any other monthly debt"         field="other_loan"      state={debts} setter={setDebts} />
              <div style={{ padding: '8px 0 6px', fontSize: 10, color: 'rgba(204,47,38,0.7)' }}>Loans only — daily spending goes in Expenses below</div>
            </div>

            {/* Expenses */}
            <div className="glass" style={{ padding: '0 24px 8px' }}>
              <div style={{ padding: '14px 0 8px', marginBottom: 2 }}>
                <span style={{ fontSize: 'var(--sz-caption)', fontWeight: 700, color: '#b86e00', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Living Expenses</span>
                <span style={{ marginLeft: 10, fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>Total: <strong style={{ color: '#b86e00' }}>RM {totalExpenses.toLocaleString()}</strong></span>
              </div>
              <InputRow label="Food & Groceries"    sublabel="Makan, groceries, pasar"        field="food"          state={expenses} setter={setExpenses} />
              <InputRow label="Transport"            sublabel="Petrol, toll, LRT, Grab"        field="transport"     state={expenses} setter={setExpenses} />
              <InputRow label="Utilities"            sublabel="TNB, air, WiFi, phone"          field="utilities"     state={expenses} setter={setExpenses} />
              <InputRow label="Entertainment"        sublabel="Movies, makan luar, hobbies"    field="entertainment" state={expenses} setter={setExpenses} />
              <InputRow label="Subscriptions"        sublabel="Netflix, Spotify, apps"         field="subscriptions" state={expenses} setter={setExpenses} />
              <InputRow label="Medical / Insurance"  sublabel="Premiums, clinic, medication"   field="medical"       state={expenses} setter={setExpenses} />
              <InputRow label="Family Support"       sublabel="Money given to parents/family"  field="parents"       state={expenses} setter={setExpenses} />
              <InputRow label="Other Expenses"       sublabel="Everything else"                field="other"         state={expenses} setter={setExpenses} />
            </div>

            {/* Savings & Goals */}
            <div className="glass" style={{ padding: '0 24px 8px' }}>
              <div style={{ padding: '14px 0 8px', marginBottom: 2 }}>
                <span style={{ fontSize: 'var(--sz-caption)', fontWeight: 700, color: '#0a5ed9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Savings & Goals</span>
              </div>
              <SingleRow label="Current Savings Balance"   sublabel="Emergency fund, ASB, tabung, EPF balance"       value={currentSavings}          onChange={setCurrentSavings} />
              <SingleRow label="Monthly Savings Target"    sublabel="How much you want to save each month"           value={monthlySavingsTarget}    onChange={setMonthlySavingsTarget} />
              <SingleRow label="Monthly Investment Budget" sublabel="How much you're willing to invest each month"   value={monthlyInvestmentBudget} onChange={setMonthlyInvestmentBudget} />
            </div>

            {/* Profile */}
            <div className="glass" style={{ padding: '16px 24px 20px' }}>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 'var(--sz-caption)', fontWeight: 700, color: 'var(--label-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Profile</span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ flex: '0 0 140px' }}>
                  <label style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Age</label>
                  <input type="number" placeholder="e.g. 26" value={age} onChange={e => setAge(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Life Stage</label>
                  <select value={lifeStage} onChange={e => setLifeStage(e.target.value)}>
                    {LIFE_STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Investment Risk Appetite</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {RISK_LEVELS.map(r => (
                    <button key={r} onClick={() => setRiskAppetite(r)} style={{
                      flex: 1, background: riskAppetite === r ? 'var(--teal-gradient)' : 'var(--surface-input)',
                      border: 'none', borderRadius: 12, color: riskAppetite === r ? '#fff' : 'var(--label-2)',
                      cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 'var(--sz-subhead)',
                      fontWeight: riskAppetite === r ? 600 : 400, letterSpacing: '-0.24px', padding: '11px 8px',
                      transition: 'all 0.15s', boxShadow: riskAppetite === r ? '0 4px 14px rgba(0,196,170,0.35)' : 'none',
                    }}>{r}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--teal-soft)', border: '0.5px solid var(--teal-border)', borderRadius: 14, fontSize: 'var(--sz-footnote)', color: 'var(--teal-dark)' }}>
              Auto-saved · Remaining after debts & expenses: <strong>RM {remaining.toLocaleString()}/mo</strong>
            </div>
          </div>
        )}

        {/* ── BUY ADVICE ──────────────────────────────── */}
        {activeSection === 'purchase' && (
          <div className="fade-in">
            <div style={{ marginBottom: 20 }}>
              <div className="t-title2" style={{ marginBottom: 4 }}>Should I Buy This?</div>
              <p style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)' }}>Optional — tell the AI what you're thinking of buying and get an honest verdict.</p>
            </div>
            <div className="glass" style={{ padding: '24px 24px 20px' }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', display: 'block', marginBottom: 8 }}>What do you want to buy?</label>
                <input type="text" placeholder="e.g. iPhone 16 Pro, New Car, Japan trip, RTX 5060 Ti..." value={purchaseItem} onChange={e => setPurchaseItem(e.target.value)} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', display: 'block', marginBottom: 8 }}>Estimated Cost (RM)</label>
                <div style={{ position: 'relative', maxWidth: 220 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--label-3)', fontSize: 'var(--sz-footnote)', fontWeight: 500, pointerEvents: 'none' }}>RM</span>
                  <input type="number" placeholder="0" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} style={{ paddingLeft: 38 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', display: 'block', marginBottom: 8 }}>How will you pay?</label>
                <select value={purchaseMethod} onChange={e => setPurchaseMethod(e.target.value)} style={{ maxWidth: 280 }}>
                  <option value="cash">Full Cash</option>
                  <option value="installment">Monthly Installment</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="loan">Bank Loan</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={checkPurchase}
                disabled={quickPurchaseLoading || !purchaseItem}
                style={{ padding: '10px 22px', fontSize: 13, opacity: (!purchaseItem || quickPurchaseLoading) ? 0.5 : 1 }}
              >
                {quickPurchaseLoading ? 'Analysing...' : 'Check This Purchase'}
              </button>
              <span style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-3)' }}>or include it in your full analysis below</span>
            </div>

            {quickPurchaseResult && (() => {
              const r = quickPurchaseResult
              const verdictColor = r.verdict === 'BUY' ? '#1a9930' : r.verdict === 'AVOID' ? '#cc2f26' : '#b86e00'
              const verdictBg    = r.verdict === 'BUY' ? 'rgba(26,153,48,0.10)' : r.verdict === 'AVOID' ? 'rgba(204,47,38,0.10)' : 'rgba(184,110,0,0.10)'
              return (
                <div className="glass fade-in" style={{ marginTop: 14, padding: '20px 20px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: verdictBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: verdictColor }}>{r.verdict?.charAt(0)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: verdictColor }}>{r.verdict}</div>
                      <div style={{ fontSize: 11, color: 'var(--label-3)' }}>Confidence: {r.confidence || 0}%</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: verdictBg, borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Affordability</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: verdictColor }}>{r.affordability_score || 0}/100</div>
                    </div>
                  </div>
                  {r.reasoning && <p style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', marginBottom: 12 }}>{r.reasoning}</p>}
                  {r.action_steps?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6 }}>Action Steps</div>
                      {r.action_steps.map((s, i) => <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 'var(--sz-footnote)', color: 'var(--label-2)' }}><span style={{ color: 'var(--teal)', flexShrink: 0 }}>›</span>{typeof s === 'object' ? (s.action || s.name || JSON.stringify(s)) : s}</div>)}
                    </div>
                  )}
                  {r.smarter_alternatives?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6 }}>Smarter Alternatives</div>
                      {r.smarter_alternatives.map((a, i) => <div key={i} style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-3)', padding: '3px 0' }}>• {typeof a === 'object' ? (a.name || a.title || JSON.stringify(a)) : a}</div>)}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* ── SCAM CHECKER ────────────────────────────── */}
        {activeSection === 'scam_check' && <ScamCheckerSection />}

      </main>
    </div>
  )
}
