'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'account' | 'activate'>('account');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [licenseCode, setLicenseCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setStep('activate');
    }
    setLoading(false);
  };

  const handleActivate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: rpcError } = await supabase.rpc('activate_store', {
      p_license_code: licenseCode.trim().toUpperCase(),
      p_store_name: storeName.trim(),
    });

    if (rpcError) {
      setError(rpcError.message.includes('Invalid or already used') ? 'الكود غير صحيح أو تم استخدامه مسبقاً' : rpcError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛒</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dukkan Merchant</h1>
          <p className="text-gray-500 mt-1">
            {step === 'account' ? 'إنشاء حساب جديد' : 'تفعيل متجرك'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${step === 'account' ? 'text-brand-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'account' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
            الحساب
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${step === 'activate' ? 'text-brand-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'activate' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            تفعيل المتجر
          </div>
        </div>

        {step === 'account' ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
              <input
                type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                placeholder="محمد الأحمد"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                placeholder="you@store.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">كلمة المرور</label>
              <input
                type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'جاري الإنشاء…' : 'إنشاء الحساب'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
              ✅ تم إنشاء الحساب بنجاح! الآن أدخل معلومات متجرك
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">اسم المتجر</label>
              <input
                type="text" required value={storeName} onChange={e => setStoreName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                placeholder="مثال: سوبرماركت النور"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">كود الترخيص</label>
              <input
                type="text" required value={licenseCode} onChange={e => setLicenseCode(e.target.value.toUpperCase())}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 tracking-widest"
                placeholder="DKN-XXXX-XXXX"
                maxLength={12}
              />
              <p className="text-xs text-gray-400 mt-1">احصل على الكود من الإدارة</p>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'جاري التفعيل…' : 'تفعيل المتجر'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          لديك حساب بالفعل?{' '}
          <Link href="/" className="text-brand-600 font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
