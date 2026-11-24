import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading]);

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
