import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Store } from '@/lib/types';

type Props = { store: Store; onPress: () => void };

export function StoreCard({ store, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Banner placeholder */}
      <View style={styles.banner}>
        <Text style={styles.bannerEmoji}>🏪</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.rating}>{store.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.address} numberOfLines={1}>{store.address ?? store.city}</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color="#6B7280" />
            <Text style={styles.metaText}>{store.delivery_time_min}–{store.delivery_time_max} min</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.metaItem}>
            <Ionicons name="bicycle-outline" size={13} color="#6B7280" />
            <Text style={styles.metaText}>
              {store.delivery_fee === 0 ? 'Free delivery' : `$${store.delivery_fee.toFixed(2)} delivery`}
            </Text>
          </View>
        </View>

        {store.free_delivery_above && (
          <View style={styles.freeTag}>
            <Text style={styles.freeTagText}>Free delivery over ${store.free_delivery_above}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3, overflow: 'hidden',
  },
  banner: { height: 100, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
  bannerEmoji: { fontSize: 40 },
  body: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  rating: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  address: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },
  freeTag: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 8 },
  freeTagText: { fontSize: 11, color: '#065F46', fontWeight: '600' },
});
