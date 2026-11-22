// @ts-nocheck
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ImageBackground,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { eventService, Event } from '@/services/event.service';
import { getImageUrl } from '@/utils/image';
import { useRealtime } from '@/hooks/useRealtime';

const BG = '#0B1120';
const CARD = '#1E293B';
const YELLOW = '#3B82F6';
const GRAY = '#94A3B8';
const GREEN = '#22c55e';

const CATEGORIES = ['All', 'Pop', 'Rock','Classical', 'Jazz', 'Heavy Metal'];

type SortKey = 'date' | 'price_high' | 'price_low' | 'popularity';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'price_high', label: 'Price: High' },
  { key: 'price_low', label: 'Price: Low' },
  { key: 'popularity', label: 'Popularity' },
];

function getMinPrice(event: Event): number {
  // Prioritas: min_price dari backend subquery
  if (event.min_price != null && Number(event.min_price) > 0) {
    return Number(event.min_price);
  }
  // Fallback: hitung dari ticket_categories kalau ada
  const cats = event.ticket_categories ?? [];
  if (cats.length === 0) return 0;
  return cats.reduce((min, c) => Math.min(min, Number(c.price)), Number(cats[0].price));
}

function getTotalSold(event: Event): number {
  const cats = event.ticket_categories ?? [];
  return cats.reduce((sum, c) => {
    const remaining = c.available ?? c.quota;
    return sum + Math.max(0, c.quota - remaining);
  }, 0);
}

function getTotalAvailable(event: Event): number {
  const cats = event.ticket_categories ?? [];
  return cats.reduce((sum, c) => sum + (c.available ?? c.quota), 0);
}

