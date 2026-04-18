// src/components/PaymentModal.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { placeOrder } from '../lib/orders'
import { formatPrice } from '../lib/whatsapp'

// ── ENV config ────────────────────────────────────────────────
const UPI_ID   = import.meta.env.VITE_UPI_ID   || 'yourname@upi'
const UPI_NAME = import.meta.env.VITE_UPI_NAME || 'Clothix'
const UPI_QR_URL = import.meta.env.VITE_UPI_QR_URL || null

const BANK_NAME    = import.meta.env.VITE_BANK_NAME    || 'State Bank of India'
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT || '000000000000'
const BANK_IFSC    = import.meta.env.VITE_BANK_IFSC    || 'SBIN0000000'
const BANK_HOLDER  = import.meta.env.VITE_BANK_HOLDER  || 'Clothix'

const COD_ADVANCE  = Number(import.meta.env.VITE_COD_ADVANCE || 45)

// ── Step dot indicator ────────────────────────────────────────
function StepDot({ active, done }) {
  return (
    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
      done ? 'bg-[#c9a96e]' : active ? 'bg-stone-900 scale-125' : 'bg-stone-200'
    }`} />
  )
}

// ── Copy field helper ─────────────────────────────────────────
function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="flex items-stretch border border-stone-200 overflow-hidden">
      <div className="flex-1 px-4 py-2.5 bg-stone-50">
        <p className="text-[9px] tracking-[0.2em] uppercase text-stone-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-stone-900 tracking-wide font-mono">{value}</p>
      </div>
      <button
        onClick={copy}
        className="px-4 bg-stone-900 text-white text-[10px] tracking-[0.15em] uppercase hover:bg-[#c9a96e] transition-colors flex-shrink-0"
      >
        {copied ? '✓' : 'Copy'}
      </button>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────
export default function PaymentModal({ product, selectedSize, onClose }) {
  /**
   * Steps:
   *  0 = customer details (name + phone)
   *  1 = method select (UPI / Bank / COD)
   *  2 = payment instructions (UPI or Bank details)
   *  3 = UTR entry
   *  4 = address (COD only)
   *  5 = success
   */
  const [step, setStep]           = useState(0)
  const [method, setMethod]       = useState(null) // 'upi' | 'bank' | 'cod'
  const [form, setForm]           = useState({ name: '', phone: '' })
  const [address, setAddress]     = useState({ line1: '', line2: '', city: '', state: '', pincode: '' })
  const [utr, setUtr]             = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [orderId, setOrderId]     = useState(null)

  const amount    = product.price
  const codAmount = COD_ADVANCE // ₹45 advance for COD

  // For COD the UPI link charges only the advance amount
  const payAmount = method === 'cod' ? codAmount : amount
  const upiLink   = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${payAmount}&cu=INR&tn=${encodeURIComponent(
    method === 'cod' ? `Clothix COD Advance: ${product.name}` : `Clothix: ${product.name}`
  )}`

  // ── handlers ─────────────────────────────────────────────
  const handleDetailsNext = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Please enter your name.')
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) return setError('Enter a valid 10-digit mobile number.')
    setStep(1)
  }

  const handleMethodSelect = (m) => {
    setMethod(m)
    setStep(2)
  }

  const handleUtrNext = (e) => {
    e.preventDefault()
    setError('')
    const clean = utr.trim().toUpperCase()
    if (clean.length < 6) return setError('Please enter a valid UTR / Reference Number.')
    // COD goes to address step, others go straight to submit
    if (method === 'cod') {
      setUtr(clean)
      setStep(4) // address step
    } else {
      submitOrder(clean)
    }
  }

  const handleAddressNext = (e) => {
    e.preventDefault()
    setError('')
    if (!address.line1.trim()) return setError('Please enter your street address.')
    if (!address.city.trim()) return setError('Please enter your city.')
    if (!address.state.trim()) return setError('Please enter your state.')
    if (!/^\d{6}$/.test(address.pincode.trim())) return setError('Enter a valid 6-digit PIN code.')
    submitOrder(utr)
  }

  const submitOrder = async (utrValue) => {
    setError('')
    setSubmitting(true)
    try {
      const deliveryAddress = method === 'cod'
        ? `${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} - ${address.pincode}`
        : null

      const order = await placeOrder({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        size: selectedSize,
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        utr_number: utrValue,
        payment_method: method,
        delivery_address: deliveryAddress,
        advance_paid: method === 'cod' ? codAmount : product.price,
      })
      setOrderId(order.id)
      setStep(5)
    } catch (err) {
      setError('Failed to save order. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // ── animation variants ────────────────────────────────────
  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
  const modalVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
    exit: { opacity: 0, y: 20, scale: 0.96 },
  }

  const methodLabel = method === 'bank' ? 'Bank Transfer' : method === 'cod' ? 'Cash on Delivery' : 'UPI'
  const methodBadgeClass = method === 'bank'
    ? 'bg-blue-50 text-blue-600 border-blue-100'
    : method === 'cod'
    ? 'bg-orange-50 text-orange-600 border-orange-100'
    : 'bg-emerald-50 text-emerald-700 border-emerald-100'

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        variants={backdropVariants}
        initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(28,24,20,0.72)', backdropFilter: 'blur(6px)' }}
      >
        <motion.div
          key="modal"
          variants={modalVariants}
          initial="hidden" animate="visible" exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* ── Header ── */}
          <div className="bg-stone-900 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
            <div>
              <p className="text-[9px] tracking-[0.35em] uppercase text-[#c9a96e] mb-1">Clothix</p>
              <h2 className="text-white text-base font-semibold tracking-wide">Secure Checkout</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* ── Order Summary Bar ── */}
          <div className="bg-[#faf9f7] border-b border-stone-100 px-6 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-800 font-semibold tracking-wide">{product.name}</p>
              <p className="text-[10px] text-stone-400 mt-0.5 tracking-widest uppercase">Size: {selectedSize}</p>
            </div>
            <div className="text-right">
              <p className="text-[#c9a96e] font-bold text-base tracking-wide">{formatPrice(amount)}</p>
              {method === 'cod' && (
                <p className="text-[10px] text-orange-500 tracking-wide">+₹{codAmount} advance</p>
              )}
            </div>
          </div>

          {/* ── Step dots ── */}
          {step < 5 && (
            <div className="flex items-center justify-center gap-2 py-4 bg-white border-b border-stone-50">
              {(method === 'cod' ? [0,1,2,3,4] : [0,1,2,3]).map((s, i) => (
                <StepDot key={i}
                  active={step === s}
                  done={step > s}
                />
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 0 — Customer Details
          ══════════════════════════════════════════ */}
          {step === 0 && (
            <form onSubmit={handleDetailsNext} className="px-6 py-6 space-y-5">
              <p className="text-xs tracking-[0.2em] uppercase text-stone-500 font-semibold">Your Details</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-[#c9a96e] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1.5">Mobile Number</label>
                  <div className="flex">
                    <span className="border border-r-0 border-stone-200 px-3 py-3 text-sm text-stone-400 bg-stone-50">+91</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="9876543210"
                      className="flex-1 border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </div>
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" className="w-full py-3.5 bg-stone-900 text-white text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#c9a96e] transition-all duration-300">
                Continue to Payment
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════════
              STEP 1 — Choose Payment Method
          ══════════════════════════════════════════ */}
          {step === 1 && (
            <div className="px-6 py-6 space-y-3">
              <p className="text-xs tracking-[0.2em] uppercase text-stone-500 font-semibold">Choose Payment Method</p>

              {/* UPI */}
              <button
                onClick={() => handleMethodSelect('upi')}
                className="w-full flex items-center gap-4 border-2 border-stone-100 hover:border-[#c9a96e] px-5 py-4 transition-all duration-200 group text-left"
              >
                <div className="w-11 h-11 bg-[#097939]/10 flex items-center justify-center flex-shrink-0 rounded">
                  <svg viewBox="0 0 40 16" className="w-10 h-5" fill="none">
                    <text x="0" y="13" fill="#097939" fontSize="14" fontWeight="bold" fontFamily="Arial">UPI</text>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900 group-hover:text-[#c9a96e] transition-colors">UPI / QR Code</p>
                  <p className="text-xs text-stone-400 mt-0.5">GPay · PhonePe · Paytm · BHIM</p>
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-stone-300 group-hover:text-[#c9a96e] transition-colors fill-none stroke-current" strokeWidth={2}>
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Bank Transfer */}
              <button
                onClick={() => handleMethodSelect('bank')}
                className="w-full flex items-center gap-4 border-2 border-stone-100 hover:border-[#c9a96e] px-5 py-4 transition-all duration-200 group text-left"
              >
                <div className="w-11 h-11 bg-blue-50 flex items-center justify-center flex-shrink-0 rounded">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-blue-600">
                    <path d="M2 10.5V21h4v-7h4v7h4v-7h4v7h4V10.5L12 3z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900 group-hover:text-[#c9a96e] transition-colors">Bank Transfer</p>
                  <p className="text-xs text-stone-400 mt-0.5">NEFT · IMPS · RTGS · Net Banking</p>
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-stone-300 group-hover:text-[#c9a96e] transition-colors fill-none stroke-current" strokeWidth={2}>
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Cash on Delivery */}
              <button
                onClick={() => handleMethodSelect('cod')}
                className="w-full flex items-center gap-4 border-2 border-stone-100 hover:border-orange-400 px-5 py-4 transition-all duration-200 group text-left"
              >
                <div className="w-11 h-11 bg-orange-50 flex items-center justify-center flex-shrink-0 rounded">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-orange-500">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900 group-hover:text-orange-500 transition-colors">Cash on Delivery</p>
                  <p className="text-xs text-stone-400 mt-0.5">Pay ₹{codAmount} advance now · Rest on delivery</p>
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-stone-300 group-hover:text-orange-400 transition-colors fill-none stroke-current" strokeWidth={2}>
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button onClick={() => setStep(0)} className="w-full text-[10px] tracking-[0.15em] uppercase text-stone-400 hover:text-stone-600 pt-2 transition-colors">
                ← Back
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 2a — UPI Payment
          ══════════════════════════════════════════ */}
          {step === 2 && method === 'upi' && (
            <div className="px-6 py-6 space-y-4">
              <p className="text-xs tracking-[0.2em] uppercase text-stone-500 font-semibold">Pay via UPI</p>
              <div className="flex flex-col items-center gap-3">
                <div className="border-2 border-stone-100 p-3 bg-white">
                  {UPI_QR_URL ? (
                    <img src={UPI_QR_URL} alt="UPI QR" className="w-44 h-44 object-contain" />
                  ) : (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff&color=1c1814&margin=4`}
                      alt="UPI QR Code" className="w-44 h-44 object-contain"
                    />
                  )}
                </div>
                <p className="text-[10px] text-stone-400 tracking-widest uppercase">Scan with GPay · PhonePe · Paytm</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-stone-100" />
                <span className="text-[10px] tracking-[0.2em] uppercase text-stone-300">or use UPI ID</span>
                <div className="flex-1 h-px bg-stone-100" />
              </div>
              <CopyField label="UPI ID" value={UPI_ID} />
              <div className="bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 flex-shrink-0 fill-current mt-0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                <p className="text-xs text-amber-700">Pay exactly <strong>{formatPrice(amount)}</strong> and note down your UTR number.</p>
              </div>
              <a href={upiLink} className="w-full py-3 border border-stone-200 text-stone-700 text-xs tracking-[0.15em] uppercase font-semibold flex items-center justify-center gap-2 hover:border-stone-400 transition-colors">
                Open UPI App
              </a>
              <button onClick={() => setStep(3)} className="w-full py-3.5 bg-stone-900 text-white text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#c9a96e] transition-all duration-300">
                I've Paid — Enter UTR
              </button>
              <button onClick={() => setStep(1)} className="w-full text-[10px] tracking-[0.15em] uppercase text-stone-400 hover:text-stone-600 pt-1 transition-colors">← Back</button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 2b — Bank Transfer
          ══════════════════════════════════════════ */}
          {step === 2 && method === 'bank' && (
            <div className="px-6 py-6 space-y-4">
              <p className="text-xs tracking-[0.2em] uppercase text-stone-500 font-semibold">Bank Transfer Details</p>
              <div className="bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-500 fill-current flex-shrink-0 mt-0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                <p className="text-xs text-blue-700">Transfer exactly <strong>{formatPrice(amount)}</strong> to the account below using NEFT / IMPS / RTGS.</p>
              </div>
              <div className="space-y-2">
                <CopyField label="Account Holder Name" value={BANK_HOLDER} />
                <CopyField label="Account Number" value={BANK_ACCOUNT} />
                <CopyField label="IFSC Code" value={BANK_IFSC} />
                <div className="border border-stone-200 px-4 py-2.5 bg-stone-50">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-stone-400 mb-0.5">Bank Name</p>
                  <p className="text-sm font-semibold text-stone-900">{BANK_NAME}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 flex-shrink-0 fill-current mt-0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                <p className="text-xs text-amber-700">After transfer, find your <strong>UTR / Reference Number</strong> in transaction history and enter it below.</p>
              </div>
              <button onClick={() => setStep(3)} className="w-full py-3.5 bg-stone-900 text-white text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#c9a96e] transition-all duration-300">
                I've Transferred — Enter UTR
              </button>
              <button onClick={() => setStep(1)} className="w-full text-[10px] tracking-[0.15em] uppercase text-stone-400 hover:text-stone-600 pt-1 transition-colors">← Back</button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 2c — COD Advance Payment
          ══════════════════════════════════════════ */}
          {step === 2 && method === 'cod' && (
            <div className="px-6 py-6 space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-xs tracking-[0.2em] uppercase text-stone-500 font-semibold">Pay ₹{codAmount} Advance</p>
                <span className="text-[9px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 uppercase tracking-widest font-semibold">COD</span>
              </div>

              {/* Why advance banner */}
              <div className="bg-orange-50 border border-orange-200 px-4 py-3 rounded-sm">
                <p className="text-xs font-semibold text-orange-700 mb-1">Why ₹{codAmount} advance?</p>
                <p className="text-xs text-orange-600 leading-relaxed">
                  A small advance is required to confirm your Cash on Delivery booking. You'll pay the remaining <strong>{formatPrice(amount - codAmount > 0 ? amount - codAmount : amount)}</strong> when your order arrives.
                </p>
              </div>

              {/* QR for advance */}
              <div className="flex flex-col items-center gap-3">
                <div className="border-2 border-stone-100 p-3 bg-white">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff&color=1c1814&margin=4`}
                    alt="UPI QR Code" className="w-44 h-44 object-contain"
                  />
                </div>
                <p className="text-[10px] text-stone-400 tracking-widest uppercase">Scan to pay ₹{codAmount} advance</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-stone-100" />
                <span className="text-[10px] tracking-[0.2em] uppercase text-stone-300">or use UPI ID</span>
                <div className="flex-1 h-px bg-stone-100" />
              </div>

              <CopyField label={`UPI ID (Pay ₹${codAmount})`} value={UPI_ID} />

              <div className="bg-stone-50 border border-stone-100 px-4 py-3 flex items-start gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-stone-400 flex-shrink-0 fill-current mt-0.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                <p className="text-xs text-stone-500 leading-relaxed">After paying, note your <strong>UTR number</strong> from your UPI app. You'll enter it in the next step along with your delivery address.</p>
              </div>

              <a href={upiLink} className="w-full py-3 border border-stone-200 text-stone-700 text-xs tracking-[0.15em] uppercase font-semibold flex items-center justify-center gap-2 hover:border-stone-400 transition-colors">
                Open UPI App — Pay ₹{codAmount}
              </a>
              <button onClick={() => setStep(3)} className="w-full py-3.5 bg-orange-500 text-white text-xs tracking-[0.2em] uppercase font-semibold hover:bg-orange-600 transition-all duration-300">
                I've Paid — Enter UTR
              </button>
              <button onClick={() => setStep(1)} className="w-full text-[10px] tracking-[0.15em] uppercase text-stone-400 hover:text-stone-600 pt-1 transition-colors">← Back</button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 3 — Enter UTR / Reference Number
          ══════════════════════════════════════════ */}
          {step === 3 && (
            <form onSubmit={handleUtrNext} className="px-6 py-6 space-y-5">
              <div className="flex items-center gap-2">
                <p className="text-xs tracking-[0.2em] uppercase text-stone-500 font-semibold">
                  {method === 'cod' ? 'Advance Payment UTR' : 'Confirm Payment'}
                </p>
                <span className={`text-[9px] px-2 py-0.5 font-semibold tracking-widest uppercase border ${methodBadgeClass}`}>
                  {methodLabel}
                </span>
              </div>

              <div className="bg-stone-50 border border-stone-100 px-4 py-3 space-y-1">
                <p className="text-[9px] tracking-[0.2em] uppercase text-stone-400">Where to find UTR?</p>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Open your {method === 'bank' ? 'bank' : 'UPI'} app → Transaction History → Tap this payment → Copy the <strong>UTR / Reference Number</strong>.
                </p>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1.5">
                  UTR / Transaction Reference Number
                </label>
                <input
                  type="text"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\s/g, '').toUpperCase())}
                  placeholder={method === 'bank' ? 'e.g. SBIN423812763419' : 'e.g. 423812763419'}
                  maxLength={30}
                  className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-[#c9a96e] transition-colors font-mono tracking-wider"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={submitting && method !== 'cod'}
                className={`w-full py-3.5 text-white text-xs tracking-[0.2em] uppercase font-semibold transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 ${method === 'cod' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#c9a96e] hover:bg-stone-900'}`}
              >
                {method === 'cod' ? 'Next — Enter Address →' : (submitting ? 'Saving…' : 'Confirm & Place Order')}
              </button>

              <button onClick={() => setStep(2)} className="w-full text-[10px] tracking-[0.15em] uppercase text-stone-400 hover:text-stone-600 pt-1 transition-colors">
                ← Back to Payment
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════════
              STEP 4 — Delivery Address (COD only)
          ══════════════════════════════════════════ */}
          {step === 4 && method === 'cod' && (
            <form onSubmit={handleAddressNext} className="px-6 py-6 space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-xs tracking-[0.2em] uppercase text-stone-500 font-semibold">Delivery Address</p>
                <span className="text-[9px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 uppercase tracking-widest font-semibold">COD</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1.5">House / Flat / Street *</label>
                  <input
                    type="text"
                    value={address.line1}
                    onChange={(e) => setAddress(a => ({ ...a, line1: e.target.value }))}
                    placeholder="e.g. 12, MG Road, Sector 5"
                    className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-[#c9a96e] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1.5">Landmark / Area (optional)</label>
                  <input
                    type="text"
                    value={address.line2}
                    onChange={(e) => setAddress(a => ({ ...a, line2: e.target.value }))}
                    placeholder="e.g. Near City Mall"
                    className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-[#c9a96e] transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1.5">City *</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress(a => ({ ...a, city: e.target.value }))}
                      placeholder="Delhi"
                      className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1.5">State *</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress(a => ({ ...a, state: e.target.value }))}
                      placeholder="Delhi"
                      className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mb-1.5">PIN Code *</label>
                  <input
                    type="text"
                    value={address.pincode}
                    onChange={(e) => setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="110001"
                    className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-[#c9a96e] transition-colors font-mono tracking-wider"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-orange-500 text-white text-xs tracking-[0.2em] uppercase font-semibold hover:bg-orange-600 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                    </svg>
                    Booking Order…
                  </>
                ) : 'Confirm Booking →'}
              </button>

              <button onClick={() => setStep(3)} className="w-full text-[10px] tracking-[0.15em] uppercase text-stone-400 hover:text-stone-600 pt-1 transition-colors">
                ← Back
              </button>
            </form>
          )}

          {/* ══════════════════════════════════════════
              STEP 5 — Success
          ══════════════════════════════════════════ */}
          {step === 5 && (
            <div className="px-6 py-8 text-center space-y-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${method === 'cod' ? 'bg-orange-50' : 'bg-[#c9a96e]/10'}`}
              >
                <svg viewBox="0 0 24 24" className={`w-8 h-8 ${method === 'cod' ? 'text-orange-500' : 'text-[#c9a96e]'}`} fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>

              <div>
                <h3 className="text-stone-900 font-semibold text-lg tracking-wide">
                  {method === 'cod' ? 'Booking Confirmed!' : 'Order Placed!'}
                </h3>
                <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">
                  Thank you, <strong>{form.name}</strong>! Your order for <strong>{product.name}</strong> (Size: {selectedSize}) has been received.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-100 px-4 py-3 text-left space-y-2.5 text-xs">
                {[
                  ['Order ID', orderId?.slice(0, 8).toUpperCase()],
                  ['Method', methodLabel],
                  ...(method === 'cod' ? [['Advance Paid', `₹${codAmount}`], ['Balance on Delivery', formatPrice(amount)]] : [['Amount', formatPrice(amount)]]),
                  ['UTR / Ref', utr],
                  ...(method === 'cod' ? [['Ship To', `${address.city}, ${address.pincode}`]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center gap-4">
                    <span className="text-stone-400 uppercase tracking-wider text-[10px] flex-shrink-0">{k}</span>
                    <span className="font-mono text-stone-700 text-right text-xs">{v}</span>
                  </div>
                ))}
              </div>

              <div className={`border px-4 py-3 ${method === 'cod' ? 'bg-orange-50 border-orange-100' : 'bg-amber-50 border-amber-100'}`}>
                <p className={`text-xs leading-relaxed ${method === 'cod' ? 'text-orange-700' : 'text-amber-700'}`}>
                  {method === 'cod'
                    ? <>We'll verify your advance and <strong>book your order within 2–4 hours</strong>. You'll be contacted on <strong>+91 {form.phone}</strong> to confirm the delivery date.</>
                    : <>We'll verify your payment and confirm within <strong>2–4 hours</strong>. You'll be contacted on <strong>+91 {form.phone}</strong>.</>
                  }
                </p>
              </div>

              <button onClick={onClose} className="w-full py-3.5 bg-stone-900 text-white text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#c9a96e] transition-all duration-300">
                Continue Shopping
              </button>

              <div className="pt-2 border-t border-stone-100 flex flex-col items-center gap-1.5">
                <p className="text-[10px] text-stone-400 font-medium tracking-widest uppercase">2 Days Return Policy</p>
                <p className="text-[10px] text-stone-400">Contact <strong>+91 7056621151</strong> for any issues</p>
              </div>
            </div>
          )}

          {/* ── Modal Footer (visible on steps 0-4) ── */}
          {step < 5 && (
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex flex-col items-center gap-1">
              <p className="text-[9px] text-stone-400 font-semibold tracking-[0.2em] uppercase">2 Days Return Policy</p>
              <p className="text-[9px] text-stone-400 tracking-wider">Support: +91 7056621151</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
