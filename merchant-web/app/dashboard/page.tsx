'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import { ORDER_STATUS_LABEL, STATUS_COLOR, type Order } from '@/lib/types';

type Stats = { orders: number; revenue: number; products: number; pending: number };

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="text-2xl mb-3">{icon}</div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { store } = useStore();
  const [stats, setStats] = useState<Stats>({ orders: 0, revenue: 0, products: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;
    const load = async () => {
      const [ordersRes, productsRes, pendingRes, recentRes] = await Promise.all([
        supabase.from('orders').select('total').eq('store_id', store.id).eq('status', 'delivered'),
        supabase.from('products').select('id', { count: 'exact' }).eq('store_id', store.id),
        supabase.from('orders').select('id', { count: 'exact' }).eq('store_id', store.id).eq('status', 'pending'),
        supabase.from('orders')
          .select('*, profiles(full_name, phone), order_items(*)')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const revenue = (ordersRes.data ?? []).reduce((s, o) => s + Number(o.total), 0);
      setStats({
        orders: ordersRes.data?.length ?? 0,
        revenue,
        products: productsRes.count ?? 0,
        pending: pendingRes.count ?? 0,
      });
      setRecentOrders((recentRes.data ?? []) as Order[]);
      setLoading(false);
    };
    load();
  }, [store]);

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back, {store?.name ?? 'store owner'} 👋</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📦" label="Orders Delivered" value={stats.orders} />
        <StatCard icon="💰" label="Total Revenue" value={`$${stats.revenue.toFixed(2)}`} />
        <StatCard icon="🏷️" label="Products" value={stats.products} />
        <StatCard icon="⏳" label="Pending Orders" value={stats.pending} sub="Need action" />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <a href="/dashboard/orders" className="text-brand-600 text-sm font-semibold hover:underline">View all →</a>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No orders yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {(order.profiles as any)?.full_name ?? 'Customer'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{order.order_items?.length ?? 0} items</td>
                  <td className="px-6 py-4 font-bold">${Number(order.total).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
