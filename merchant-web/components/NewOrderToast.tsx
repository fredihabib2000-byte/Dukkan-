'use client';
import { useEffect, useState } from 'react';

type Props = { order: any | null; onDismiss: () => void };

export function NewOrderToast({ order, onDismiss }: Props) {
  useEffect(() => {
    if (!order) return;
    // Auto-dismiss after 8 seconds
    const t = setTimeout(onDismiss, 8000);
    // Play notification sound if browser supports it
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
    return () => clearTimeout(t);
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce-once">
      <div className="bg-brand-600 text-white rounded-2xl shadow-2xl p-5 flex items-start gap-4 max-w-sm">
        <div className="text-3xl">🛎️</div>
        <div className="flex-1">
          <p className="font-extrabold text-lg">New Order!</p>
          <p className="text-brand-100 text-sm mt-0.5">
            ${Number(order.total).toFixed(2)} · Just placed
          </p>
          <p className="text-brand-100 text-xs mt-1">{order.delivery_address}</p>
        </div>
        <button onClick={onDismiss} className="text-brand-200 hover:text-white font-bold text-lg ml-2">✕</button>
      </div>
    </div>
  );
}
