import { useState, useRef, useEffect } from 'react'
import api from '../api'
import nonna from '../assets/Nonna.png'

export default function NonnaSidebar({ open, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Ciao! I'm Nonna. Ask me anything about your kitchen — food costs, waste, what to order, how your margins look. I'm here."
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
      const res = await api.post('/nonna/chat', {
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-96 bg-white h-full shadow-2xl flex flex-col">

        {/* Header */}
        <div className="bg-[#1B2A4A] px-5 py-4 flex items-center gap-3">
          <img src={nonna} alt="Nonna" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
          <div>
            <p className="text-white font-semibold text-sm">Nonna</p>
            <p className="text-blue-200 text-xs">Your kitchen assistant</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-white opacity-60 hover:opacity-100 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <img src={nonna} alt="Nonna" className="w-7 h-7 rounded-full object-cover mr-2 mt-1 shrink-0" />
              )}
              <div
                className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1B2A4A] text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <img src={nonna} alt="Nonna" className="w-7 h-7 rounded-full object-cover mr-2 mt-1" />
              <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-400 italic">
                Nonna is thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask Nonna anything..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-[#C0392B] text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  )
}