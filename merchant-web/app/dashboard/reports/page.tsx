'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';

type CustomerRow = {
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  order_count: number;
  total_spent: number;
  last_order_at: string;
  points_balance: number;
};

type SortKey = 'total_spent' | 'order_count' | 'points_balance' | 'last_order_at';
type Period = 'all' | 'month' | 'week' | 'today';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all',   label: 'All Time' },
  { key: 'month', label: 'This Month' },
  { key: 'week',  label: 'This Week' },
  { key: 'today', label: 'Today' },
];

function getPeriodDates(period: Period): { from?: string; to?: string } {
  if (period === 'all') return {};
  const now = new Date();
  const to = now.toISOString();
  if (period === 'today') {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    return { from, to };
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return { from: d.toISOString(), to };
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return { from, to };
  }
  return {};
}

export default function ReportsPage() {
  const { store, loading: storeLoading } = useStore();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('all');
  const [sortKey, setSortKey] = useState<SortKey>('total_spent');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    const { from, to } = getPeriodDates(period);
    const { data, error } = await supabase.rpc('get_customer_sales_report', {
      p_store_id:  store.id,
      p_from_date: from ?? null,
      p_to_date:   to   ?? null,
    });
    if (!error && data) setRows(data as CustomerRow[]);
    setLoading(false);
  }, [store, period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? <span className="text-gray-300 ml-1">↕</span>
    : sortAsc     ? <span className="text-brand-600 ml-1">↑</span>
                  : <span className="text-brand-600 ml-1">↓</span>;

  const filtered = rows
    .filter(r =>
      !search ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.includes(search)
    )
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortKey === 'last_order_at')
        return mul * (new Date(a.last_order_at).getTime() - new Date(b.last_order_at).getTime());
      return mul * (Number(a[sortKey]) - Number(b[sortKey]));
    });

  const totalRevenue = rows.reduce((s, r) => s + Number(r.total_spent), 0);
  const totalOrders  = rows.reduce((s, r) => s + Number(r.order_count), 0);
  const avgOrder     = rows.length ? totalRevenue / rows.length : 0;

  if (storeLoading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Sales by Customer</h1>
          <p className="text-sm text-gray-500 mt-1">Top customers ranked by total amount spent.</p>
        </div>
        {/* Period filter */}
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
                period === p.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Customers</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{rows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Orders</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Revenue</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg / Customer</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">${avgOrder.toFixed(2)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
        />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">📊</div>
          <p className="font-semibold text-gray-700">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Customer data will appear after orders are placed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-600"
                    onClick={() => toggleSort('order_count')}>
                  Orders <SortIcon k="order_count" />
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-600"
                    onClick={() => toggleSort('total_spent')}>
                  Total Spent <SortIcon k="total_spent" />
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-600"
                    onClick={() => toggleSort('points_balance')}>
                  Points <SortIcon k="points_balance" />
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-600"
                    onClick={() => toggleSort('last_order_at')}>
                  Last Order <SortIcon k="last_order_at" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.user_id ?? row.customer_phone} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                        {row.customer_name[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{row.customer_name}</p>
                        <p className="text-xs text-gray-400">{row.customer_phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-700">{row.order_count}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-gray-900">${Number(row.total_spent).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {Number(row.points_balance) > 0 ? (
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                        ⭐ {row.points_balance}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-gray-400">
                    {new Date(row.last_order_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
