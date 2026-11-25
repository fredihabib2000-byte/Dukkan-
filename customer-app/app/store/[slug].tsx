import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SectionList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  TextInput, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Store, Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { useCartStore } from '@/store/cart';

type Section = { title: string; catId: string; data: Product[][] };

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
    const { data: storeData } = await supabase.from('stores').select('*').eq('slug', slug).single();
    if (!storeData) { setLoading(false); return; }
    setStore(storeData);

    const { data: cats } = await supabase
      .from('categories').select('*').eq('store_id', storeData.id).eq('is_active', true).order('sort_order');
    if (cats) setCategories(cats);

    let query = supabase.from('products').select('*').eq('store_id', storeData.id).eq('is_available', true).order('sort_order');
    if (search) query = query.ilike('name', `%${search}%`);
    const { data: prods } = await query;
    if (prods) setProducts(prods);

    setLoading(false);
    setRefreshing(false);
  }, [slug, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#16A34A" />;
  if (!store) return <View style={styles.center}><Text>Store not found</Text></View>;

  // Build sections when "All" is selected
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  // Group into pairs for 2-col grid
  const pairProducts = (prods: Product[]): Product[][] => {
    const pairs: Product[][] = [];
    for (let i = 0; i < prods.length; i += 2) pairs.push(prods.slice(i, i + 2));
    return pairs;
  };

  const sections: Section[] = !selectedCategory
    ? categories
        .map((cat) => {
          const catProds = filteredProducts.filter((p) => p.category_id === cat.id);
          return { title: cat.name, catId: cat.id, data: pairProducts(catProds) };
        })
        .filter((s) => s.data.length > 0)
    : [{ title: '', catId: '', data: pairProducts(filteredProducts) }];

  // If no categories, just show all in one section
  const hasCategories = categories.length > 0;

  return (
    <View style={styles.container}>
      {/* Hero banner */}
      <View style={styles.hero}>
        {store.banner_url ? (
          <Image source={{ uri: store.banner_url }} style={styles.heroBg} resizeMode="cover" />
        ) : store.logo_url ? (
          <Image source={{ uri: store.logo_url }} style={styles.heroBg} resizeMode="cover" />
        ) : (
          <View style={[styles.heroBg, { backgroundColor: '#D1FAE5' }]} />
        )}
        <View style={styles.heroOverlay} />
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        {/* Cart button */}
        {cartCount > 0 && (
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart" size={18} color="#fff" />
            <Text style={styles.cartCount}>{cartCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Store info card */}
      <View style={styles.infoCard}>
        {store.logo_url && (
          <Image source={{ uri: store.logo_url }} style={styles.logoImg} resizeMode="cover" />
        )}
        <View style={styles.infoText}>
          <Text style={styles.storeName}>{store.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.metaText}>{store.rating.toFixed(1)} ({store.rating_count}+)</Text>
            <Text style={styles.dot}>·</Text>
            <Ionicons name="time-outline" size={13} color="#6B7280" />
            <Text style={styles.metaText}>{store.delivery_time_min}–{store.delivery_time_max} min</Text>
            {store.delivery_fee === 0 ? (
              <><Text style={styles.dot}>·</Text><Text style={styles.freeText}>Free delivery</Text></>
            ) : (
              <><Text style={styles.dot}>·</Text><Text style={styles.metaText}>${store.delivery_fee.toFixed(2)} delivery</Text></>
            )}
          </View>
          {store.free_delivery_above ? (
            <Text style={styles.freeAbove}>Free delivery on orders over ${store.free_delivery_above}</Text>
          ) : null}
        </View>
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

      {/* Category tabs - underline style */}
      {hasCategories && (
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, !selectedCategory && styles.tabActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.tabText, !selectedCategory && styles.tabTextActive]}>All</Text>
              {!selectedCategory && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.tab, selectedCategory === cat.id && styles.tabActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <Text style={[styles.tabText, selectedCategory === cat.id && styles.tabTextActive]}>{cat.name}</Text>
                {selectedCategory === cat.id && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Product sections */}
      <SectionList
        sections={sections}
        keyExtractor={(pair, idx) => idx.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory(section.catId)} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="arrow-forward" size={14} color="#16A34A" />
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item: pair }) => (
          <View style={styles.productRow}>
            {pair.map((product) => (
              <View key={product.id} style={styles.productCell}>
                <ProductCard
                  product={product}
                  storeId={store.id}
                  onPress={() => router.push(`/product/${product.id}`)}
                />
              </View>
            ))}
            {pair.length === 1 && <View style={styles.productCell} />}
          </View>
        )}
        contentContainerStyle={styles.list}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: 60 },

  hero: { height: 180, position: 'relative' },
  heroBg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  backBtn: {
    position: 'absolute', top: 48, left: 14,
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cartBtn: {
    position: 'absolute', top: 48, right: 14,
    backgroundColor: '#16A34A', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  cartCount: { color: '#fff', fontWeight: '800', fontSize: 13 },

  infoCard: {
    backgroundColor: '#fff', marginHorizontal: 14, marginTop: -20, borderRadius: 16,
    padding: 14, flexDirection: 'row', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  logoImg: { width: 48, height: 48, borderRadius: 10, flexShrink: 0 },
  infoText: { flex: 1 },
  storeName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 5 },
  metaText: { fontSize: 12, color: '#6B7280' },
  dot: { color: '#D1D5DB', fontSize: 12 },
  freeText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  freeAbove: { fontSize: 11, color: '#16A34A', fontWeight: '500', marginTop: 4 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 14, marginTop: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
    gap: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  tabsWrapper: { backgroundColor: '#fff', marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabs: { paddingHorizontal: 14, gap: 2 },
  tab: { paddingHorizontal: 14, paddingVertical: 10, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#16A34A', fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 10, right: 10, height: 2, backgroundColor: '#16A34A', borderRadius: 1 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 18, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontSize: 13, color: '#16A34A', fontWeight: '600' },

  list: { paddingBottom: 100 },
  productRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 10, marginBottom: 10 },
  productCell: { flex: 1 },
});
