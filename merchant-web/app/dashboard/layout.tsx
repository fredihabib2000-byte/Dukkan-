'use client';
import { useEffect, useState } from 'react'; // useState kept for authChecked
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/hooks/useStore';
import { Sidebar } from '@/components/Sidebar';

const ADMIN_EMAIL = 'fredihabib2000@gmail.com';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { store, loading } = useStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/'); return; }
      if (user.email === ADMIN_EMAIL) { router.push('/admin'); return; }
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    if (!loading && authChecked && !store) {
      router.push('/signup');
    }
  }, [loading, authChecked, store, router]);

  if (loading || !authChecked || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
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
