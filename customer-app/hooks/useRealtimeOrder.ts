import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { OrderStatus } from '@/lib/types';

export function useRealtimeOrder(
  orderId: string | undefined,
  onStatusChange: (status: OrderStatus) => void
) {
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => onStatusChange(payload.new.status as OrderStatus)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);
}
