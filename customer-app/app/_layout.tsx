import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPushToken() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16A34A',
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'dukkan-customer',
    });
    if (!token) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
  } catch (_) {}
}

const parseHashParams = (url: string): Record<string, string> => {
  const hash = url.split('#')[1] || '';
  return Object.fromEntries(hash.split('&').filter(Boolean).map(p => {
    const [k, v] = p.split('=');
    return [k, decodeURIComponent(v || '')];
  }));
};

export default function RootLayout() {
  useEffect(() => {
    // Register push token when app loads (after auth is settled)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) registerPushToken();
    });
    // Also register when user logs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') registerPushToken();
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
