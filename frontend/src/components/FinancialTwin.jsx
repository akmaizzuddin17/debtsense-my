import { User } from 'lucide-react'

export default function FinancialTwin({ twin }) {
  const archetypeGradients = {
    Saver:    'linear-gradient(135deg, #00c4aa 0%, #0096a0 100%)',
    Spender:  'linear-gradient(135deg, #ff6b35 0%, #ff9500 100%)',
    Builder:  'linear-gradient(135deg, #f7c948 0%, #f0a500 100%)',
    Survivor: 'linear-gradient(135deg, #ff3b30 0%, #ff6b5b 100%)',
    Climber:  'linear-gradient(135deg, #a78bfa 0%, #7c5cdb 100%)',
    Hustler:  'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
  }
  const archetypeColors = {
    Saver: '#00c4aa', Spender: '#ff6b35', Builder: '#f7c948',
    Survivor: '#ff3b30', Climber: '#a78bfa', Hustler: '#38bdf8',
  }
  const gradient = archetypeGradients[twin.archetype] || archetypeGradients.Saver
  const color    = archetypeColors[twin.archetype]    || '#00c4aa'

  return (
    <div style={{
      background:    'rgba(255,255,255,0.75)',
      backdropFilter:'blur(20px) saturate(180%)',
      WebkitBackdropFilter:'blur(20px) saturate(180%)',
      border:        `0.5px solid ${color}44`,
      borderRadius:  20,
      overflow:      'hidden',
      position:      'relative',
      boxShadow:     `0 8px 32px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.65)`,
    }}>
      {/* Top color bar */}
      <div style={{ height: 4, background: gradient }} />

      {/* Radial glow */}
      <div style={{
        position:   'absolute',
        top:        -60,
        right:      -60,
        width:      220,
        height:     220,
        background: `radial-gradient(circle, ${color}18, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ padding: '20px 20px 16px', position: 'relative' }}>
        <div style={{
          fontSize:       'var(--sz-caption)',
          fontWeight:     600,
          letterSpacing:  '0.5px',
          textTransform:  'uppercase',
          color:          color,
          marginBottom:   12,
          display:        'flex',
          alignItems:     'center',
          gap:            5,
        }}>
          Your Financial Twin
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{
            background:    `${color}18`,
            border:        `1.5px solid ${color}44`,
            borderRadius:  16,
            fontSize:      40,
            height:        72,
            width:         72,
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            flexShrink:    0,
          }}>
            <User size={32} color={color} strokeWidth={1.5} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight:    700,
              fontSize:      'var(--sz-title2)',
              letterSpacing: '-0.30px',
              lineHeight:    1.2,
              marginBottom:  6,
              color:         'var(--label)',
            }}>{twin.name}</div>
            <span style={{
              display:        'inline-block',
              background:     `${color}18`,
              border:         `0.5px solid ${color}44`,
              borderRadius:   99,
              color:          color,
              fontSize:       'var(--sz-caption)',
              fontWeight:     600,
              letterSpacing:  '0.5px',
              padding:        '3px 10px',
              textTransform:  'uppercase',
            }}>{twin.archetype}</span>
          </div>
        </div>

        <div style={{
          color:      'var(--label-2)',
          fontSize:   'var(--sz-subhead)',
          lineHeight: 1.5,
          fontStyle:  'italic',
        }}>"{twin.tagline}"</div>
      </div>
    </div>
  )
}
