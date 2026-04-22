import { useState, useRef, useEffect } from 'react'
import { Bot, Send, ArrowUp } from 'lucide-react'

const QUICK_QUESTIONS = [
  { label: 'Why am I a scam target?',  text: 'Why is my financial profile at risk of being targeted by scammers?' },
  { label: 'Improve my Shield Score',  text: 'How can I improve my Financial Shield Score?' },
  { label: 'How to lower my DSR?',     text: 'What steps can I take to lower my Debt Service Ratio?' },
  { label: 'Best investment for me?',  text: 'What is the best investment option for my financial profile right now?' },
  { label: 'Am I close to danger?',    text: 'How close am I to the BNM 60% DSR danger threshold?' },
  { label: 'Top 3 actions today',      text: 'What are the top 3 financial actions I should take today?' },
  { label: 'Should I consult AKPK?',   text: 'Should I consult AKPK for debt counselling based on my situation?' },
  { label: 'Explain my risk score',    text: 'Can you explain what my risk score means and what is driving it?' },
]

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '12px 14px', alignItems: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#00c4aa,#0096a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Bot size={14} color="#fff" />
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: 'rgba(255,255,255,0.72)', borderRadius: '0 10px 10px 10px', border: '0.5px solid rgba(255,255,255,0.90)' }}>
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '160ms' }} />
        <span className="typing-dot" style={{ animationDelay: '320ms' }} />
      </div>
    </div>
  )
}

export default function AIAssistant({ results, formData }) {
  const [messages,  setMessages]  = useState([
    { role: 'ai', text: "Hi! I'm your AI financial advisor powered by Gemini. Ask me anything about your analysis — or tap a quick question below." }
  ])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const bottomRef                 = useRef(null)
  const inputRef                  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendQuestion = async (text) => {
    const q = text.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30000)
      const res = await fetch('/api/ask', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question: q, analysisData: results || {}, formData: formData || {} }),
        signal:  controller.signal,
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', text: data.answer || 'No response received.' }])
    } catch (e) {
      const raw = e.message || ''
      const text = (raw.includes('abort') || raw.includes('AbortError'))
        ? 'Request timed out — the server is warming up. Please try again in a few seconds.'
        : (raw.includes('GEMINI_QUOTA') || raw.includes('quota') || raw.includes('depleted'))
          ? 'AI quota exceeded. Please try again later.'
          : (raw.includes('500') || raw.includes('502') || raw.includes('503') || raw === 'Failed to fetch')
            ? 'Server is temporarily unavailable. Please try again in a moment.'
            : `Sorry, I couldn't respond right now. Please try again.`
      setMessages(prev => [...prev, { role: 'ai', text, error: true }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(input) }
  }

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      width:         '100%',
      position:      'sticky',
      top:           'calc(var(--navbar-h) + 48px + 24px)',
      height:        'calc(100vh - var(--navbar-h) - 80px)',
      background:    'rgba(255,255,255,0.72)',
      backdropFilter:'blur(20px) saturate(180%)',
      WebkitBackdropFilter:'blur(20px) saturate(180%)',
      borderRadius:  22,
      border:        '0.5px solid rgba(255,255,255,0.90)',
      boxShadow:     'var(--glass-shadow)',
      overflow:      'hidden',
    }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '0.5px solid var(--sep)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#00c4aa,#0096a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--label)', letterSpacing: '-0.2px' }}>AI Financial Advisor</div>
            <div style={{ fontSize: 10, color: 'var(--teal-dark)', fontWeight: 600 }}>Powered by Gemini 2.5 Flash</div>
          </div>
        </div>
      </div>

      {/* Quick question chips */}
      <div style={{ padding: '8px 10px 6px', borderBottom: '0.5px solid var(--sep)', flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Quick Questions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q.label}
              onClick={() => sendQuestion(q.text)}
              disabled={loading}
              style={{
                fontSize:     10,
                fontWeight:   600,
                color:        loading ? 'var(--label-3)' : 'var(--teal-dark)',
                background:   'var(--teal-soft)',
                border:       '0.5px solid var(--teal-border)',
                borderRadius: 99,
                padding:      '4px 9px',
                cursor:       loading ? 'not-allowed' : 'pointer',
                fontFamily:   'var(--font)',
                transition:   'all 0.12s',
                opacity:      loading ? 0.5 : 1,
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0', scrollbarWidth: 'thin' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display:        'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems:     'flex-end',
            gap:            6,
            padding:        '3px 10px',
          }}>
            {msg.role === 'ai' && (
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#00c4aa,#0096a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 }}>
                <Bot size={12} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth:     '82%',
              padding:      '8px 11px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
              background:   msg.role === 'user'
                ? 'linear-gradient(135deg,#00c4aa,#0096a0)'
                : msg.error ? 'rgba(255,59,48,0.08)' : 'rgba(255,255,255,0.80)',
              border:       msg.role === 'user' ? 'none'
                : msg.error ? '0.5px solid rgba(255,59,48,0.25)' : '0.5px solid rgba(255,255,255,0.90)',
              boxShadow:    msg.role === 'user' ? '0 2px 8px rgba(0,196,170,0.30)' : '0 1px 4px rgba(0,0,0,0.06)',
              fontSize:     12,
              lineHeight:   1.6,
              color:        msg.role === 'user' ? '#fff' : msg.error ? '#cc2f26' : 'var(--label)',
              letterSpacing:'-0.1px',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '8px 10px', borderTop: '0.5px solid var(--sep)', flexShrink: 0, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ask anything about your finances…"
          rows={1}
          style={{
            flex:       1,
            resize:     'none',
            background: 'var(--surface-input)',
            border:     'none',
            borderRadius: 10,
            padding:    '8px 10px',
            fontSize:   12,
            color:      'var(--label)',
            fontFamily: 'var(--font)',
            outline:    'none',
            lineHeight: 1.5,
            maxHeight:  80,
            overflowY:  'auto',
          }}
        />
        <button
          onClick={() => sendQuestion(input)}
          disabled={!input.trim() || loading}
          style={{
            width:      34,
            height:     34,
            borderRadius: 10,
            background: !input.trim() || loading ? 'rgba(118,118,128,0.15)' : 'linear-gradient(135deg,#00c4aa,#0096a0)',
            border:     'none',
            cursor:     !input.trim() || loading ? 'not-allowed' : 'pointer',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
            boxShadow:  !input.trim() || loading ? 'none' : '0 2px 8px rgba(0,196,170,0.35)',
          }}
        >
          {loading
            ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            : <ArrowUp size={16} color={!input.trim() ? 'rgba(60,60,67,0.35)' : '#fff'} strokeWidth={2.5} />
          }
        </button>
      </div>
    </div>
  )
}
