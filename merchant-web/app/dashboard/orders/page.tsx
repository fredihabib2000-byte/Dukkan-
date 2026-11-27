'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { NewOrderToast } from '@/components/NewOrderToast';
import {
  type Order, type OrderStatus, STATUS_COLOR, STATUS_LABEL, STATUS_NEXT,
  ORDER_STATUS_LABEL,
} from '@/lib/types';

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'delivering', label: 'Delivering' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const { store } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<OrderStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [newOrder, setNewOrder] = useState<any | null>(null);

  useRealtimeOrders({
    storeId: store?.id,
    onNewOrder: (order) => { setNewOrder(order); fetchOrders(); },
    onStatusChange: (order) => {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: order.status } : o));
    },
  });

  const fetchOrders = async () => {
    if (!store) return;
    let q = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });
    if (tab !== 'all') q = q.eq('status', tab);
    const { data } = await q;
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [store, tab]);

  const PUSH_MESSAGES: Partial<Record<OrderStatus, { title: string; body: string }>> = {
    confirmed:  { title: '✅ Order Confirmed!',   body: 'Your order has been confirmed and will be prepared shortly.' },
    preparing:  { title: '👨‍🍳 Being Prepared',    body: 'The store is now preparing your order.' },
    delivering: { title: '🚴 On the Way!',         body: 'Your order is out for delivery. Hang tight!' },
    delivered:  { title: '📦 Order Delivered!',    body: 'Your order has arrived. Enjoy!' },
  };

  const advanceStatus = async (order: Order) => {
    const next = STATUS_NEXT[order.status];
    if (!next) return;
    setUpdating(order.id);
    await supabase.from('orders').update({ status: next }).eq('id', order.id);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));

    // Award loyalty points when delivered
    if (next === 'delivered') {
      supabase.rpc('award_order_points', { p_order_id: order.id }).catch(() => {});
    }

    // Send push notification to customer
    try {
      const { data: token } = await supabase.rpc('get_push_token_for_order', { p_order_id: order.id });
      const msg = PUSH_MESSAGES[next];
      if (token && msg) {
        fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ to: token, title: msg.title, body: msg.body, sound: 'default', priority: 'high' }),
        }).catch(() => {});
      }
    } catch (_) {}

    setUpdating(null);
  };

  const cancelOrder = async (order: Order) => {
    if (!confirm('Cancel this order?')) return;
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
  };

  return (
    <div className="p-8">
      <NewOrderToast order={newOrder} onDismiss={() => setNewOrder(null)} />
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 py-12 text-center">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center text-gray-400 border border-gray-100">
          No orders in this category
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => <OrderCard key={order.id} order={order} onAdvance={advanceStatus} onCancel={cancelOrder} updating={updating === order.id} />)}
        </div>
      )}
    </div>
  );
}

function cleanNote(note: string | null) {
  if (!note) return null;
  return note.replace(/^\[write(?:,\s*)?]?\s*/i, '').replace(/\[write(?:,\s*)?]/gi, '').trim() || null;
}

function OrderCard({ order, onAdvance, onCancel, updating }: {
  order: Order;
  onAdvance: (o: Order) => void;
  onCancel: (o: Order) => void;
  updating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const nextStatus = STATUS_NEXT[order.status];
  const date = new Date(order.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const mapsUrl = order.delivery_lat && order.delivery_lng
    ? `https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`
    : order.delivery_address
      ? `https://www.google.com/maps/search/${encodeURIComponent(order.delivery_address)}`
      : null;

  const whatsappMsg = encodeURIComponent(
    `🚴 Delivery for ${order.customer_name ?? 'customer'}\n📍 Address: ${order.delivery_address ?? ''}${order.delivery_lat ? `\n🗺️ Maps: https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}` : ''}\n📞 Customer: ${order.customer_phone ?? ''}`
  );

  const note = cleanNote(order.notes);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[order.status]}`}>
              {STATUS_LABEL[order.status]}
            </span>
            <span className="text-xs text-gray-400">{date}</span>
          </div>
          <p className="font-bold text-gray-900 mt-2">{order.customer_name ?? 'Guest'}</p>
          {order.customer_phone && (
            <p className="text-sm text-gray-500">📞 {order.customer_phone}</p>
          )}
          {/* Location row */}
          {(order.delivery_address || mapsUrl) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  📍 {order.delivery_address || 'View on Maps'}
                </a>
              ) : (
                <p className="text-sm text-gray-500">📍 {order.delivery_address}</p>
              )}
              <a href={`https://api.whatsapp.com/send?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition">
                <span>📲</span> Send to driver
              </a>
            </div>
          )}
          {note && <p className="text-sm text-amber-600 mt-1 bg-amber-50 px-3 py-1 rounded-lg">💬 {note}</p>}
        </div>

        {/* Right: total + actions */}
        <div className="flex flex-col items-end gap-3">
          <p className="text-2xl font-extrabold text-gray-900">${Number(order.total).toFixed(2)}</p>
          <div className="flex gap-2">
            <button onClick={() => setExpanded(!expanded)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
            >
              {expanded ? 'Hide' : `${order.order_items?.length ?? 0} items`}
            </button>
            {nextStatus && (
              <button onClick={() => onAdvance(order)} disabled={updating}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition"
              >
                {updating ? '…' : `Mark ${STATUS_LABEL[nextStatus]}`}
              </button>
            )}
            {order.status === 'pending' && (
              <button onClick={() => onCancel(order)}
                className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Order items */}
      {expanded && order.order_items && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-400 uppercase font-semibold">
              <tr>
                <th className="text-left pb-2">Item</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-right pb-2">Price</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.order_items.map(item => (
                <tr key={item.id}>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">🛍️</div>
                      )}
                      <span className="font-medium text-gray-800">{item.product_name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-gray-500">× {item.quantity}</td>
                  <td className="py-2 text-right text-gray-500">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-2 text-right font-bold">${Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end gap-6 mt-3 pt-3 border-t border-gray-200 text-sm">
            <span className="text-gray-500">Delivery: <strong>${Number(order.delivery_fee).toFixed(2)}</strong></span>
            <span className="font-extrabold text-gray-900">Total: ${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