export default function ExploreScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSort, setActiveSort] = useState<SortKey | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const fetchEvents = useCallback(async () => {
    try {
      const res = await eventService.getEvents();
      const data = res?.data || res?.events || res || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log('Fetch events error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Real-time listener: refresh daftar event saat ada perubahan
  const { connect, on, off } = require('@/store/realtimeStore');
  useEffect(() => {
    connect();
    on('dashboard:changed', fetchEvents);
    on('categories:changed', fetchEvents);
    return () => {
      off('dashboard:changed');
      off('categories:changed');
    };
  }, [fetchEvents]);
  const onRefresh = () => { setRefreshing(true); fetchEvents(); };

  const handleDateSort = () => {
    setTempDate(selectedDate ?? new Date());
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    setSelectedDate(tempDate);
    setActiveSort('date');
    setShowDatePicker(false);
  };

  const handleDateClear = () => {
    setSelectedDate(null);
    setShowDatePicker(false);
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...events];

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.artist_name?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (activeCategory !== 'All') {
      list = list.filter((e) =>
        e.genre?.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    // Filter by selected date
    if (selectedDate) {
      const selected = dayjs(selectedDate).format('YYYY-MM-DD');
      list = list.filter((e) => dayjs(e.event_date).format('YYYY-MM-DD') === selected);
    }

    // Sort
    switch (activeSort) {
      case 'date':
        list.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
        break;
      case 'price_low':
        list.sort((a, b) => getMinPrice(a) - getMinPrice(b));
        break;
      case 'price_high':
        list.sort((a, b) => getMinPrice(b) - getMinPrice(a));
        break;
      case 'popularity':
        list.sort((a, b) => getTotalSold(b) - getTotalSold(a));
        break;
    }

    return list;
  }, [events, search, activeCategory, activeSort, selectedDate]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Concerts</Text>
      </View>

      <FlatList
        data={filteredAndSorted}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={YELLOW} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={YELLOW} size="large" />
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="search-outline" size={48} color={GRAY} />
              <Text style={styles.emptyText}>Tidak ada event ditemukan</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <>
            {/* Title */}
            <Text style={styles.pageTitle}>Concerts</Text>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={GRAY} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search concerts, artists..."
                placeholderTextColor={GRAY}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={GRAY} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter */}
            <View style={styles.filterRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterBtn, activeCategory === cat && styles.filterBtnActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort Filter */}
            <View style={styles.sortRow}>
              {/* Date button — buka date picker */}
              <TouchableOpacity
                style={[
                  styles.sortBtn,
                  (activeSort === 'date' || selectedDate) && styles.sortBtnActive,
                ]}
                onPress={handleDateSort}
              >
                <Text style={[styles.sortText, (activeSort === 'date' || selectedDate) && styles.sortTextActive]}>
                  {selectedDate ? dayjs(selectedDate).format('MMM D') : 'Date'}
                </Text>
                {selectedDate && (
                  <TouchableOpacity onPress={() => { setSelectedDate(null); setActiveSort(null); }} style={{ marginLeft: 4 }}>
                    <Ionicons name="close-circle" size={13} color={YELLOW} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {/* Other sort buttons */}
              {SORTS.filter((s) => s.key !== 'date').map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.sortBtn, activeSort === s.key && styles.sortBtnActive]}
                  onPress={() => { setActiveSort(s.key); setSelectedDate(null); }}
                >
                  <Text style={[styles.sortText, activeSort === s.key && styles.sortTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => <ExploreCard event={item} />}
      />

      {/* Date Picker Modal */}
      {showDatePicker && (
        Platform.OS === 'android' ? (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(e, date) => {
              setShowDatePicker(false);
              if (e.type === 'set' && date) {
                setSelectedDate(date);
                setActiveSort('date');
              }
            }}
          />
        ) : (
          <Modal transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Pilih Tanggal</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(_, date) => { if (date) setTempDate(date); }}
                  textColor="#fff"
                  themeVariant="dark"
                />
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.modalBtnClear} onPress={handleDateClear}>
                    <Text style={styles.modalBtnClearText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleDateConfirm}>
                    <Text style={styles.modalBtnConfirmText}>Terapkan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )
      )}
    </View>
  );
}

function ExploreCard({ event }: { event: Event }) {
  const imgUrl = getImageUrl(event.poster);
  const minPrice = getMinPrice(event);
  const available = getTotalAvailable(event);
  const isAvailable = event.status === 'open' && available > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push(`/event/${event.id}` as any)}
    >
      {/* Poster Image */}
      <ImageBackground
        source={imgUrl ? { uri: imgUrl } : require('@/assets/images/splash-icon.png')}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <View style={styles.cardOverlay} />

        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>
            {minPrice > 0
              ? `Rp.${minPrice.toLocaleString('id-ID')}`
              : 'Free'}
          </Text>
        </View>

        {/* Title & Artist */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.cardArtist} numberOfLines={1}>
            · {event.artist_name ?? ''}
          </Text>
        </View>
      </ImageBackground>

      {/* Bottom Info */}
      <View style={styles.cardFooter}>
        {/* Date */}
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={13} color={GRAY} />
          <Text style={styles.footerText}>
            {dayjs(event.event_date).format('MMM D, YYYY')}
          </Text>
        </View>

        {/* Venue */}
        <View style={styles.footerItem}>
          <Ionicons name="location-outline" size={13} color={GRAY} />
          <Text style={styles.footerText} numberOfLines={1}>
            {event.venue}
          </Text>
        </View>

        {/* Available badge */}
        <View style={[styles.availBadge, !isAvailable && styles.availBadgeClosed]}>
          <Text style={[styles.availText, !isAvailable && styles.availTextClosed]}>
            {isAvailable ? 'Available' : 'Closed'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 8,
  },
  headerTitle: {
    color: GRAY,
    fontSize: 13,
    fontWeight: '500',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  pageTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#475569',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },

  // Category
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#475569',
  },
  filterBtnActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  filterText: { color: GRAY, fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#1a1a2e', fontWeight: '700' },

  // Sort
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  sortBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#475569',
  },
  sortBtnActive: { borderColor: YELLOW },
  sortText: { color: GRAY, fontSize: 13 },
  sortTextActive: { color: YELLOW, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cardImage: {
    height: 160,
    justifyContent: 'flex-end',
  },
  cardImageStyle: { borderRadius: 0 },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: YELLOW,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  priceText: { color: '#1a1a2e', fontSize: 12, fontWeight: '700' },
  cardContent: {
    padding: 14,
    paddingRight: 120, // space for price badge
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardArtist: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: { color: GRAY, fontSize: 11 },
  availBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: GREEN,
  },
  availBadgeClosed: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: '#ef4444',
  },
  availText: { color: GREEN, fontSize: 11, fontWeight: '600' },
  availTextClosed: { color: '#ef4444' },

  // Empty
  center: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: GRAY, fontSize: 15 },

  // Date Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: '#475569',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  modalBtnClear: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalBtnClearText: { color: GRAY, fontSize: 15, fontWeight: '600' },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: YELLOW,
  },
  modalBtnConfirmText: { color: '#1a1a2e', fontSize: 15, fontWeight: '700' },
});
