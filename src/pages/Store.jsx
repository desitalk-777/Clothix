// src/pages/Store.jsx
import { useState, useEffect } from 'react'
import { fetchProducts } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'

// ── Animation variants ──────────────────────────────────
const heroText = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}
const heroLine = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay } },
})
const staggerGrid = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const cardReveal = {
  hidden: { opacity: 0, y: 50, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, -60])
  const heroOpacity = useTransform(scrollY, [0, 350], [1, 0])

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? products : products.filter(p => p.stock_status === filter)

  return (
    <div className="min-h-screen bg-[#faf9f7] grain-overlay">
      {/* Header */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-[#c9a96e]/30 bg-white/90 backdrop-blur-md sticky top-0 z-30"
      >
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img src="/logo.jpg" alt="Clothix Logo" className="h-10 md:h-12 w-auto object-contain hover:opacity-80 transition-opacity" />
            </Link>
            <div className="hidden sm:block border-l border-stone-200 pl-4">
              <h1 className="text-xl tracking-[0.35em] uppercase font-semibold text-stone-900">Clothix</h1>
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#c9a96e] mt-0.5 font-medium">Luxury Ready-to-Wear</p>
            </div>
          </div>
          <Link
            to="/admin"
            className="text-[10px] tracking-[0.2em] uppercase text-stone-500 font-semibold hover:text-[#c9a96e] transition-colors duration-300"
          >
            Admin
          </Link>
        </div>
      </motion.header>

      {/* Hero */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center"
      >
        <motion.div variants={heroText} initial="hidden" animate="visible">
          <motion.p variants={heroLine} className="text-sm tracking-[0.5em] uppercase text-[#c9a96e] font-semibold mb-4">
            New Collection
          </motion.p>
          <motion.h2 variants={heroLine} className="text-4xl md:text-6xl font-bold text-stone-900 tracking-wide leading-tight">
            Dressed for<br />every silence
          </motion.h2>
          <motion.p variants={heroLine} className="mt-5 text-base text-stone-500 font-medium max-w-md mx-auto leading-relaxed">
            Thoughtfully crafted pieces that speak without words. Order directly via WhatsApp for a personal touch.
          </motion.p>

          {/* Floating accent badge */}
          <motion.div variants={heroLine} className="inline-block mt-8">
            <span className="float-badge inline-block border border-[#c9a96e]/50 text-[#c9a96e] text-xs tracking-[0.4em] uppercase px-5 py-2 bg-[#c9a96e]/5 shadow-sm font-semibold">
              ✦ &nbsp; Exclusive Pieces
            </span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        style={{ originX: 0.5 }}
        className="max-w-xs mx-auto h-px bg-gradient-to-r from-transparent via-[#c9a96e]/50 to-transparent mb-10"
      />

      {/* Filter bar */}
      <motion.div
        variants={fadeUp(0.6)}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 pb-8 flex gap-6 justify-center"
      >
        {[['all', 'All'], ['in_stock', 'In Stock'], ['low_stock', 'Low Stock']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`text-sm tracking-[0.25em] uppercase pb-1 border-b transition-all duration-300 font-semibold
              ${filter === val
                ? 'border-[#c9a96e] text-[#c9a96e]'
                : 'border-transparent text-stone-400 hover:text-stone-700'}`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-[3/4] bg-stone-100 overflow-hidden shimmer-line"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-base text-stone-400 tracking-widest uppercase font-semibold">No products found</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              variants={staggerGrid}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {filtered.map(product => (
                <motion.div key={product.id} variants={cardReveal}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="border-t border-[#c9a96e]/20 bg-white"
      >
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-xs tracking-[0.4em] uppercase text-stone-400 font-medium">© {new Date().getFullYear()} Clothix — All rights reserved</p>
        </div>
      </motion.footer>
    </div>
  )
}
