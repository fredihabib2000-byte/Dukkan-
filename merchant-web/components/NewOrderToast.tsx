'use client';
import { useEffect, useRef } from 'react';

type Props = { order: any | null; onDismiss: () => void };

function playOrderSound() {
  try {
    const ctx = new AudioContext();
    // Play 3 ascending beeps
    [[0, 660], [0.18, 880], [0.36, 1100]].forEach(([t, freq]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq as number;
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.25);
    });
  } catch {}
}

export function NewOrderToast({ order, onDismiss }: Props) {
  const hasRequestedRef = useRef(false);

  // Request browser notification permission once on mount
  useEffect(() => {
    if (!hasRequestedRef.current && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
      hasRequestedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!order) return;

    // Play sound
    playOrderSound();

    // Browser desktop notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification('🛎️ New Order!', {
        body: `$${Number(order.total).toFixed(2)} · ${order.delivery_address ?? 'No address'}`,
        icon: '/icon.png',
        requireInteraction: true,
      });
      n.onclick = () => { window.focus(); n.close(); };
    }

    // Auto-dismiss after 10 seconds
    const t = setTimeout(onDismiss, 10000);
    return () => clearTimeout(t);
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className="bg-brand-600 text-white rounded-2xl shadow-2xl p-5 flex items-start gap-4 max-w-sm"
        style={{ animation: 'slideIn 0.3s ease' }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(120%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>
        <div className="text-3xl animate-bounce">🛎️</div>
        <div className="flex-1">
          <p className="font-extrabold text-lg">New Order!</p>
          <p className="text-brand-100 text-sm mt-0.5">
            ${Number(order.total).toFixed(2)} · Just placed
          </p>
          {order.delivery_address && (
            <p className="text-brand-100 text-xs mt-1 truncate">📍 {order.delivery_address}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-brand-200 hover:text-white font-bold text-lg ml-2 mt-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
