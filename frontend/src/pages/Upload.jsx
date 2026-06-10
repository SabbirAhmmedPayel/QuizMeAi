import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { uploadPdf } from '../api'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef()

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setResult('')
    setError('')
    try {
      const data = await uploadPdf(file, setProgress)
      setResult(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>Upload PDF</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Upload a PDF document to index it into the vector database.
      </p>

      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: `2px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
          padding: 48,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border 0.2s',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f?.type === 'application/pdf') setFile(f)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) => setFile(e.target.files[0])}
        />
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
        {file ? (
          <p>
            <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
          </p>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>
            Drop a PDF here or click to browse
          </p>
        )}
      </div>

      {file && !uploading && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpload}
          style={{
            marginTop: 20,
            padding: '12px 32px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            fontSize: '1rem',
            width: '100%',
          }}
        >
          Upload &amp; Index
        </motion.button>
      )}

      {uploading && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--border)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', background: 'var(--accent)', borderRadius: 3 }}
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8 }}>
            Indexing... {progress}%
          </p>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 20,
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            background: 'rgba(61, 214, 140, 0.12)',
            color: 'var(--success)',
            border: '1px solid rgba(61, 214, 140, 0.3)',
          }}
        >
          {result}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 20,
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            background: 'rgba(255, 94, 122, 0.12)',
            color: 'var(--error)',
            border: '1px solid rgba(255, 94, 122, 0.3)',
          }}
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  )
}
