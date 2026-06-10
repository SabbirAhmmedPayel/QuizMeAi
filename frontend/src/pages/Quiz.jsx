import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateQuiz } from '../api'

export default function Quiz() {
  const [numQuestions, setNumQuestions] = useState(3)
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState({})

  async function handleGenerate() {
    setLoading(true)
    setQuiz(null)
    setAnswers({})
    setError('')
    try {
      const data = await generateQuiz(numQuestions)
      setQuiz(data.questions)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function selectAnswer(qIdx, option) {
    setAnswers((prev) => ({ ...prev, [qIdx]: option }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>Generate Quiz</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Create multiple-choice questions from your document.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Questions:</label>
        <input
          type="number"
          min={1}
          max={10}
          value={numQuestions}
          onChange={(e) => setNumQuestions(Math.max(1, Math.min(10, Number(e.target.value))))}
          style={{
            width: 72,
            padding: '10px 12px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            textAlign: 'center',
          }}
        />
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: '10px 24px',
            background: loading ? 'var(--border)' : 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Generating...' : 'Generate'}
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
          }}
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence>
        {quiz &&
          quiz.map((q, qIdx) => {
            const selected = answers[qIdx]
            const correct = q.answer
            const isCorrect = selected === correct
            return (
              <motion.div
                key={qIdx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qIdx * 0.08 }}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: 12 }}>
                  {qIdx + 1}. {q.question}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((opt) => {
                    let bg = 'transparent'
                    let border = 'var(--border)'
                    let color = 'var(--text-secondary)'
                    if (selected !== undefined) {
                      if (opt === correct) {
                        bg = 'rgba(61, 214, 140, 0.12)'
                        border = 'var(--success)'
                        color = 'var(--success)'
                      } else if (opt === selected && opt !== correct) {
                        bg = 'rgba(255, 94, 122, 0.12)'
                        border = 'var(--error)'
                        color = 'var(--error)'
                      }
                    } else if (opt === selected) {
                      bg = 'rgba(108, 99, 255, 0.1)'
                      border = 'var(--accent)'
                      color = 'var(--accent)'
                    }
                    return (
                      <button
                        key={opt}
                        onClick={() => !selected && selectAnswer(qIdx, opt)}
                        disabled={selected !== undefined}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: `1px solid ${border}`,
                          background: bg,
                          color,
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          cursor: selected !== undefined ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {selected !== undefined && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      marginTop: 10,
                      fontSize: '0.85rem',
                      color: isCorrect ? 'var(--success)' : 'var(--error)',
                      fontWeight: 600,
                    }}
                  >
                    {isCorrect ? 'Correct!' : `Incorrect — Answer: ${q.answer}`}
                  </motion.p>
                )}
              </motion.div>
            )
          })}
      </AnimatePresence>
    </motion.div>
  )
}
