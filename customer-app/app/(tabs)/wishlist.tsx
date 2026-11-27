import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';

export default function WishlistScreen() {
  const { items, toggle } = useWishlistStore();
  const { addItem } = useCartStore();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Wishlist</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No saved items</Text>
          <Text style={styles.emptyText}>Tap the ♡ on any product to save it here</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist</Text>
        <Text style={styles.count}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.product.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const { product, storeId } = item;
          const img = product.images?.[0];
          const hasDiscount = !!product.discount_percent;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/product/${product.id}?storeId=${storeId}`)}
              activeOpacity={0.85}
            >
              {/* Image */}
              <View style={styles.imgWrap}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.img} resizeMode="cover" />
                ) : (
                  <View style={[styles.img, styles.imgPlaceholder]}>
                    <Ionicons name="cube-outline" size={32} color="#D1FAE5" />
                  </View>
                )}
                {hasDiscount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{product.discount_percent}% OFF</Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                {product.unit ? <Text style={styles.unit}>{product.unit}</Text> : null}
                <View style={styles.priceRow}>
                  <Text style={[styles.price, hasDiscount && { color: '#EF4444' }]}>
                    ${product.price.toFixed(2)}
                  </Text>
                  {product.compare_at_price ? (
                    <Text style={styles.comparePrice}>${product.compare_at_price.toFixed(2)}</Text>
                  ) : null}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.addCartBtn}
                  onPress={(e) => { e.stopPropagation(); addItem(product, storeId); }}
                >
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                  <Text style={styles.addCartText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={(e) => { e.stopPropagation(); toggle(product, storeId); }}
                >
                  <Ionicons name="heart" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  count: { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginTop: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  shopBtn: {
    marginTop: 12, backgroundColor: '#16A34A', paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 14,
  },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    flexDirection: 'row',
  },
  imgWrap: { position: 'relative' },
  img: { width: 100, height: 100 },
  imgPlaceholder: { backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  discountBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#EF4444', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
  },
  discountText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  info: { flex: 1, padding: 12, justifyContent: 'center', gap: 2 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 19 },
  unit: { fontSize: 11, color: '#9CA3AF' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  price: { fontSize: 16, fontWeight: '800', color: '#111827' },
  comparePrice: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },

  actions: {
    padding: 10, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  addCartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
  },
  addCartText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  removeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center',
  },
});
