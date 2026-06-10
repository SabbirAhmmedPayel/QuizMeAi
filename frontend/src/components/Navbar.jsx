import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const links = [
  { to: '/', label: 'Home' },
  { to: '/upload', label: 'Upload' },
  { to: '/ask', label: 'Ask' },
  { to: '/summarize', label: 'Summarize' },
  { to: '/quiz', label: 'Quiz' },
]

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 40px',
        background: 'rgba(26, 26, 46, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <NavLink
        to="/"
        style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}
      >
        <span style={{ color: 'var(--accent)' }}>RAG</span> Docs
      </NavLink>

      <div style={{ display: 'flex', gap: 8 }}>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: '0.875rem',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(108, 99, 255, 0.12)' : 'transparent',
              transition: 'all 0.2s',
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </motion.nav>
  )
}
