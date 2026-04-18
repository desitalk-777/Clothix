// src/pages/Admin.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { fetchProducts, createProduct, updateProduct, deleteProduct, deleteImage } from '../lib/supabase'
import ProductForm from '../components/ProductForm'
import { formatPrice } from '../lib/whatsapp'

const STOCK_BADGE = {
  in_stock: 'bg-emerald-50 text-emerald-700',
  low_stock: 'bg-amber-50 text-amber-700',
  out_of_stock: 'bg-red-50 text-red-700',
}
const STOCK_LABEL = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' }

export default function Admin() {
  const { user, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (user) load()
  }, [user])

  const load = () => {
    setLoading(true)
    fetchProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleSave = async (data) => {
    if (editing) {
      const updated = await updateProduct(editing.id, data)
      setProducts(ps => ps.map(p => p.id === updated.id ? updated : p))
    } else {
      const created = await createProduct(data)
      setProducts(ps => [created, ...ps])
    }
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeleting(product.id)
    try {
      await deleteProduct(product.id)
      if (product.image_url) await deleteImage(product.image_url).catch(() => {})
      setProducts(ps => ps.filter(p => p.id !== product.id))
    } catch (err) {
      alert('Delete failed: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Clothix" className="h-8 w-auto object-contain" />
              <div className="hidden sm:block">
                <span className="text-lg tracking-[0.2em] uppercase font-medium text-stone-900">Clothix</span>
              </div>
            </Link>
            <span className="text-[9px] tracking-[0.3em] uppercase text-stone-400 bg-stone-50 border border-stone-100 px-2.5 py-1">Admin</span>
          </div>
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="text-[10px] tracking-[0.2em] uppercase text-stone-400 hover:text-stone-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            ['Total Products', products.length],
            ['In Stock', products.filter(p => p.stock_status === 'in_stock').length],
            ['Out of Stock', products.filter(p => p.stock_status === 'out_of_stock').length],
          ].map(([label, val]) => (
            <div key={label} className="bg-white border border-stone-100 px-5 py-4">
              <p className="text-[9px] tracking-[0.3em] uppercase text-stone-400">{label}</p>
              <p className="text-2xl font-light text-stone-900 mt-1">{val}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm tracking-[0.2em] uppercase text-stone-600 font-medium">Products</h2>
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-stone-900 text-white text-xs tracking-[0.15em] uppercase px-4 py-2.5 hover:bg-stone-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-stone-100 animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-stone-100 py-16 text-center">
            <p className="text-sm text-stone-400 tracking-widest uppercase">No products yet</p>
            <p className="text-xs text-stone-300 mt-1">Click "Add Product" to get started</p>
          </div>
        ) : (
          <div className="bg-white border border-stone-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-stone-400 font-medium">Product</th>
                  <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-stone-400 font-medium hidden md:table-cell">Price</th>
                  <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-stone-400 font-medium hidden md:table-cell">Sizes</th>
                  <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-stone-400 font-medium">Status</th>
                  <th className="px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-stone-400 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} loading="lazy" className="w-10 h-12 object-cover object-center flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-12 bg-stone-100 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-stone-900 font-light text-sm">{p.name}</p>
                          {p.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-stone-700 hidden md:table-cell">{formatPrice(p.price)}</td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(p.sizes || []).map(s => (
                          <span key={s} className="text-[9px] border border-stone-200 px-1.5 py-0.5 text-stone-500">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[9px] tracking-[0.2em] uppercase px-2 py-1 ${STOCK_BADGE[p.stock_status]}`}>
                        {STOCK_LABEL[p.stock_status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => { setEditing(p); setShowForm(true) }}
                          className="text-[10px] tracking-[0.15em] uppercase text-stone-500 hover:text-stone-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleting === p.id}
                          className="text-[10px] tracking-[0.15em] uppercase text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {deleting === p.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showForm && (
        <ProductForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
