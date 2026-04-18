// src/components/ProductCard.jsx
import { useState, useRef } from 'react'
import { handleBuyNow, formatPrice } from '../lib/whatsapp'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function ProductCard({ product }) {
  const [selectedSize, setSelectedSize] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBuyNow(product, selectedSize)}
              className="mt-auto w-full py-3.5 bg-stone-900 text-white text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#c9a96e] flex items-center justify-center gap-2.5 font-semibold"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Order on WhatsApp
            </motion.button>
          )}
        </div>
      </motion.article>
    </div>
  )
}
