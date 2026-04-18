// src/lib/whatsapp.js

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER // e.g. "919876543210"

/**
 * Opens WhatsApp with a pre-filled order message.
 * @param {{ name: string, price: number }} product
 * @param {string} selectedSize
 */
export function handleBuyNow(product, selectedSize) {
  if (!selectedSize) {
    alert('Please select a size before ordering.')
    return
  }

  const message = `Hi Clothix! I'd like to order: *${product.name}* in size *${selectedSize}*. Price: *₹${product.price.toLocaleString('en-IN')}*. Please confirm availability. 🛍️`

  const encoded = encodeURIComponent(message)
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`

  window.open(url, '_blank', 'noopener,noreferrer')
}

// ─── FORMATTERS ────────────────────────────────────────────

export function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}
