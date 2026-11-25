'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'fredihabib2000@gmail.com';

interface LicenseCode {
  id: string; code: string; store_name_hint: string | null;
  used_by: string | null; used_at: string | null;
  created_at: string; store_name: string | null; expires_at: string | null;
}
interface Customer {
  user_id: string; email: string; full_name: string | null;
  phone: string | null; created_at: string;
  store_name: string | null; store_id: string | null; has_license: boolean;
  license_expires_at: string | null;
}

type Tab = 'overview' | 'customers' | 'codes';

const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview',   icon: '📊', label: 'Overview'  },
  { id: 'customers',  icon: '👥', label: 'Users'     },
  { id: 'codes',      icon: '🔑', label: 'Licenses'  },
];

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

  useEffect(() => {
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

  const expiryBadge = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (days < 0) return <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">Expired</span>;
    if (days < 30) return <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">Expires in {days}d</span>;
    return <span className="text-xs text-gray-400">Expires {new Date(expiresAt).toLocaleDateString()}</span>;
  };

  const stores    = customers.filter(c => c.has_license);
  const users     = customers.filter(c => !c.has_license);
  const available = codes.filter(c => !c.used_by);
  const used      = codes.filter(c => c.used_by);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm">D</div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 leading-none">Dukkan</p>
              <p className="text-xs text-gray-400 mt-0.5">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Main</p>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === n.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <span className="text-base">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4">
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
          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-gray-900">
              {tab === 'overview' ? 'Dashboard' : tab === 'customers' ? 'Users' : 'License Codes'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label:'Active Stores',    value: stores.length,    icon:'🏪', color:'green'  },
                  { label:'Registered Users', value: users.length,     icon:'👤', color:'blue'   },
                  { label:'Available Codes',  value: available.length, icon:'🔑', color:'amber'  },
                  { label:'Used Codes',       value: used.length,      icon:'✅', color:'purple' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className="text-3xl font-black text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">Recent Users</h2>
                  <button onClick={() => setTab('customers')} className="text-xs text-brand-600 hover:underline">View all →</button>
                </div>
                {customers.length === 0 ? (
                  <p className="text-center text-gray-400 py-10 text-sm">No users yet</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {customers.slice(0,5).map(c => (
                      <div key={c.user_id} className="flex items-center gap-4 px-6 py-3.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.has_license ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-500'}`}>
                          {(c.full_name || c.email)[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{c.full_name || '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.has_license ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.has_license ? 'Store' : 'User'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── CUSTOMERS ── */}
          {tab === 'customers' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-800">All Users ({customers.length})</h2>
                <button onClick={loadCustomers} className="text-xs text-brand-600 hover:underline">Refresh</button>
              </div>
              {loading ? (
                <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>
              ) : customers.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">No users yet</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {customers.map(c => (
                    <div key={c.user_id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${c.has_license ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-500'}`}>
                        {(c.full_name || c.email)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{c.full_name || '(no name)'}</p>
                        <p className="text-xs text-gray-400 truncate">{c.email}</p>
                        {c.store_name && <p className="text-xs text-green-600 font-medium mt-0.5">🏪 {c.store_name}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.has_license ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.has_license ? 'Active Store' : 'No Store'}
                        </span>
                        {expiryBadge(c.license_expires_at)}
                        <button onClick={() => sendReset(c.email)}
                          className="text-xs text-blue-500 hover:underline">
                          {resetSent === c.email ? '✓ Email sent' : 'Reset password'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CODES ── */}
          {tab === 'codes' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-800 mb-4">Generate New License Code</h2>
                <form onSubmit={generateCode} className="flex gap-3">
                  <input type="text" value={hint} onChange={e => setHint(e.target.value)}
                    placeholder="Store owner name (optional)"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"/>
                  <button type="submit" disabled={generating}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50 whitespace-nowrap">
                    {generating ? '…' : '+ Generate'}
                  </button>
                </form>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {newCode && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 font-semibold mb-1">New code — share with store owner:</p>
                      <p className="text-2xl font-mono font-black text-green-800 tracking-widest">{newCode}</p>
                    </div>
                    <button onClick={() => copy(newCode)}
                      className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition">
                      {copied === newCode ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-800">All Codes ({codes.length})</h2>
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-600 font-semibold">{available.length} available</span>
                    <span className="text-gray-400">{used.length} used</span>
                  </div>
                </div>
                {codes.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No codes yet</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {codes.map(c => (
                      <div key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50">
                        <span className="font-mono font-black text-gray-800 tracking-wider text-sm">{c.code}</span>
                        <span className="text-gray-400 text-xs flex-1 truncate">{c.store_name_hint || ''}</span>
                        {c.store_name
                          ? <span className="text-xs text-gray-500 truncate max-w-[130px]">🏪 {c.store_name}</span>
                          : <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Available</span>}
                        {c.expires_at
                          ? expiryBadge(c.expires_at)
                          : <span className="text-xs text-gray-300">{new Date(c.created_at).toLocaleDateString()}</span>}
                        {!c.used_by && (
                          <button onClick={() => copy(c.code)} className="text-xs text-brand-600 hover:underline">
                            {copied === c.code ? '✓' : 'Copy'}
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
      </main>
    </div>
  );
}
