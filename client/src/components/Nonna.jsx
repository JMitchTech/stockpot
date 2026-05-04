import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../api'
import nonna from '../assets/nonnaicon.png'

export default function NonnaSidebar({ open, onClose, onboarding = false }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: onboarding
        ? "Benvenuto! Welcome to Stockpot! I'm Nonna, your kitchen assistant. I'm going to help you get set up. First — tell me, what kind of restaurant are you running?"
        : "Ciao! I'm Nonna. Ask me anything about your kitchen — food costs, waste, what to order, how your margins look. I'm here."
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const endpoint = onboarding ? '/nonna/onboarding' : '/nonna/chat'
      const res = await api.post(endpoint, {
        message: input,
        history: messages
      })
      setMessages([...history, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages([...history, {
        role: 'assistant',
        content: "Sorry, I had trouble connecting. Try again in a moment."
      }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)'
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '384px',
          height: '400px',
          backgroundColor: '#FEFAF4',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100000,
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#1B2A4A',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0
          }}
        >
          <div>
            <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>Nonna</p>
            <p style={{ color: '#93C5FD', fontSize: '12px', margin: 0 }}>
              {onboarding ? 'Getting you set up' : 'Your kitchen assistant'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              color: 'white',
              opacity: 0.6,
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              {msg.role === 'assistant' && (
                <img
                  src={nonna}
                  alt="Nonna"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    marginTop: '4px'
                  }}
                />
              )}
              <div
                style={{
                  maxWidth: '75%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  backgroundColor: msg.role === 'user' ? '#1B2A4A' : '#F0E6D3',
                  color: msg.role === 'user' ? 'white' : '#3D2B1F',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <img
                src={nonna}
                alt="Nonna"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '18px 18px 18px 4px',
                  backgroundColor: '#F0E6D3',
                  color: '#6B4F3A',
                  fontSize: '14px',
                  fontStyle: 'italic'
                }}
              >
                Nonna is thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            borderTop: '1px solid #E8D5B7',
            padding: '12px 16px',
            display: 'flex',
            gap: '8px',
            flexShrink: 0,
            backgroundColor: '#FEFAF4'
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={onboarding ? "Tell Nonna about your restaurant..." : "Ask Nonna anything..."}
            style={{
              flex: 1,
              fontSize: '14px',
              border: '1px solid #E8D5B7',
              borderRadius: '8px',
              padding: '8px 12px',
              outline: 'none',
              backgroundColor: 'white',
              color: '#3D2B1F'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              backgroundColor: '#C0392B',
              color: 'white',
              fontSize: '14px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Send
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}