// src/lib/orders.js
import { supabase } from './supabase'

/**
 * Place an order and save it to Supabase.
 * @param {{ product_id, product_name, price, size, customer_name, customer_phone, utr_number }} order
 */
export async function placeOrder(order) {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      product_id: order.product_id,
      product_name: order.product_name,
      price: order.price,
      size: order.size,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      utr_number: order.utr_number,
      payment_method: order.payment_method || 'upi',
      delivery_address: order.delivery_address || null,
      advance_paid: order.advance_paid || order.price,
      status: 'payment_submitted',
      created_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch all orders for admin view.
 */
export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Update order status (e.g. confirmed / cancelled).
 */
export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
