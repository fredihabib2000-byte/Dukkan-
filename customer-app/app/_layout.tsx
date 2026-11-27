import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useWishlistStore } from '@/store/wishlist';

const parseHashParams = (url: string): Record<string, string> => {
  const hash = url.split('#')[1] || '';
  return Object.fromEntries(hash.split('&').filter(Boolean).map(p => {
    const [k, v] = p.split('=');
    return [k, decodeURIComponent(v || '')];
  }));
};

export default function RootLayout() {
  const loadWishlist = useWishlistStore(s => s.loadFromSupabase);
  const clearWishlist = useWishlistStore(s => s.clear);

  useEffect(() => {
    loadWishlist();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') loadWishlist();
      if (event === 'SIGNED_OUT') clearWishlist();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url.includes('type=recovery') && !url.includes('access_token')) return;
      const params = parseHashParams(url);
      if (params.access_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token || '',
        });
        router.replace('/(auth)/reset-password');
      }
    };

    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="store/[slug]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="cart" options={{ headerShown: true, title: 'My Cart', presentation: 'modal' }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout' }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: true, title: 'Order Details' }} />
      </Stack>
    </>
  );
}
