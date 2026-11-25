import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Store } from '@/lib/types';

type Props = { store: Store; onPress: () => void };

export function StoreCard({ store, onPress }: Props) {
  const initial = store.name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Banner */}
      <View style={styles.bannerWrap}>
        {store.banner_url ? (
          <Image source={{ uri: store.banner_url }} style={styles.bannerImg} resizeMode="cover" />
        ) : (
          <View style={[styles.bannerPlaceholder, { backgroundColor: bannerColor(store.name) }]}>
            <Text style={styles.bannerInitial}>{initial}</Text>
          </View>
        )}
        {/* Logo overlay */}
        {store.logo_url && (
          <View style={styles.logoWrap}>
            <Image source={{ uri: store.logo_url }} style={styles.logo} resizeMode="cover" />
          </View>
        )}
        {store.delivery_fee === 0 && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Free delivery</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.rating}>{store.rating.toFixed(1)}</Text>
          </View>
        </View>

        {store.address ? (
          <Text style={styles.address} numberOfLines={1}>{store.address}</Text>
        ) : null}

        <View style={styles.meta}>
          <Ionicons name="time-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>{store.delivery_time_min}–{store.delivery_time_max} min</Text>
          <View style={styles.dot} />
          <Ionicons name="bicycle-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>
            {store.delivery_fee === 0 ? 'Free delivery' : `$${store.delivery_fee.toFixed(2)}`}
          </Text>
          {store.free_delivery_above ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.freeText}>Free over ${store.free_delivery_above}</Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function bannerColor(name: string) {
  const colors = ['#D1FAE5', '#DBEAFE', '#FEF3C7', '#FCE7F3', '#E0E7FF'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, overflow: 'hidden',
  },
  bannerWrap: { height: 120, position: 'relative' },
  bannerImg: { width: '100%', height: '100%' },
  bannerPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  bannerInitial: { fontSize: 52, fontWeight: '800', color: '#fff', opacity: 0.5 },
  logoWrap: {
    position: 'absolute', bottom: -20, left: 14,
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden',
  },
  logo: { width: 44, height: 44 },
  freeBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#16A34A', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
  },
  freeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  body: { padding: 14, paddingTop: 26 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '800', color: '#111827', flex: 1 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  rating: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  address: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: '#6B7280' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },
  freeText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
});
