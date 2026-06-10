import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { askQuestion } from '../api'

export default function Ask() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [answer])

  async function handleAsk() {
    if (!question.trim()) return
    setLoading(true)
    setAnswer('')
    setError('')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await askQuestion(question.trim())
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setAnswer((prev) => prev + chunk)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>Ask a Question</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Ask anything about the uploaded document.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What would you like to know?"
          rows={2}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            resize: 'none',
            fontSize: '0.95rem',
          }}
        />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{
            padding: '12px 28px',
            background: loading ? 'var(--border)' : 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            alignSelf: 'flex-end',
            opacity: loading || !question.trim() ? 0.6 : 1,
          }}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            background: 'rgba(255, 94, 122, 0.12)',
            color: 'var(--error)',
            border: '1px solid rgba(255, 94, 122, 0.3)',
            marginBottom: 16,
            whiteSpace: 'pre-wrap',
          }}
        >
          {error}
        </motion.div>
      )}

      {answer && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 20,
            borderRadius: 'var(--radius)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}
        >
          {answer}
          {loading && (
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 16,
                background: 'var(--accent)',
                marginLeft: 4,
                animation: 'blink 0.8s step-end infinite',
              }}
            />
          )}
        </motion.div>
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </motion.div>
  )
}
