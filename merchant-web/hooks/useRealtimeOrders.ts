'use client';
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Options = {
  storeId: string | undefined;
  onNewOrder: (order: any) => void;
  onStatusChange: (order: any) => void;
};

export function useRealtimeOrders({ storeId, onNewOrder, onStatusChange }: Options) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`orders:${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => onNewOrder(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => onStatusChange(payload.new)
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);
}
