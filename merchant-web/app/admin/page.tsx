'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'fredy.habib@kore.pro';

interface LicenseCode {
  id: string; code: string; store_name_hint: string | null;
  used_by: string | null; used_at: string | null;
  created_at: string; store_name: string | null;
}
interface Customer {
  user_id: string; email: string; full_name: string | null;
  phone: string | null; created_at: string;
  store_name: string | null; store_id: string | null; has_license: boolean;
}

type Tab = 'codes' | 'customers';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab]           = useState<Tab>('customers');
  const [codes, setCodes]       = useState<LicenseCode[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hint, setHint]         = useState('');
  const [newCode, setNewCode]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return; }
      if (user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return; }
      else { loadCodes(); loadCustomers(); }
    });
  }, [router]);

  const loadCodes = async () => {
    const { data } = await supabase.rpc('list_license_codes');
    if (data) setCodes(data as LicenseCode[]);
  };
  const loadCustomers = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('list_customers');
    if (data) setCustomers(data as Customer[]);
    setLoading(false);
  };

  const generateCode = async (e: FormEvent) => {
    e.preventDefault();
    setGenerating(true); setNewCode(''); setError('');
    const { data, error } = await supabase.rpc('generate_license_code', { p_hint: hint.trim() || null });
    if (error) setError(error.message);
    else { setNewCode(data as string); setHint(''); loadCodes(); }
    setGenerating(false);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  const totalStores    = customers.filter(c => c.has_license).length;
  const totalCustomers = customers.filter(c => !c.has_license).length;
  const availableCodes = codes.filter(c => !c.used_by).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">لوحة الإدارة</h1>
        <p className="text-gray-500 mt-0.5 text-sm">مرحباً، هنا تتابع كل شي</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'متاجر مفعّلة', value: totalStores,    icon: '🏪', color: 'green' },
          { label: 'زبائن مسجّلين', value: totalCustomers, icon: '👤', color: 'blue'  },
          { label: 'أكواد متاحة',   value: availableCodes, icon: '🔑', color: 'amber' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-3xl font-black text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {([['customers','👤 الزبائن والمتاجر'],['codes','🔑 الأكواد']] as [Tab,string][]).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab===t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── CUSTOMERS TAB ── */}
      {tab === 'customers' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">جميع المستخدمين</h2>
            <button onClick={loadCustomers} className="text-xs text-brand-600 hover:underline">تحديث</button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>
          ) : customers.length === 0 ? (
            <p className="text-center text-gray-400 py-10">لا يوجد مستخدمين بعد</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {customers.map(c => (
                <div key={c.user_id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${c.has_license ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-500'}`}>
                    {c.has_license ? '🏪' : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.full_name || '(بدون اسم)'}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                    {c.store_name && <p className="text-xs text-green-600 font-medium mt-0.5">🏪 {c.store_name}</p>}
                    {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                  </div>
                  <div className="text-left flex-shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.has_license ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.has_license ? 'متجر مفعّل' : 'بدون متجر'}
                    </span>
                    <span className="text-xs text-gray-300">
                      {new Date(c.created_at).toLocaleDateString('ar-LB')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CODES TAB ── */}
      {tab === 'codes' && (
        <div className="space-y-5">
          {/* Generate */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4">إنشاء كود ترخيص جديد</h2>
            <form onSubmit={generateCode} className="flex gap-3">
              <input type="text" value={hint} onChange={e => setHint(e.target.value)}
                placeholder="اسم صاحب المتجر (اختياري)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"/>
              <button type="submit" disabled={generating}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50 whitespace-nowrap">
                {generating ? '…' : '+ إنشاء'}
              </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {newCode && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-semibold mb-1">الكود الجديد — أعطه لصاحب المتجر:</p>
                  <p className="text-2xl font-mono font-black text-green-800 tracking-widest">{newCode}</p>
                </div>
                <button onClick={() => copy(newCode)}
                  className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition">
                  {copied === newCode ? '✓ نُسخ' : 'نسخ'}
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-50">
              <h2 className="font-bold text-gray-800">جميع الأكواد ({codes.length})</h2>
              <button onClick={loadCodes} className="text-xs text-brand-600 hover:underline">تحديث</button>
            </div>
            {codes.length === 0 ? (
              <p className="text-center text-gray-400 py-8">لا يوجد أكواد بعد</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {codes.map(c => (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
                    <span className="font-mono font-black text-gray-800 tracking-wider text-sm">{c.code}</span>
                    <span className="text-gray-400 text-xs flex-1">{c.store_name_hint || ''}</span>
                    {c.store_name
                      ? <span className="text-xs text-gray-500 truncate max-w-[120px]">🏪 {c.store_name}</span>
                      : <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">متاح</span>}
                    <span className="text-xs text-gray-300">{new Date(c.created_at).toLocaleDateString('ar-LB')}</span>
                    {!c.used_by && (
                      <button onClick={() => copy(c.code)}
                        className="text-xs text-brand-600 hover:underline ml-1">
                        {copied === c.code ? '✓' : 'نسخ'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
