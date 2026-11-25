'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'ar';

const t = {
  en: {
    subtitle: 'Sign in to manage your store',
    email: 'Email', password: 'Password',
    btn: 'Sign In', loading: 'Signing in…',
    newStore: 'New store owner?', register: 'Register your store',
    dir: 'ltr',
  },
  ar: {
    subtitle: 'سجّل دخولك لإدارة متجرك',
    email: 'البريد الإلكتروني', password: 'كلمة المرور',
    btn: 'تسجيل الدخول', loading: 'جاري الدخول…',
    newStore: 'صاحب متجر جديد؟', register: 'سجّل متجرك الآن',
    dir: 'rtl',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const T = t[lang];

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.user?.email === 'fredy.habib@kore.pro') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative" dir={T.dir}>

        {/* Language toggle */}
        <button
          onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')}
          className="absolute top-4 right-4 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs px-3 py-1.5 rounded-full transition"
          style={{ direction: 'ltr' }}
        >
          🌐 {lang === 'en' ? 'العربية' : 'English'}
        </button>

        <div className="text-center mb-8 mt-2">
          <div className="text-4xl mb-2">🛒</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dukkan Merchant</h1>
          <p className="text-gray-500 mt-1">{T.subtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{T.email}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
              placeholder="you@store.com" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{T.password}</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
              placeholder="••••••••" dir="ltr" />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? T.loading : T.btn}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {T.newStore}{' '}
          <Link href="/signup" className="text-brand-600 font-semibold hover:underline">{T.register}</Link>
        </p>
      </div>
    </div>
  );
}
