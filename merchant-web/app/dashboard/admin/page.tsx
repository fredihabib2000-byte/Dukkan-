'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'fredy.habib@kore.pro';

interface LicenseCode {
  id: string;
  code: string;
  store_name_hint: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  store_name: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<LicenseCode[]>([]);
  const [hint, setHint] = useState('');
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/dashboard');
      } else {
        loadCodes();
      }
    });
  }, [router]);

  const loadCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('list_license_codes');
    if (!error && data) setCodes(data as LicenseCode[]);
    setLoading(false);
  };

  const generateCode = async (e: FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setNewCode('');
    setError('');

    const { data, error } = await supabase.rpc('generate_license_code', {
      p_hint: hint.trim() || null,
    });

    if (error) {
      setError(error.message);
    } else {
      setNewCode(data as string);
      setHint('');
      loadCodes();
    }
    setGenerating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">لوحة الإدارة</h1>
        <p className="text-gray-500 mt-1">إنشاء وإدارة أكواد الترخيص للمتاجر</p>
      </div>

      {/* Generate Code */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">🔑 إنشاء كود ترخيص جديد</h2>
        <form onSubmit={generateCode} className="flex gap-3">
          <input
            type="text"
            value={hint}
            onChange={e => setHint(e.target.value)}
            placeholder="اسم صاحب المتجر (اختياري)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
          />
          <button
            type="submit"
            disabled={generating}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50 whitespace-nowrap"
          >
            {generating ? '…' : '+ إنشاء كود'}
          </button>
        </form>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {newCode && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-semibold mb-1">الكود الجديد:</p>
              <p className="text-2xl font-mono font-bold text-green-800 tracking-widest">{newCode}</p>
            </div>
            <button
              onClick={() => copyCode(newCode)}
              className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              نسخ
            </button>
          </div>
        )}
      </div>

      {/* Codes List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">📋 جميع الأكواد</h2>
          <button onClick={loadCodes} className="text-sm text-brand-600 hover:underline">تحديث</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : codes.length === 0 ? (
          <p className="text-center text-gray-400 py-8">لا يوجد أكواد بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right pb-3 font-semibold text-gray-600">الكود</th>
                  <th className="text-right pb-3 font-semibold text-gray-600">لـ (تلميح)</th>
                  <th className="text-right pb-3 font-semibold text-gray-600">الحالة</th>
                  <th className="text-right pb-3 font-semibold text-gray-600">المتجر</th>
                  <th className="text-right pb-3 font-semibold text-gray-600">تاريخ الإنشاء</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {codes.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono font-bold text-gray-800 tracking-wider">{c.code}</td>
                    <td className="py-3 text-gray-500">{c.store_name_hint || '—'}</td>
                    <td className="py-3">
                      {c.used_by ? (
                        <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">مستخدم</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">متاح</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-700">{c.store_name || '—'}</td>
                    <td className="py-3 text-gray-400 text-xs">
                      {new Date(c.created_at).toLocaleDateString('ar-LB')}
                    </td>
                    <td className="py-3">
                      {!c.used_by && (
                        <button
                          onClick={() => copyCode(c.code)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          نسخ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
