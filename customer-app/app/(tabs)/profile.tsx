import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

type Profile = { full_name: string | null; phone: string | null };
type PointsRow = { store_id: string; store_name: string; balance: number };

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pointsRows, setPointsRows] = useState<PointsRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setAuthed(false); setLoading(false); return; }
      setAuthed(true);
      setEmail(session.user.email ?? '');
      const [{ data: prof }, { data: pts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('points_ledger')
          .select('store_id, points, stores(name)')
          .eq('user_id', session.user.id),
      ]);
      if (prof) setProfile(prof);
      if (pts) {
        const map: Record<string, { name: string; balance: number }> = {};
        for (const r of pts as any[]) {
          const sid = r.store_id;
          if (!map[sid]) map[sid] = { name: r.stores?.name ?? sid, balance: 0 };
          map[sid].balance += r.points;
        }
        setPointsRows(
          Object.entries(map)
            .map(([store_id, v]) => ({ store_id, store_name: v.name, balance: v.balance }))
            .filter(r => r.balance > 0)
            .sort((a, b) => b.balance - a.balance)
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#16A34A" />;

  if (!authed) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 16 }]}>
        <Ionicons name="person-circle-outline" size={72} color="#D1FAE5" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Sign in to your account</Text>
        <Text style={{ color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 }}>
          Sign in to manage your profile and view order history
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}
          style={{ backgroundColor: '#16A34A', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text style={{ color: '#16A34A', fontWeight: '600' }}>Create account</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initials = (profile?.full_name ?? email).slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name ?? 'User'}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {pointsRows.length > 0 && (
        <View style={styles.pointsCard}>
          <Text style={styles.pointsTitle}>⭐ My Loyalty Points</Text>
          {pointsRows.map(r => (
            <View key={r.store_id} style={styles.pointsRow}>
              <Text style={styles.pointsStoreName}>{r.store_name}</Text>
              <Text style={styles.pointsBalance}>{r.balance} pts</Text>
            </View>
          ))}
          <Text style={styles.pointsHint}>Redeem at checkout for free delivery</Text>
        </View>
      )}

      <View style={styles.menu}>
        {[
          { icon: 'receipt-outline', label: 'Order History', onPress: () => router.push('/(tabs)/orders') },
          { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => Alert.alert('Help & Support', 'For support, contact us on WhatsApp:\n+961 70 000 000\n\nOr email: support@dukkan.app') },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon as any} size={22} color="#374151" />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', padding: 20, paddingBottom: 0 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { color: '#6B7280', marginTop: 4 },
  menu: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginTop: 20, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14 },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  pointsCard: { backgroundColor: '#F0FDF4', borderRadius: 16, marginHorizontal: 16, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: '#BBF7D0' },
  pointsTitle: { fontSize: 14, fontWeight: '700', color: '#15803D', marginBottom: 10 },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#D1FAE5' },
  pointsStoreName: { fontSize: 14, color: '#374151', fontWeight: '500' },
  pointsBalance: { fontSize: 14, fontWeight: '800', color: '#16A34A' },
  pointsHint: { fontSize: 11, color: '#6B7280', marginTop: 8 },
});
