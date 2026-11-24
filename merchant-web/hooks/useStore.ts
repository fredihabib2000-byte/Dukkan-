'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store } from '@/lib/types';

export function useStore() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('store_staff')
        .select('store_id, stores(*)')
        .eq('user_id', user.id)
        .single();
      if (data?.stores) setStore(data.stores as unknown as Store);
      setLoading(false);
    };
    load();
  }, []);

  return { store, loading };
}
