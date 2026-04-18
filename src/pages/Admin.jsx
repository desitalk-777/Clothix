// src/pages/Admin.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { fetchProducts, createProduct, updateProduct, deleteProduct, deleteImage } from '../lib/supabase'
import { fetchOrders, updateOrderStatus } from '../lib/orders'
import ProductForm from '../components/ProductForm'
import { formatPrice } from '../lib/whatsapp'

const STOCK_BADGE = {
  in_stock: 'bg-emerald-50 text-emerald-700',
  low_stock: 'bg-amber-50 text-amber-700',
  out_of_stock: 'bg-red-50 text-red-700',
}
const STOCK_LABEL = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' }

const ORDER_BADGE = {
  payment_submitted: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
}
const ORDER_LABEL = {
  payment_submitted: 'Pending Verification',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

export default function Admin() {
  const { user, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('products') // 'products' | 'orders'
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [updatingOrder, setUpdatingOrder] = useState(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (user) {
      load()
      loadOrders()
    }
  }, [user])

  const load = () => {
    setLoading(true)
    fetchProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const loadOrders = () => {
    setOrdersLoading(true)
    fetchOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setOrdersLoading(false))
  }

  const handleOrderStatus = async (id, status) => {
    setUpdatingOrder(id)
    try {
      const updated = await updateOrderStatus(id, status)
      setOrders(os => os.map(o => o.id === updated.id ? updated : o))
    } catch (err) {
      alert('Failed to update: ' + err.message)
    } finally {
      setUpdatingOrder(null)
    }
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
            ['Pending Orders', orders.filter(o => o.status === 'payment_submitted').length],
          ].map(([label, val]) => (
            <div key={label} className="bg-white border border-stone-100 px-5 py-4">
              <p className="text-[9px] tracking-[0.3em] uppercase text-stone-400">{label}</p>
              <p className="text-2xl font-light text-stone-900 mt-1">{val}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 mb-6 gap-0">
          {[['products', 'Products'], ['orders', 'Orders']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2.5 text-[10px] tracking-[0.25em] uppercase font-semibold transition-all border-b-2 -mb-px ${
                tab === key
                  ? 'text-stone-900 border-[#c9a96e]'
                  : 'text-stone-400 border-transparent hover:text-stone-600'
              }`}
            >
              {label}
              {key === 'orders' && orders.filter(o => o.status === 'payment_submitted').length > 0 && (
                <span className="ml-2 bg-[#c9a96e] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {orders.filter(o => o.status === 'payment_submitted').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <>
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
        </>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm tracking-[0.2em] uppercase text-stone-600 font-medium">Orders</h2>
              <button onClick={loadOrders} className="text-[10px] tracking-[0.15em] uppercase text-stone-400 hover:text-stone-700 transition-colors">↻ Refresh</button>
            </div>
            {ordersLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-stone-100 animate-pulse" />)}</div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-stone-100 py-16 text-center">
                <p className="text-sm text-stone-400 tracking-widest uppercase">No orders yet</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      {['Customer', 'Product', 'Size', 'Amount', 'Method', 'UTR / Ref No.', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[9px] tracking-[0.3em] uppercase text-stone-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-stone-900 text-sm font-medium">{o.customer_name}</p>
                          <p className="text-xs text-stone-400">+91 {o.customer_phone}</p>
                          {o.delivery_address && (
                            <p className="text-[10px] text-orange-500 mt-0.5 max-w-[140px] leading-tight">{o.delivery_address}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-700 text-sm">{o.product_name}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] border border-stone-200 px-2 py-0.5 text-stone-500">{o.size}</span>
                        </td>
                        <td className="px-4 py-3 text-[#c9a96e] font-semibold whitespace-nowrap">{formatPrice(o.price)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] px-2 py-0.5 font-semibold tracking-widest uppercase border ${
                            o.payment_method === 'bank'
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : o.payment_method === 'cod'
                              ? 'bg-orange-50 text-orange-600 border-orange-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {o.payment_method === 'bank' ? 'Bank' : o.payment_method === 'cod' ? 'COD' : 'UPI'}
                          </span>
                          {o.payment_method === 'cod' && o.advance_paid && (
                            <p className="text-[9px] text-orange-400 mt-0.5">₹{o.advance_paid} paid</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-stone-700 bg-stone-50 border border-stone-100 px-2 py-1">{o.utr_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] px-2 py-1 tracking-[0.15em] uppercase font-semibold ${ORDER_BADGE[o.status]}`}>
                            {ORDER_LABEL[o.status] || o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {o.status === 'payment_submitted' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOrderStatus(o.id, 'confirmed')}
                                disabled={updatingOrder === o.id}
                                className="text-[9px] tracking-[0.15em] uppercase text-emerald-600 hover:text-emerald-800 transition-colors disabled:opacity-50 font-semibold"
                              >
                                Confirm
                              </button>
                              <span className="text-stone-200">|</span>
                              <button
                                onClick={() => handleOrderStatus(o.id, 'cancelled')}
                                disabled={updatingOrder === o.id}
                                className="text-[9px] tracking-[0.15em] uppercase text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          {o.status !== 'payment_submitted' && (
                            <span className="text-[9px] text-stone-300 tracking-widest uppercase">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
