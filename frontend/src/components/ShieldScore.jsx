export default function ShieldScore({ shield }) {
  if (!shield) return null
  const { score, level, levelColor, breakdown, strengths, maxPossibleGain, projectedScore, summary } = shield
  const deg = Math.round((score / 100) * 360)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>

      {/* ── Score Gauge ── */}
      <div className="glass" style={{ padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${levelColor}14`, border: `0.5px solid ${levelColor}33`, borderRadius: 99, padding: '4px 16px', fontSize: 'var(--sz-caption)', fontWeight: 700, color: levelColor, marginBottom: 20 }}>
          Financial Shield Score
        </div>

        {/* Conic-gradient gauge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width:        160,
            height:       160,
            borderRadius: '50%',
            background:   `conic-gradient(${levelColor} 0deg ${deg}deg, rgba(0,0,0,0.07) ${deg}deg 360deg)`,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            boxShadow:    `0 8px 32px ${levelColor}28`,
          }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: levelColor, letterSpacing: '-2px', lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 11, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>/100</div>
            </div>
          </div>
        </div>

        {/* Level pill */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${levelColor}14`, border: `0.5px solid ${levelColor}33`, borderRadius: 99, padding: '6px 20px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: levelColor, display: 'inline-block' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: levelColor }}>{level}</span>
          </span>
        </div>

        <p style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', lineHeight: 1.65, maxWidth: 520, margin: '0 auto' }}>{summary}</p>
      </div>

      {/* ── What's Affecting Your Score ── */}
      {breakdown?.length > 0 && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 5 }}>WHAT'S AFFECTING YOUR SHIELD SCORE</div>
            <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)' }}>Each factor below represents a real vulnerability scammers exploit</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {breakdown.map((item, i) => {
              const borderCol = item.impact === 'HIGH' ? 'rgba(255,59,48,0.28)' : item.impact === 'MEDIUM' ? 'rgba(255,159,10,0.28)' : 'rgba(0,196,170,0.28)'
              const bgCol     = item.impact === 'HIGH' ? 'rgba(255,59,48,0.04)' : item.impact === 'MEDIUM' ? 'rgba(255,159,10,0.03)' : 'rgba(0,196,170,0.03)'
              const impCol    = item.impact === 'HIGH' ? '#cc2f26' : item.impact === 'MEDIUM' ? '#b86e00' : 'var(--teal)'
              return (
                <div key={i} style={{ background: bgCol, border: `0.5px solid ${borderCol}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 'var(--sz-subhead)', fontWeight: 700, color: 'var(--label)' }}>{item.factor}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, background: `${impCol}14`, color: impCol, borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase' }}>
                          IMPACT: {item.impact}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#cc2f26' }}>-{item.penalty}pts</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <p style={{ fontSize: 'var(--sz-footnote)', color: 'var(--label-2)', lineHeight: 1.6, marginBottom: 10 }}>{item.explanation}</p>

                    {/* Scam Link — KEY DIFFERENTIATOR */}
                    <div style={{ background: 'rgba(255,149,0,0.09)', borderLeft: '2px solid #ff9500', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ff9500' }}>Why scammers care: </span>
                      <span style={{ fontSize: 11, color: 'var(--label-2)', lineHeight: 1.5 }}>{item.scam_link}</span>
                    </div>

                    {/* Fix row */}
                    <div style={{ background: 'rgba(0,196,170,0.07)', borderRadius: 8, padding: '7px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal-dark)' }}>How to fix: </span>
                      <span style={{ fontSize: 11, color: 'var(--label-2)', lineHeight: 1.5 }}>{item.fix}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── What's Protecting You ── */}
      {strengths?.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1a9930', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>WHAT'S PROTECTING YOU</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {strengths.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(40,200,64,0.08)', border: '0.5px solid rgba(40,200,64,0.22)', borderRadius: 12, padding: '12px 14px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a9930', flexShrink: 0, marginTop: 5, display: 'inline-block' }} />
                <div>
                  <div style={{ fontSize: 'var(--sz-footnote)', fontWeight: 700, color: '#1a9930', marginBottom: 2 }}>{item.factor}</div>
                  <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-2)', lineHeight: 1.5 }}>{item.explanation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Your Potential ── */}
      <div className="glass" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>YOUR POTENTIAL</div>
        <div style={{ fontSize: 'var(--sz-subhead)', color: 'var(--label-2)', marginBottom: 16 }}>If you complete the 3-Month Defence Roadmap:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ background: `${levelColor}14`, border: `0.5px solid ${levelColor}33`, borderRadius: 14, padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: levelColor, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 9, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>Current</div>
          </div>
          <div style={{ fontSize: 22, color: 'var(--teal)' }}>→</div>
          <div style={{ background: 'rgba(40,200,64,0.12)', border: '0.5px solid rgba(40,200,64,0.28)', borderRadius: 14, padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1a9930', lineHeight: 1 }}>{projectedScore}</div>
            <div style={{ fontSize: 9, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>Projected</div>
          </div>
        </div>
        <div style={{ fontSize: 'var(--sz-caption)', color: 'var(--label-3)', textAlign: 'center' }}>
          Estimated improvement: <strong style={{ color: '#1a9930' }}>+{Math.round(maxPossibleGain * 0.7)} points</strong> by addressing all vulnerabilities above
        </div>
      </div>
    </div>
  )
}
