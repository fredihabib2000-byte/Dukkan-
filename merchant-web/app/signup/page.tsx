'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Lang = 'en' | 'ar';

const t = {
  en: {
    subtitle_account: 'Create a new account',
    subtitle_activate: 'Activate your store',
    step1: 'Account',
    step2: 'Activate Store',
    fullName: 'Full Name',
    fullNamePh: 'John Smith',
    email: 'Email',
    emailPh: 'you@store.com',
    password: 'Password',
    passMin: 'Minimum 6 characters',
    createBtn: 'Create Account',
    creating: 'Creating…',
    successMsg: '✅ Account created! Now enter your store info.',
    storeName: 'Store Name',
    storeNamePh: 'e.g. Fresh Mart',
    licenseCode: 'License Code',
    licenseCodePh: 'DKN-XXXX-XXXX',
    licenseHint: 'Get your code from the admin',
    activateBtn: 'Activate Store',
    activating: 'Activating…',
    haveAccount: 'Already have an account?',
    signIn: 'Sign In',
    dir: 'ltr',
  },
  ar: {
    subtitle_account: 'إنشاء حساب جديد',
    subtitle_activate: 'تفعيل متجرك',
    step1: 'الحساب',
    step2: 'تفعيل المتجر',
    fullName: 'الاسم الكامل',
    fullNamePh: 'محمد الأحمد',
    email: 'البريد الإلكتروني',
    emailPh: 'you@store.com',
    password: 'كلمة المرور',
    passMin: 'على الأقل 6 أحرف',
    createBtn: 'إنشاء الحساب',
    creating: 'جاري الإنشاء…',
    successMsg: '✅ تم إنشاء الحساب! الآن أدخل معلومات متجرك',
    storeName: 'اسم المتجر',
    storeNamePh: 'مثال: سوبرماركت النور',
    licenseCode: 'كود الترخيص',
    licenseCodePh: 'DKN-XXXX-XXXX',
    licenseHint: 'احصل على الكود من الإدارة',
    activateBtn: 'تفعيل المتجر',
    activating: 'جاري التفعيل…',
    haveAccount: 'لديك حساب بالفعل؟',
    signIn: 'تسجيل الدخول',
    dir: 'rtl',
  },
};

export default function SignupPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const [step, setStep] = useState<'account' | 'activate'>('account');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [licenseCode, setLicenseCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const T = t[lang];

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (signupError) { setError(signupError.message); setLoading(false); return; }
    if (data.user) setStep('activate');
    setLoading(false);
  };

  const handleActivate = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error: rpcError } = await supabase.rpc('activate_store', {
      p_license_code: licenseCode.trim().toUpperCase(),
      p_store_name: storeName.trim(),
    });
    if (rpcError) {
      setError(rpcError.message.includes('Invalid or already used')
        ? (lang === 'ar' ? 'الكود غير صحيح أو تم استخدامه مسبقاً' : 'Invalid or already used license code.')
        : rpcError.message);
      setLoading(false); return;
    }
    router.push('/dashboard');
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
          <p className="text-gray-500 mt-1">
            {step === 'account' ? T.subtitle_account : T.subtitle_activate}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${step === 'account' ? 'text-brand-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'account' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
            {T.step1}
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${step === 'activate' ? 'text-brand-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'activate' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            {T.step2}
          </div>
        </div>

        {step === 'account' ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{T.fullName}</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                placeholder={T.fullNamePh} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{T.email}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                placeholder={T.emailPh} dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{T.password}</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                placeholder="••••••••" dir="ltr" />
              <p className="text-xs text-gray-400 mt-1">{T.passMin}</p>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
              {loading ? T.creating : T.createBtn}
            </button>
          </form>
        ) : (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
              {T.successMsg}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{T.storeName}</label>
              <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
                placeholder={T.storeNamePh} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{T.licenseCode}</label>
              <input type="text" required value={licenseCode} onChange={e => setLicenseCode(e.target.value.toUpperCase())}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 tracking-widest"
                placeholder={T.licenseCodePh} maxLength={12} dir="ltr" />
              <p className="text-xs text-gray-400 mt-1">{T.licenseHint}</p>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
              {loading ? T.activating : T.activateBtn}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          {T.haveAccount}{' '}
          <Link href="/" className="text-brand-600 font-semibold hover:underline">{T.signIn}</Link>
        </p>
      </div>
    </div>
  );
}
