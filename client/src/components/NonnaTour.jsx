import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import nonna from '../assets/Nonna.png'

const stops = [
  {
    tab: null,
    message: "Benvenuto! I'm Nonna, and I'm so happy you're here. Stockpot is your kitchen's best friend — I'll help you track your costs, reduce waste, and make sure your restaurant is running as healthy as possible. Let me show you around!"
  },
  {
    tab: '/',
    label: 'Dashboard',
    message: "This is your Dashboard — the first thing you'll see every morning. It shows your kitchen's health score, any alerts that need your attention, your top menu margins, and what you should be ordering this week. Everything at a glance."
  },
  {
    tab: '/menu',
    label: 'Menu',
    message: "Here's your Menu. Every dish you serve lives here. I'll calculate the food cost and margin for each one automatically once you link your ingredients. Green means healthy profit, yellow means watch it, red means we need to talk."
  },
  {
    tab: '/ingredients',
    label: 'Ingredients',
    message: "Your Ingredients library is the engine behind everything. Add each ingredient with its cost and par level — how much you need to always have on hand. I use this to calculate your food costs and tell you what to order."
  },
  {
    tab: '/waste',
    label: 'Waste Log',
    message: "The Waste Log is where you record what gets thrown out at the end of each shift. It takes 60 seconds. I track the patterns over time and will tell you exactly where your money is going in the trash — and how to stop it."
  },
  {
    tab: '/purchasing',
    label: 'Purchasing',
    message: "Purchasing is your smart order list. I look at what you have, what you've been wasting, and what's coming up on the calendar — like holidays or events — and tell you exactly what to order and how much. No more guessing."
  },
  {
    tab: '/vendors',
    label: 'Vendors',
    message: "Vendors is your supplier contact book. Store your rep's name, phone, email, delivery days, and payment terms. Every order you place is logged here so you can see your full purchase history and spot when prices creep up."
  },
  {
    tab: '/scan',
    label: 'Scan Menu',
    message: "This is one of my favorite tricks. Take a photo of your menu or a supplier invoice and I'll read it for you automatically. Your whole menu can be set up in minutes instead of hours. On mobile you can use your camera directly."
  },
  {
    tab: '/reports',
    label: 'Reports',
    message: "Reports lets you download your food cost breakdown, waste log, and purchasing forecast as a PDF or spreadsheet. Perfect to hand to your accountant at the end of the month — everything they need, formatted and ready to go."
  },
  {
    tab: null,
    message: "That's the tour! Now let's get your kitchen set up. Start by adding a few ingredients, then build out your menu. I'll be right here in the corner whenever you need me — just click on my picture. Andiamo!"
  }
]

export default function NonnaTour({ onComplete }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)
  const [animating, setAnimating] = useState(false)

  const current = stops[step]
  const isLast = step === stops.length - 1

  const handleNext = () => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      if (isLast) {
        setVisible(false)
        onComplete()
      } else {
        setStep(step + 1)
        setAnimating(false)
      }
    }, 200)
  }

  if (!visible) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      {/* Highlight active sidebar tab */}
      {current.label && (
  <div
    style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '208px',
      height: '100vh',
      zIndex: 99997,
      pointerEvents: 'none'
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: '12px',
        right: '12px',
        borderRadius: '8px',
        backgroundColor: 'white',
        border: '3px solid #C0392B',
        top: getTabOffset(current.label),
        height: '40px',
        transition: 'top 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '16px'
    }}
    >
      <span style={{ color: '#1B2A4A', fontSize: '14px', fontWeight: 600 }}>
        {current.label}
      </span>
    </div>
  </div>
)}

      {/* Main tour card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '32px',
          maxWidth: '860px',
          width: '100%',
          opacity: animating ? 0 : 1,
          transition: 'opacity 0.2s ease'
        }}
      >
        {/* Nonna image */}
        <div style={{ flexShrink: 0 }}>
          <img
            src={nonna}
            alt="Nonna"
            style={{
              width: '350px',
              height: '350px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))'
            }}
          />
        </div>

        {/* Speech bubble */}
        <div
          style={{
            position: 'relative',
            backgroundColor: '#FEFAF4',
            borderRadius: '20px',
            padding: '28px 32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            flex: 1,
            marginBottom: '24px'
          }}
        >
          {/* Bubble tail pointing left toward Nonna */}
          <div
            style={{
              position: 'absolute',
              left: '-16px',
              bottom: '40px',
              width: 0,
              height: 0,
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderRight: '18px solid #FEFAF4'
            }}
          />

          {/* Step indicator */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '16px'
            }}
          >
            {stops.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: i === step ? '#C0392B' : '#E8D5B7',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>

          {/* Tab label */}
          {current.label && (
            <p
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#C0392B',
                marginBottom: '8px'
              }}
            >
              {current.label}
            </p>
          )}

          {/* Message */}
          <p
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#3D2B1F',
              marginBottom: '24px',
              fontFamily: 'Georgia, serif'
            }}
          >
            {current.message}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  fontSize: '13px',
                  color: '#6B4F3A',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Back
              </button>
            ) : <div />}

            <button
              onClick={handleNext}
              style={{
                backgroundColor: '#C0392B',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                padding: '10px 28px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(192,57,43,0.3)'
              }}
            >
              {isLast ? "Let's get started!" : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function getTabOffset(label) {
  const tabs = ['Dashboard', 'Menu', 'Ingredients', 'Waste Log', 'Purchasing', 'Vendors', 'Scan Menu', 'Reports']
  const index = tabs.indexOf(label)
  if (index === -1) return '24px'
  return `${85 + index * 44}px`
}