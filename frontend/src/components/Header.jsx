import { ShieldCheck, AlertTriangle } from 'lucide-react'

export default function Header({ onLogoClick }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* ── Main header bar (60px) ── */}
      <header style={{
        height:         60,
        background:     'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom:   '0.5px solid rgba(255,255,255,0.80)',
        boxShadow:      '0 1px 0 rgba(60,60,67,0.08)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 var(--page-px)',
      }}>
        {/* Logo */}
        <div onClick={onLogoClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width:          38,
            height:         38,
            borderRadius:   12,
            background:     'var(--teal-gradient)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            boxShadow:      '0 4px 12px rgba(0,196,170,0.35)',
            flexShrink:     0,
          }}>
            <ShieldCheck size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontWeight:    700,
              fontSize:      'var(--sz-headline)',
              letterSpacing: '-0.41px',
              lineHeight:    1.2,
              color:         'var(--label)',
            }}>
              DebtSense <span style={{ color: 'var(--teal)' }}>MY</span>
            </div>
            <div style={{
              fontSize:      10,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color:         'var(--label-3)',
              lineHeight:    1,
            }}>Financial Threat Intelligence · Powered by Gemini AI</div>
          </div>
        </div>

        {/* Right badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            6,
            background:     'rgba(0,196,170,0.10)',
            border:         '0.5px solid rgba(0,196,170,0.28)',
            borderRadius:   99,
            padding:        '5px 14px',
            fontSize:       'var(--sz-footnote)',
            fontWeight:     600,
            color:          'var(--teal-dark)',
            letterSpacing:  '-0.08px',
          }}>
            <span>5 AI Agents</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>Gemini 2.5 Flash</span>
          </div>
          <div style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            5,
            background:     'linear-gradient(135deg,rgba(0,122,255,0.12),rgba(88,86,214,0.12))',
            border:         '0.5px solid rgba(88,86,214,0.30)',
            borderRadius:   99,
            padding:        '5px 12px',
            fontSize:       'var(--sz-footnote)',
            fontWeight:     700,
            color:          '#5856d6',
            letterSpacing:  '-0.08px',
          }}>
            <ShieldCheck size={11} color="#5856d6" strokeWidth={2.5} />
            Track 5 · Secure Digital
          </div>
        </div>
      </header>

      {/* ── Threat Intelligence Ticker (28px) ── */}
      <div style={{
        height:       28,
        background:   'rgba(255,59,48,0.07)',
        borderBottom: '0.5px solid rgba(255,59,48,0.15)',
        overflow:     'hidden',
        display:      'flex',
        alignItems:   'center',
      }}>
        <style>{`
          @keyframes tickerScroll {
            from { transform: translateX(100vw); }
            to   { transform: translateX(-100%); }
          }
        `}</style>
        <div style={{
          animation:    'tickerScroll 35s linear infinite',
          whiteSpace:   'nowrap',
          fontSize:     11,
          fontWeight:   600,
          color:        '#cc2f26',
          letterSpacing: '0.1px',
          paddingLeft:  40,
          display:      'flex',
          alignItems:   'center',
          gap:          8,
        }}>
          <AlertTriangle size={10} color="#cc2f26" style={{ flexShrink: 0 }} />
          2024: Malaysians lost RM 1.2 billion to scams &nbsp;·&nbsp; Macau scams up 47% — targets debt-stressed victims &nbsp;·&nbsp; High DSR = 3x higher scam susceptibility &nbsp;·&nbsp; 68% of scam victims had savings below 3 months &nbsp;·&nbsp; Financial resilience is your #1 fraud protection &nbsp;·&nbsp; BNM reported 51,455 financial fraud cases in 2023 &nbsp;·&nbsp; Financially stressed Malaysians are the #1 scam target &nbsp;·&nbsp;
        </div>
      </div>
    </div>
  )
}
