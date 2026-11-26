import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { supabase } from '@/lib/supabase';

const parseHashParams = (url: string): Record<string, string> => {
  const hash = url.split('#')[1] || '';
  return Object.fromEntries(hash.split('&').filter(Boolean).map(p => {
    const [k, v] = p.split('=');
    return [k, decodeURIComponent(v || '')];
  }));
};

export default function RootLayout() {
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
      </Stack>
    </>
  );
}
