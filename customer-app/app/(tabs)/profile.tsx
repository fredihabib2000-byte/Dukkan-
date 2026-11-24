import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type Profile = { full_name: string | null; phone: string | null };

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? '');
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
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

  const initials = (profile?.full_name ?? email).slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name ?? 'User'}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        {[
          { icon: 'location-outline', label: 'My Addresses' },
          { icon: 'receipt-outline', label: 'Order History' },
          { icon: 'notifications-outline', label: 'Notifications' },
          { icon: 'shield-outline', label: 'Privacy & Security' },
          { icon: 'help-circle-outline', label: 'Help & Support' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', padding: 20, paddingBottom: 0 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#16A34A',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { color: '#6B7280', marginTop: 4 },
  menu: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, marginTop: 20, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14,
  },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
