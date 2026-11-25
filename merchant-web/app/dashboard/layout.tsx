'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import { Sidebar } from '@/components/Sidebar';

const ADMIN_EMAIL = 'fredy.habib@kore.pro';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { store, loading } = useStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return; }
      if (user.email === ADMIN_EMAIL) setIsAdmin(true);
      setAuthChecked(true);
    });
  }, [router]);

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Admin bypasses store check
  if (!store && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">لا يوجد متجر مفعّل</h2>
          <p className="text-gray-500 mb-6">حسابك غير مرتبط بأي متجر. إذا لديك كود ترخيص، يمكنك تفعيل متجرك.</p>
          <a href="/signup" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl transition">
            تفعيل المتجر
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar store={store} />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
