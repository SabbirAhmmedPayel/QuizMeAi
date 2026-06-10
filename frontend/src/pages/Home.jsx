import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getModels } from '../api'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

export default function Home() {
  const [models, setModels] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getModels()
      .then(setModels)
      .catch(() => setError('Could not reach the backend server.'))
  }, [])

  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ duration: 0.5 }}>
      <motion.div variants={fadeUp} transition={{ delay: 0.1 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 8 }}>
          RAG Document QA
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 40, maxWidth: 560 }}>
          Upload a PDF, then ask questions, get summaries, or generate quizzes
          powered by LLM retrieval-augmented generation.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        transition={{ delay: 0.25 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 48,
        }}
      >
        {[
          { title: 'Upload', desc: 'Index a PDF into the vector store', color: '#6c63ff' },
          { title: 'Ask', desc: 'Query your document with natural language', color: '#3dd68c' },
          { title: 'Summarize', desc: 'Get concise or detailed summaries', color: '#ffb347' },
          { title: 'Quiz', desc: 'Auto-generate multiple-choice questions', color: '#ff5e7a' },
        ].map(({ title, desc, color }) => (
          <motion.div
            key={title}
            whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              padding: 24,
              border: '1px solid var(--border)',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: color,
                opacity: 0.2,
                marginBottom: 12,
              }}
            />
            <h3 style={{ fontWeight: 600, marginBottom: 4 }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} transition={{ delay: 0.4 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>Available Models</h2>

        {error && (
          <p style={{ color: 'var(--error)', padding: 16, background: 'rgba(255,94,122,0.1)', borderRadius: 'var(--radius)' }}>
            {error}
          </p>
        )}

        {models && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(models).map(([name, info]) => (
              <div
                key={name}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius)',
                  padding: '16px 20px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{name}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {info.provider}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
                  {info.model_name} &middot; {info.use_cases?.join(', ') || '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
