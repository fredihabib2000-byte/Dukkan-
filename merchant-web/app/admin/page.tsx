'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'fredihabib2000@gmail.com';
const PORTAL_URL  = 'https://dukkan-merchant.vercel.app';

interface LicenseCode {
  id: string; code: string; store_name_hint: string | null;
  used_by: string | null; used_at: string | null;
  created_at: string; store_name: string | null; expires_at: string | null;
}
interface Customer {
  user_id: string; email: string; full_name: string | null;
  phone: string | null; created_at: string;
  store_name: string | null; store_id: string | null; has_license: boolean;
  license_expires_at: string | null; license_used_at: string | null;
}

type Tab = 'overview' | 'customers' | 'codes';

const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview',  icon: '📊', label: 'Overview' },
  { id: 'customers', icon: '👥', label: 'Users'    },
  { id: 'codes',     icon: '🔑', label: 'Licenses' },
];

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

function LicensePill({ expiresAt, usedAt }: { expiresAt: string | null; usedAt: string | null }) {
  const days = daysLeft(expiresAt);
  if (days === null) return null;
  const activated = usedAt ? new Date(usedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : null;
  if (days < 0)
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>Expired
        </span>
        {activated && <span className="text-[10px] text-gray-400">Since {activated}</span>}
      </div>
    );
  if (days <= 7)
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>
          {days}d left
        </span>
        {activated && <span className="text-[10px] text-gray-400">Since {activated}</span>}
      </div>
    );
  if (days <= 30)
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"/>
          {days}d left
        </span>
        {activated && <span className="text-[10px] text-gray-400">Since {activated}</span>}
      </div>
    );
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>
        {days}d left
      </span>
      {activated && <span className="text-[10px] text-gray-400">Since {activated}</span>}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab]           = useState<Tab>('overview');
  const [codes, setCodes]       = useState<LicenseCode[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hint, setHint]         = useState('');
  const [newCode, setNewCode]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState('');
  const [resetSent, setResetSent] = useState('');
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return; }
      if (user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return; }
      loadCodes(); loadCustomers();
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
    setCopied(text); setTimeout(() => setCopied(''), 2000);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut(); router.push('/');
  };
  const sendReset = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetSent(email); setTimeout(() => setResetSent(''), 3000);
  };

  const stores    = customers.filter(c => c.has_license);
  const users     = customers.filter(c => !c.has_license);
  const available = codes.filter(c => !c.used_by);
  const used      = codes.filter(c => c.used_by);
  const expiringSoon = customers.filter(c => { const d = daysLeft(c.license_expires_at); return d !== null && d >= 0 && d <= 30; });

  const stats = [
    { label:'Active Stores',    value: stores.length,       icon:'🏪', from:'from-green-500',  to:'to-emerald-400'  },
    { label:'Registered Users', value: users.length,        icon:'👤', from:'from-blue-500',   to:'to-indigo-400'   },
    { label:'Available Codes',  value: available.length,    icon:'🔑', from:'from-amber-500',  to:'to-yellow-400'   },
    { label:'Expiring Soon',    value: expiringSoon.length, icon:'⚠️', from:'from-orange-500', to:'to-red-400'      },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-black text-base shadow-sm">D</div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 leading-none">Dukkan</p>
              <p className="text-xs text-gray-400 mt-0.5">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Main</p>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                tab === n.id
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}>
              <span className="text-base">{n.icon}</span>
              {n.label}
              {n.id === 'customers' && customers.length > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === n.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {customers.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Portal link */}
        <div className="mx-3 mb-3">
          <button onClick={() => copy(PORTAL_URL)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 transition">
            <span>🔗</span>
            {copied === PORTAL_URL ? '✓ Link copied!' : 'Copy portal link'}
          </button>
        </div>

        <div className="px-3 pb-4 space-y-1 border-t border-gray-100 pt-3">
          <button onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-green-50 hover:text-green-700 transition">
            <span>🏪</span> My Store
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-7 max-w-5xl">

          {/* Header */}
          <div className={`mb-7 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {tab === 'overview' ? 'Dashboard' : tab === 'customers' ? 'Users' : 'License Codes'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className={`space-y-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                  <div key={s.label}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200 cursor-default"
                    style={{ animationDelay: `${i * 60}ms` }}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center text-xl mb-3 shadow-sm`}>
                      {s.icon}
                    </div>
                    <div className="text-3xl font-black text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Expiring soon banner */}
              {expiringSoon.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl mt-0.5">⚠️</span>
                  <div>
                    <p className="font-bold text-orange-800 text-sm">
                      {expiringSoon.length} store{expiringSoon.length > 1 ? 's' : ''} expiring soon
                    </p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      {expiringSoon.map(c => c.store_name ?? c.email).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Recent users */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Users</h2>
                  <button onClick={() => setTab('customers')} className="text-xs text-brand-600 hover:underline font-semibold">View all →</button>
                </div>
                {customers.length === 0 ? (
                  <p className="text-center text-gray-400 py-10 text-sm">No users yet</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {customers.slice(0,5).map(c => (
                      <div key={c.user_id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          c.has_license ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' : 'bg-blue-50 text-blue-500'
                        }`}>
                          {(c.full_name || c.email)[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{c.full_name || '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                          {c.store_name && <p className="text-xs text-green-600 font-semibold mt-0.5">🏪 {c.store_name}</p>}
                        </div>
                        <LicensePill expiresAt={c.license_expires_at} usedAt={c.license_used_at} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CUSTOMERS ── */}
          {tab === 'customers' && (
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold text-gray-800">All Users</h2>
                  <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">{customers.length}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">🏪 {stores.length} stores</span>
                </div>
                <button onClick={loadCustomers} className="text-xs text-brand-600 hover:underline font-semibold">↻ Refresh</button>
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"/>
                  <p className="text-sm text-gray-400">Loading users…</p>
                </div>
              ) : customers.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">No users yet</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {customers.map(c => {
                    const days = daysLeft(c.license_expires_at);
                    return (
                      <div key={c.user_id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition group">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm ${
                          c.has_license
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                            : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600'
                        }`}>
                          {(c.full_name || c.email)[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="font-bold text-gray-900 text-sm truncate">{c.full_name || '(no name)'}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                          {c.store_name ? (
                            <p className="text-xs font-semibold text-green-700 mt-0.5">🏪 {c.store_name}</p>
                          ) : (
                            <p className="text-xs text-gray-300 italic">No store</p>
                          )}
                        </div>

                        {/* License status */}
                        <div className="flex flex-col items-end gap-2">
                          {c.has_license ? (
                            <LicensePill expiresAt={c.license_expires_at} usedAt={c.license_used_at} />
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">No license</span>
                          )}
                          <button onClick={() => sendReset(c.email)}
                            className="text-[11px] text-blue-400 hover:text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                            {resetSent === c.email ? '✓ Reset sent' : 'Reset password'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CODES ── */}
          {tab === 'codes' && (
            <div className={`space-y-5 transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              {/* Generate form */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-base">🔑</div>
                  <h2 className="font-bold text-gray-800">Generate License Code</h2>
                </div>
                <form onSubmit={generateCode} className="flex gap-3">
                  <input type="text" value={hint} onChange={e => setHint(e.target.value)}
                    placeholder="Store owner name (optional)"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 transition"/>
                  <button type="submit" disabled={generating}
                    className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50 whitespace-nowrap shadow-sm">
                    {generating ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Generating…</span>
                    ) : '+ Generate'}
                  </button>
                </form>
                {error && <p className="text-red-500 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                {newCode && (
                  <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 font-semibold mb-1">New code — share with store owner:</p>
                      <p className="text-3xl font-mono font-black text-green-800 tracking-[0.3em]">{newCode}</p>
                    </div>
                    <button onClick={() => copy(newCode)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm">
                      {copied === newCode ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              {/* Code list */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-gray-800">All Codes</h2>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{available.length} available</span>
                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">{used.length} used</span>
                  </div>
                  <button onClick={loadCodes} className="text-xs text-brand-600 hover:underline font-semibold">↻ Refresh</button>
                </div>
                {codes.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No codes yet</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {codes.map(c => {
                      const days = c.expires_at ? Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / 86_400_000) : null;
                      return (
                        <div key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition group">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.used_by ? 'bg-gray-300' : 'bg-green-500'}`}/>
                          <span className="font-mono font-black text-gray-800 tracking-[0.2em] text-sm">{c.code}</span>
                          <span className="text-gray-400 text-xs flex-1 truncate">{c.store_name_hint || ''}</span>
                          {c.store_name ? (
                            <span className="text-xs text-gray-600 font-semibold truncate max-w-[140px]">🏪 {c.store_name}</span>
                          ) : (
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Available</span>
                          )}
                          {days !== null ? (
                            days < 0
                              ? <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>
                              : days <= 30
                              ? <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{days}d left</span>
                              : <span className="text-xs text-gray-400">{new Date(c.expires_at!).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-xs text-gray-300">{new Date(c.created_at).toLocaleDateString()}</span>
                          )}
                          {!c.used_by && (
                            <button onClick={() => copy(c.code)}
                              className="text-xs text-brand-600 font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                              {copied === c.code ? '✓' : 'Copy'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
