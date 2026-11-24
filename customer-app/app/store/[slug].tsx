import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Store, Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { useCartStore } from '@/store/cart';

export default function StoreScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cartCount = useCartStore((s) => s.itemCount());

  const fetchData = useCallback(async () => {
    // Fetch store
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!storeData) { setLoading(false); return; }
    setStore(storeData);

    // Fetch categories
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeData.id)
      .eq('is_active', true)
      .order('sort_order');
    if (cats) setCategories(cats);

    // Fetch products
    let query = supabase
      .from('products')
      .select('*')
      .eq('store_id', storeData.id)
      .eq('is_available', true)
      .order('sort_order');
    if (selectedCategory) query = query.eq('category_id', selectedCategory);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data: prods } = await query;
    if (prods) setProducts(prods);

    setLoading(false);
    setRefreshing(false);
  }, [slug, selectedCategory, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#16A34A" />;
  if (!store) return (
    <View style={styles.center}><Text>Store not found</Text></View>
  );

  return (
    <View style={styles.container}>
      {/* Store header */}
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <View style={styles.storeMeta}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.metaText}>{store.rating.toFixed(1)} ({store.rating_count.toLocaleString()}+)</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{store.delivery_time_min}–{store.delivery_time_max} min</Text>
            {store.free_delivery_above && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.freeDelivery}>Free delivery over ${store.free_delivery_above}</Text>
              </>
            )}
          </View>
        </View>
        {cartCount > 0 && (
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.cartBtnText}>{cartCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search in ${store.name}...`}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9CA3AF"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <TouchableOpacity
          style={[styles.categoryPill, !selectedCategory && styles.categoryPillActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryPill, selectedCategory === cat.id && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products grid */}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            storeId={store.id}
            onPress={() => router.push(`/product/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.productList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="cube-outline" size={48} color="#D1FAE5" />
            <Text style={{ color: '#9CA3AF', marginTop: 8 }}>No products found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  storeHeader: {
    backgroundColor: '#fff', padding: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  storeMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  metaText: { fontSize: 12, color: '#6B7280' },
  metaDot: { color: '#D1D5DB' },
  freeDelivery: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  cartBtn: {
    backgroundColor: '#16A34A', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  cartBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    gap: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  categories: { paddingVertical: 8, maxHeight: 52 },
  categoryPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F3F4F6', marginBottom: 4,
  },
  categoryPillActive: { backgroundColor: '#16A34A' },
  categoryText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  categoryTextActive: { color: '#fff', fontWeight: '700' },
  productList: { padding: 12, paddingBottom: 100 },
  productRow: { gap: 10, marginBottom: 10 },
});
