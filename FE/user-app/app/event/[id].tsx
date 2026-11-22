// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  StatusBar, Alert, ImageBackground,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
import { eventService, Event, TicketCategory } from '@/services/event.service';
import { getImageUrl } from '@/utils/image';
import { useRealtime } from '@/hooks/useRealtime';

const BG = '#0B1120';
const CARD = '#1E293B';
const CARD2 = '#334155';
const YELLOW = '#3B82F6';
const GRAY = '#94A3B8';
const GREEN = '#22c55e';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await eventService.getEventById(Number(id));
        const data = res?.data || res?.event || res;
        setEvent(data);
        // Auto select kategori pertama
        const cats = data?.ticket_categories ?? [];
        if (cats.length > 0) setSelectedCategory(cats[0]);
      } catch {
        Alert.alert('Error', 'Gagal memuat detail konser');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetch();

    // Real-time listener: refresh detail saat kuota berubah
    const { connect, on, off } = require('@/store/realtimeStore');
    connect();
    on('categories:changed', fetch);
    return () => {
      off('categories:changed');
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={YELLOW} size="large" />
      </View>
    );
  }

  if (!event) return null;

  const imgUrl = getImageUrl(event.poster);
  const artistImgUrl = getImageUrl(event.artist_photo);
  const cats: TicketCategory[] = event.ticket_categories ?? [];
  const isOpen = event.status === 'open';

  // Hitung total quota dan remaining untuk progress bar
  const totalQuota = cats.reduce((s, c) => s + c.quota, 0);
  const totalRemaining = cats.reduce((s, c) => s + (c.available ?? c.quota), 0);
  const soldPercent = totalQuota > 0 ? ((totalQuota - totalRemaining) / totalQuota) * 100 : 0;

  const minPrice = cats.length > 0
    ? cats.reduce((min, c) => Math.min(min, Number(c.price)), Number(cats[0].price))
    : 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Detail Konser</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={imgUrl ? { uri: imgUrl } : require('@/assets/images/splash-icon.png')}
            style={styles.heroImage}
          >
            <View style={styles.heroOverlay} />
            {/* Status badge */}
            <View style={[styles.heroBadge, { backgroundColor: isOpen ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)' }]}>
              <Text style={styles.heroBadgeText}>{isOpen ? 'Open' : 'Closed'}</Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.content}>
          {/* Title & Artist */}
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.artistRow}>
            {artistImgUrl ? (
              <Image source={{ uri: artistImgUrl }} style={styles.artistAvatar} contentFit="cover" />
            ) : (
              <View style={styles.artistAvatarPlaceholder}>
                <Ionicons name="person" size={14} color={GRAY} />
              </View>
            )}
            <Text style={styles.artistName}>{event.artist_name}</Text>
          </View>

          {/* Date, Time, Venue chips */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Ionicons name="calendar-outline" size={13} color={YELLOW} />
              <Text style={styles.chipText}>{dayjs(event.event_date).format('MMM D, YYYY')}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={13} color={YELLOW} />
              <Text style={styles.chipText}>
                {event.event_time ? event.event_time.slice(0, 5) : '--:--'}
              </Text>
            </View>
          </View>
          <View style={[styles.chip, styles.chipFull]}>
            <Ionicons name="location-outline" size={13} color={YELLOW} />
            <Text style={styles.chipText}>{event.venue}, {event.city}</Text>
          </View>

          {/* About */}
          {event.description ? (
            <>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{event.description}</Text>
            </>
          ) : null}

          {/* Facilities (static) */}
          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.facilitiesGrid}>
            {[
              { icon: 'car-outline', label: 'Parking' },
              { icon: 'restaurant-outline', label: 'Food & Drink' },
              { icon: 'wifi-outline', label: 'Free WiFi' },
              { icon: 'medkit-outline', label: 'First Aid' },
            ].map((f) => (
              <View key={f.label} style={styles.facilityItem}>
                <View style={styles.facilityIcon}>
                  <Ionicons name={f.icon as any} size={18} color={YELLOW} />
                </View>
                <Text style={styles.facilityLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* Ticket Categories */}
          <Text style={styles.sectionTitle}>Ticket Categories</Text>
          <View style={styles.categoriesTable}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Category</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Price</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Qty</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Available</Text>
            </View>
            {cats.map((cat) => {
              const avail = cat.available ?? cat.remaining_quota ?? cat.quota;
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.tableRow, isSelected && styles.tableRowSelected]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.tableCell, styles.tableCellText, { flex: 2 }]}>{cat.name}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, { color: YELLOW }]}>
                    Rp{Number(cat.price).toLocaleString('id-ID')}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellText]}>{cat.quota}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, { color: avail > 0 ? GREEN : '#ef4444' }]}>
                    {avail}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Category Benefits — berubah saat pilih kategori */}
          {selectedCategory && (
            <View style={styles.benefitsSection}>
              <View style={styles.benefitsHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory.name} Benefits
                </Text>
                <View style={styles.benefitsBadge}>
                  <Text style={styles.benefitsBadgeText}>{selectedCategory.name}</Text>
                </View>
              </View>
              <View style={styles.benefitsBox}>
                {selectedCategory.benefits
                  ? selectedCategory.benefits.split('|').map((b, i) => (
                      <View key={i} style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                        <Text style={styles.benefitText}>{b.trim()}</Text>
                      </View>
                    ))
                  : (
                    <Text style={styles.noBenefits}>Tidak ada benefit tersedia</Text>
                  )
                }
              </View>
            </View>
          )}

          {/* Event Rules */}
          <Text style={styles.sectionTitle}>Event Rules</Text>
          <View style={styles.rulesBox}>
            {[
              'Dilarang membawa senjata tajam atau benda berbahaya.',
              'Dilarang membawa makanan dan minuman dari luar venue.',
              'Harap menjaga kebersihan area konser.',
              'Tiket tidak dapat dipindahtangankan.',
              'Penonton wajib mematuhi instruksi panitia.',
              'Anak di bawah 17 tahun harus didampingi orang tua.',
            ].map((rule, i) => (
              <View key={i} style={styles.ruleItem}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>

          {/* Ticket Availability Progress */}
          <Text style={styles.sectionTitle}>Ticket Availability</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressBar, { width: `${Math.min(soldPercent, 100)}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>{totalRemaining} remaining</Text>
              <Text style={[styles.progressLabel, { color: GREEN }]}>
                {totalRemaining > 0 ? 'Available' : 'Sold Out'}
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Bar — Book Ticket */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomFrom}>Tickets Starting from</Text>
          <Text style={styles.bottomPrice}>
            Rp{minPrice.toLocaleString('id-ID')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, !isOpen && styles.bookBtnDisabled]}
          disabled={!isOpen}
          onPress={() => router.push(`/booking/${event.id}` as any)}
        >
          <Text style={styles.bookBtnText}>
            {isOpen ? 'Book Ticket' : 'Closed'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  topNav: {
    height: 82,
    paddingHorizontal: 18,
    paddingTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  navBackBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#334155',
  },
  navTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  navSpacer: { width: 38 },
  scrollContent: { paddingTop: 0, paddingBottom: 32 },
  loadingContainer: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },

  // Hero
  heroContainer: { width: '100%', height: 260 },
  heroImage: { width: '100%', height: '100%', justifyContent: 'space-between' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtn: {
    margin: 52,
    marginBottom: 0,
    width: 38, height: 38,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Content
  content: { padding: 20 },
  eventTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },

  // Artist
  artistRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  artistAvatar: { width: 28, height: 28, borderRadius: 14 },
  artistAvatarPlaceholder: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: CARD2, alignItems: 'center', justifyContent: 'center',
  },
  artistName: { color: GRAY, fontSize: 14 },

  // Chips
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: CARD2, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#2d3748',
  },
  chipFull: { alignSelf: 'flex-start', marginBottom: 20 },
  chipText: { color: '#D1D5DB', fontSize: 12 },

  // Section
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  description: { color: '#9CA3AF', fontSize: 14, lineHeight: 22, marginBottom: 20 },

  // Facilities
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  facilityItem: { alignItems: 'center', gap: 6, width: '22%' },
  facilityIcon: {
    width: 44, height: 44,
    backgroundColor: CARD2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  facilityLabel: { color: GRAY, fontSize: 11, textAlign: 'center' },

  // Categories Table
  categoriesTable: {
    backgroundColor: CARD,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#475569',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  tableRowSelected: { backgroundColor: '#1a2640' },
  tableHeader: { backgroundColor: '#0f172a' },
  tableHeaderText: { color: GRAY, fontSize: 11, fontWeight: '600' },
  tableCell: { flex: 1, paddingHorizontal: 2 },
  tableCellText: { color: '#D1D5DB', fontSize: 12 },

  // Benefits
  benefitsSection: { marginBottom: 20 },
  benefitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitsBadge: {
    backgroundColor: 'rgba(245,197,24,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: YELLOW,
  },
  benefitsBadgeText: { color: YELLOW, fontSize: 11, fontWeight: '700' },
  benefitsBox: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: { color: '#D1D5DB', fontSize: 13, flex: 1 },
  noBenefits: { color: GRAY, fontSize: 13 },

  // Rules
  rulesBox: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#475569',
    gap: 8,
  },
  ruleItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  ruleDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: YELLOW, marginTop: 6, flexShrink: 0,
  },
  ruleText: { color: '#9CA3AF', fontSize: 13, flex: 1, lineHeight: 20 },

  // Progress
  progressContainer: { marginBottom: 20 },
  progressBg: {
    height: 8, backgroundColor: '#475569',
    borderRadius: 4, overflow: 'hidden', marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: YELLOW,
    borderRadius: 4,
  },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: GRAY, fontSize: 12 },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  bottomFrom: { color: GRAY, fontSize: 12 },
  bottomPrice: { color: YELLOW, fontSize: 18, fontWeight: '700' },
  bookBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  bookBtnDisabled: { backgroundColor: '#374151' },
  bookBtnText: { color: '#1a1a2e', fontSize: 14, fontWeight: '700' },
});
