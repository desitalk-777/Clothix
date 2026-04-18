// src/pages/Login.jsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      await signIn(username, password)
      navigate('/admin')
    } catch (err) {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  }
  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <motion.div variants={container} initial="hidden" animate="visible" className="text-center mb-10 flex flex-col items-center">
          <motion.img 
            variants={item}
            src="/logo.jpg" 
            alt="Clothix Logo" 
            className="h-16 w-auto object-contain mb-4" 
          />
          <motion.h1 variants={item} className="text-2xl tracking-[0.35em] uppercase font-light text-stone-900">Clothix</motion.h1>
          <motion.p variants={item} className="text-[9px] tracking-[0.4em] uppercase text-stone-400 mt-1">Admin Access</motion.p>
        </motion.div>

        <motion.div
          variants={container} initial="hidden" animate="visible"
          className="bg-white border border-stone-100 p-8 space-y-4 shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
        >
          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <motion.div variants={item}>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full border border-stone-200 px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
            />
          </motion.div>

          <motion.div variants={item}>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full border border-stone-200 px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors"
              placeholder="••••••••"
            />
          </motion.div>

          <motion.div variants={item}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-stone-900 text-white text-xs tracking-[0.2em] uppercase hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-6 text-xs text-stone-400"
        >
          <a href="/" className="hover:text-stone-900 transition-colors tracking-wide">← Back to Store</a>
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
