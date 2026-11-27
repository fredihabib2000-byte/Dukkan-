'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';

interface CustomerPoints {
  user_id: string;
  email: string;
  full_name: string | null;
  balance: number;
  last_earned: string | null;
}

interface Config {
  enabled: boolean;
  points_per_dollar: number;
  free_delivery_cost: number;
}

export default function PointsPage() {
  const { store } = useStore();
  const [customers, setCustomers] = useState<CustomerPoints[]>([]);
  const [config, setConfig] = useState<Config>({ enabled: true, points_per_dollar: 1, free_delivery_cost: 100 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!store) return;
    Promise.all([
      supabase.rpc('list_customer_points', { p_store_id: store.id }),
      supabase.rpc('get_store_points_config', { p_store_id: store.id }),
    ]).then(([pts, cfg]) => {
      if (pts.data) setCustomers(pts.data as CustomerPoints[]);
      if (cfg.data) setConfig(cfg.data as Config);
      setLoading(false);
    });
  }, [store]);

  const saveConfig = async () => {
    if (!store) return;
    setSaving(true);
    await supabase.from('points_config').upsert({
      store_id: store.id,
      enabled: config.enabled,
      points_per_dollar: config.points_per_dollar,
      free_delivery_cost: config.free_delivery_cost,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'store_id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalPoints = customers.reduce((s, c) => s + c.balance, 0);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Loyalty Points</h1>
      <p className="text-sm text-gray-500 mb-8">Customers earn points on every order and can redeem them for free delivery.</p>

      {/* Config card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800">Program Settings</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-600">Enabled</span>
            <div
              onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${config.enabled ? 'bg-brand-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${config.enabled ? 'left-6' : 'left-1'}`} />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Points per $1 spent</label>
            <input
              type="number" min={0.1} step={0.5} value={config.points_per_dollar}
              onChange={e => setConfig(c => ({ ...c, points_per_dollar: parseFloat(e.target.value) || 1 }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Customer earns this many points for each dollar spent.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Free delivery cost (pts)</label>
            <input
              type="number" min={10} step={10} value={config.free_delivery_cost}
              onChange={e => setConfig(c => ({ ...c, free_delivery_cost: parseInt(e.target.value) || 100 }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Points needed to get free delivery on an order.</p>
          </div>
        </div>

        <div className="mt-5 p-4 bg-brand-50 rounded-xl text-sm text-brand-700">
          <span className="font-bold">Example:</span> A ${(config.free_delivery_cost / config.points_per_dollar).toFixed(0)} order earns {config.free_delivery_cost} points → free delivery reward.
        </div>

        <button
          onClick={saveConfig} disabled={saving}
          className="mt-5 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Customers leaderboard */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Customer Points</h2>
          <span className="text-xs text-gray-400">{totalPoints.toLocaleString()} pts issued total</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No points issued yet. Points are awarded automatically when orders are marked as Delivered.
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {customers.map((c, i) => (
              <li key={c.user_id} className="px-6 py-4 flex items-center gap-4">
                <span className="w-6 text-xs font-bold text-gray-400 text-right">{i + 1}</span>
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-sm">
                  {(c.full_name || c.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.full_name || '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-extrabold ${c.balance >= config.free_delivery_cost ? 'text-green-600' : 'text-gray-800'}`}>
                    {c.balance.toLocaleString()} pts
                  </p>
                  {c.balance >= config.free_delivery_cost && (
                    <p className="text-[10px] text-green-500 font-semibold">Can redeem!</p>
                  )}
                  {c.last_earned && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(c.last_earned).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
