'use client';
import { useState, FormEvent, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';

export default function SettingsPage() {
  const { store, loading } = useStore();
  const [form, setForm] = useState({
    name: '', description: '', phone: '', address: '', city: '',
    delivery_time_min: 15, delivery_time_max: 30,
    delivery_fee: 2, min_order_amount: 0,
    free_delivery_above: '', is_active: true, currency: 'USD',
    wish_number: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!store) return;
    setForm({
      name: store.name ?? '',
      description: store.description ?? '',
      phone: store.phone ?? '',
      address: store.address ?? '',
      city: store.city ?? '',
      delivery_time_min: store.delivery_time_min ?? 15,
      delivery_time_max: store.delivery_time_max ?? 30,
      delivery_fee: store.delivery_fee ?? 2,
      min_order_amount: store.min_order_amount ?? 0,
      free_delivery_above: store.free_delivery_above?.toString() ?? '',
      is_active: store.is_active ?? true,
      currency: store.currency ?? 'USD',
      wish_number: store.wish_number ?? '',
    });
  }, [store]);

  const set = (key: string, val: string | number | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    await supabase.from('stores').update({
      name: form.name,
      description: form.description || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      delivery_time_min: form.delivery_time_min,
      delivery_time_max: form.delivery_time_max,
      delivery_fee: form.delivery_fee,
      min_order_amount: form.min_order_amount,
      free_delivery_above: form.free_delivery_above ? parseFloat(form.free_delivery_above) : null,
      is_active: form.is_active,
      currency: form.currency,
      wish_number: form.wish_number || null,
    }).eq('id', store.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Store Settings</h1>
        {saved && <span className="bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-xl">✓ Saved</span>}
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Basic info */}
        <Section title="Store Info">
          <Field label="Store Name *">
            <input required value={form.name} onChange={e => set('name', e.target.value)} className={inp} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className={`${inp} h-20 resize-none`} placeholder="Tell customers about your store…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} placeholder="+961 1 234 567" />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={e => set('city', e.target.value)} className={inp} placeholder="Beirut" />
            </Field>
          </div>
          <Field label="Address">
            <input value={form.address} onChange={e => set('address', e.target.value)} className={inp} placeholder="Street, neighbourhood" />
          </Field>
        </Section>

        {/* Delivery */}
        <Section title="Delivery Settings">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min delivery time (min)">
              <input type="number" min="1" value={form.delivery_time_min} onChange={e => set('delivery_time_min', +e.target.value)} className={inp} />
            </Field>
            <Field label="Max delivery time (min)">
              <input type="number" min="1" value={form.delivery_time_max} onChange={e => set('delivery_time_max', +e.target.value)} className={inp} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Delivery fee ($)">
              <input type="number" step="0.01" min="0" value={form.delivery_fee} onChange={e => set('delivery_fee', +e.target.value)} className={inp} />
            </Field>
            <Field label="Min order ($)">
              <input type="number" step="0.01" min="0" value={form.min_order_amount} onChange={e => set('min_order_amount', +e.target.value)} className={inp} />
            </Field>
          </div>
          <Field label="Free delivery above ($) — leave empty to disable">
            <input type="number" step="0.01" min="0" value={form.free_delivery_above} onChange={e => set('free_delivery_above', e.target.value)}
              className={inp} placeholder="e.g. 35" />
          </Field>
        </Section>

        {/* Payment */}
        <Section title="Payment Methods">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-2">
            <span className="text-2xl">💵</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Cash on Delivery</p>
              <p className="text-xs text-gray-500">Always enabled — customers can pay at the door</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
          </div>
          <Field label="Wish Number (optional)">
            <input value={form.wish_number} onChange={e => set('wish_number', e.target.value)}
              className={inp} placeholder="e.g. 71 123 456" />
            <p className="text-xs text-gray-400 mt-1">
              Customers can pay via Wish and send you confirmation on WhatsApp to this number.
              Leave empty to hide the Wish option.
            </p>
          </Field>
        </Section>

        {/* Store status */}
        <Section title="Store Status">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900">Accept orders</p>
              <p className="text-sm text-gray-500">Turn off to pause all new orders</p>
            </div>
            <button type="button" onClick={() => set('is_active', !form.is_active)}
              className={`w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-brand-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </Section>

        <button type="submit" disabled={saving}
          className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide text-brand-600">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50';
