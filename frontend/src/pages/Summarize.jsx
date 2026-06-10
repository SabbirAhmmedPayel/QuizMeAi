import { useState } from 'react'
import { motion } from 'framer-motion'
import { summarize } from '../api'

const levels = [
  { value: 'low', label: 'Low', desc: 'One sentence (under 40 words)' },
  { value: 'med', label: 'Medium', desc: '1–2 paragraphs' },
  { value: 'high', label: 'High', desc: 'Comprehensive, structured' },
]

export default function Summarize() {
  const [level, setLevel] = useState('low')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSummarize() {
    setLoading(true)
    setSummary('')
    setError('')
    try {
      const res = await summarize(level)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
      }
      setSummary(text)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>Summarize</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Generate a summary of the uploaded PDF at your preferred detail level.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {levels.map(({ value, label, desc }) => (
          <motion.button
            key={value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLevel(value)}
            style={{
              flex: 1,
              padding: '16px 20px',
              borderRadius: 'var(--radius)',
              border: `2px solid ${level === value ? 'var(--accent)' : 'var(--border)'}`,
              background: level === value ? 'rgba(108, 99, 255, 0.1)' : 'var(--bg-card)',
              color: level === value ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 600,
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '1.1rem' }}>{label}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 400, marginTop: 4, opacity: 0.8 }}>
              {desc}
            </div>
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSummarize}
        disabled={loading}
        style={{
          padding: '12px 32px',
          background: loading ? 'var(--border)' : 'var(--accent)',
          color: '#fff',
          borderRadius: 'var(--radius)',
          fontWeight: 600,
          fontSize: '1rem',
          width: '100%',
          marginBottom: 24,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Generating...' : `Generate ${levels.find((l) => l.value === level).label} Summary`}
      </motion.button>

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
          }}
        >
          {error}
        </motion.div>
      )}

      {summary && (
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
          {summary}
        </motion.div>
      )}
    </motion.div>
  )
}
