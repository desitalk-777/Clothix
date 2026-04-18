// src/components/ProductForm.jsx
import { useState, useRef } from 'react'
import { uploadImage } from '../lib/supabase'

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const EMPTY = { name: '', description: '', price: '', sizes: [], stock_status: 'in_stock', image_url: '' }

export default function ProductForm({ initial = null, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    ...initial,
    price: String(initial.price),
    sizes: initial.sizes || [],
  } : EMPTY)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(initial?.image_url || null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleSize = (s) => {
    set('sizes', form.sizes.includes(s)
      ? form.sizes.filter(x => x !== s)
      : [...form.sizes, s])
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }
    setUploading(true)
    setError(null)
    try {
      setPreview(URL.createObjectURL(file))
      const url = await uploadImage(file)
      set('image_url', url)
    } catch (err) {
      setError('Image upload failed: ' + err.message)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Product name is required.'); return }
    if (!form.price || isNaN(Number(form.price))) { setError('Valid price is required.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({ ...form, price: parseFloat(form.price) })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="text-sm tracking-[0.2em] uppercase text-stone-900 font-medium">
            {initial ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2">{error}</p>
          )}

          {/* Image upload */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-2">Product Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative aspect-[3/2] bg-stone-50 border-2 border-dashed border-stone-200 cursor-pointer hover:border-stone-400 transition-colors overflow-hidden flex items-center justify-center"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto text-stone-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-stone-400 tracking-wide">Click to upload image</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-xs tracking-widest uppercase text-stone-500 animate-pulse">Uploading…</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">Name *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Silk Noir Blazer"
              className="w-full border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="A brief, luxurious description…"
              className="w-full border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-colors resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">Price (₹) *</label>
            <input
              type="number"
              value={form.price}
              onChange={e => set('price', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full border border-stone-200 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-colors"
            />
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-2">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`w-10 h-10 text-xs border transition-all duration-200 tracking-wide
                    ${form.sizes.includes(s)
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stock status */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">Stock Status</label>
            <select
              value={form.stock_status}
              onChange={e => set('stock_status', e.target.value)}
              className="w-full border border-stone-200 px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors bg-white"
            >
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-stone-200 text-xs tracking-[0.15em] uppercase text-stone-600 hover:border-stone-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex-1 py-3 bg-stone-900 text-white text-xs tracking-[0.15em] uppercase hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}
