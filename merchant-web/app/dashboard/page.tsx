'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import { ORDER_STATUS_LABEL, STATUS_COLOR, type Order } from '@/lib/types';

function LicenseCard({ expiresAt, activatedAt }: { expiresAt: string | null; activatedAt: string | null }) {
  if (!expiresAt) return null;
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  const activatedStr = activatedAt
    ? new Date(activatedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    : null;
  const expiryStr = new Date(expiresAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

  if (days < 0)
    return (
      <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
        <span className="text-2xl">🔴</span>
        <div>
          <p className="font-bold text-red-700">License expired</p>
          <p className="text-sm text-red-500 mt-0.5">Contact your Dukkan provider to renew.</p>
        </div>
      </div>
    );

  const color = days <= 7 ? 'red' : days <= 30 ? 'orange' : 'green';
  const colorMap = {
    red:    { bg:'bg-red-50',    border:'border-red-200',    text:'text-red-700',    sub:'text-red-500',    bar:'bg-red-500',    pill:'bg-red-100 text-red-700'    },
    orange: { bg:'bg-orange-50', border:'border-orange-200', text:'text-orange-700', sub:'text-orange-500', bar:'bg-orange-500', pill:'bg-orange-100 text-orange-700' },
    green:  { bg:'bg-green-50',  border:'border-green-200',  text:'text-green-800',  sub:'text-green-600',  bar:'bg-green-500',  pill:'bg-green-100 text-green-700'  },
  }[color];

  return (
    <div className={`mb-6 ${colorMap.bg} border ${colorMap.border} rounded-2xl px-5 py-4`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${days <= 7 ? 'animate-pulse' : ''}`}>🔑</span>
          <div>
            <p className={`font-bold ${colorMap.text}`}>
              {days <= 7 ? `⚠️ Expires in ${days} day${days !== 1 ? 's' : ''}!` : `License active — ${days} days remaining`}
            </p>
            <p className={`text-xs ${colorMap.sub} mt-0.5`}>
              {activatedStr && `Activated ${activatedStr} · `}Expires {expiryStr}
            </p>
          </div>
        </div>
        <span className={`text-sm font-black px-3 py-1 rounded-full ${colorMap.pill}`}>
          {days}d
        </span>
      </div>
    </div>
  );
}

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
  const [licenseExpiresAt, setLicenseExpiresAt]   = useState<string | null>(null);
  const [licenseActivatedAt, setLicenseActivatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!store) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: lc } = await supabase
          .from('license_codes')
          .select('expires_at, used_at')
          .eq('used_by', user.id)
          .maybeSingle();
        if (lc?.expires_at) setLicenseExpiresAt(lc.expires_at);
        if (lc?.used_at)    setLicenseActivatedAt(lc.used_at);
      }
      const [ordersRes, productsRes, pendingRes, recentRes] = await Promise.all([
        supabase.from('orders').select('total').eq('store_id', store.id).eq('status', 'delivered'),
        supabase.from('products').select('id', { count: 'exact' }).eq('store_id', store.id),
        supabase.from('orders').select('id', { count: 'exact' }).eq('store_id', store.id).eq('status', 'pending'),
        supabase.from('orders')
          .select('*, order_items(*)')
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

      <LicenseCard expiresAt={licenseExpiresAt} activatedAt={licenseActivatedAt} />

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
                    {order.customer_name ?? 'Guest'}
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
