'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Store } from '@/lib/types';

const NAV = [
  { href: '/dashboard',            icon: '📊', label: 'Overview' },
  { href: '/dashboard/orders',     icon: '📦', label: 'Orders' },
  { href: '/dashboard/products',   icon: '🏷️', label: 'Products' },
  { href: '/dashboard/categories', icon: '📂', label: 'Categories' },
  { href: '/dashboard/settings',   icon: '⚙️', label: 'Settings' },
];

export function Sidebar({ store }: { store: Store | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <div>
            <p className="font-extrabold text-gray-900 leading-tight">Dukkan</p>
            <p className="text-xs text-gray-400 leading-tight">Merchant</p>
          </div>
        </div>
      </div>

      {/* Store badge */}
      {store && (
        <div className="mx-4 my-4 bg-brand-50 rounded-xl px-4 py-3">
          <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide">Your Store</p>
          <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">{store.name}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {store.is_active ? '● Live' : '● Offline'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && (pathname?.startsWith(href) ?? false));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                active ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
