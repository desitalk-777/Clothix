// src/components/ProductCard.jsx
import { useState, useRef } from 'react'
import { formatPrice } from '../lib/whatsapp'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import PaymentModal from './PaymentModal'

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function ProductCard({ product }) {
  const [selectedSize, setSelectedSize] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const cardRef = useRef(null)

  // ── 3D tilt motion values ──────────────────────────────
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 25 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 25 })
  const shine = useTransform(x, [-0.5, 0.5], ['-40%', '140%'])

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const handleMouseLeave = () => { x.set(0); y.set(0) }

  const sizes = [...(product.sizes || [])].sort(
    (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)
  )

  const stockLabel = {
    in_stock: null,
    low_stock: 'Only a few left',
    out_of_stock: 'Sold Out',
  }[product.stock_status]

  const isSoldOut = product.stock_status === 'out_of_stock'

  return (
    <div
      ref={cardRef}
      className="perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.article
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={{ z: 10 }}
        className="group flex flex-col bg-white border border-stone-100 overflow-hidden transition-shadow duration-500 hover:shadow-[0_20px_60px_rgba(201,169,110,0.15)] cursor-default"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] bg-stone-50 overflow-hidden">
          {product.image_url ? (
            <>
              {!imgLoaded && <div className="absolute inset-0 bg-stone-100 animate-pulse" />}
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-50">
              <span className="text-stone-300 text-sm tracking-widest uppercase font-medium">No Image</span>
            </div>
          )}

          {/* Shine layer */}
          <motion.div style={{ left: shine }} className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent w-1/3" />
          </motion.div>

          {isSoldOut && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-xs tracking-[0.3em] uppercase text-stone-500 font-bold">Sold Out</span>
            </div>
          )}

          {stockLabel && !isSoldOut && (
            <div className="absolute top-3 left-3 bg-[#c9a96e] text-white text-[10px] tracking-widest uppercase px-2.5 py-1 font-semibold">
              {stockLabel}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-5 gap-4">
          <div>
            <h3 className="font-semibold text-stone-900 text-lg tracking-wide leading-snug">{product.name}</h3>
            {product.description && (
              <p className="mt-1.5 text-sm text-stone-500 font-medium leading-relaxed line-clamp-2">{product.description}</p>
            )}
            <p className="mt-3 text-[#c9a96e] font-bold tracking-wide text-lg">{formatPrice(product.price)}</p>
          </div>

          {/* Size selector */}
          {sizes.length > 0 && !isSoldOut && (
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-2 font-semibold">Select Size</p>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map(size => (
                  <motion.button
                    key={size}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                    className={`w-10 h-10 text-sm border transition-all duration-200 tracking-wide font-semibold
                      ${selectedSize === size
                        ? 'bg-[#c9a96e] text-white border-[#c9a96e]'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-[#c9a96e] hover:text-[#c9a96e]'
                      }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {!isSoldOut && (
            <div className="relative mt-auto">
              <AnimatePresence>
                {sizeError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-full left-0 right-0 mb-3 z-20"
                  >
                    <div className="bg-[#c9a96e] text-white text-[10px] tracking-[0.2em] uppercase font-bold py-2.5 px-4 shadow-[0_10px_30px_rgba(201,169,110,0.3)] flex items-center justify-center gap-2">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current border border-white/30 rounded-full p-0.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      Please Select Size
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#c9a96e] rotate-45" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (!selectedSize && sizes.length > 0) {
                    setSizeError(true)
                    setTimeout(() => setSizeError(false), 2000)
                    return
                  }
                  setShowPayment(true)
                }}
                className="w-full py-3.5 bg-stone-900 text-white text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#c9a96e] flex items-center justify-center gap-2.5 font-semibold"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth={2}>
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 7h11M10 20a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Buy Now
              </motion.button>
            </div>
          )}

          {showPayment && (
            <PaymentModal
              product={product}
              selectedSize={selectedSize || 'Free Size'}
              onClose={() => setShowPayment(false)}
            />
          )}
        </div>
      </motion.article>
    </div>
  )
}
