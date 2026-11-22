// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  StatusBar, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
import { eventService, Event, TicketCategory, EventSeat } from '@/services/event.service';
import { orderService } from '@/services/order.service';
import { getImageUrl } from '@/utils/image';
import { useRealtime } from '@/hooks/useRealtime';

const BG = '#0B1120';
const CARD = '#1E293B';
const CARD2 = '#334155';
const YELLOW = '#3B82F6';
const GRAY = '#94A3B8';

// Palette warna konsisten untuk kategori tiket
const CATEGORY_PALETTE = [
  { main: '#A855F7', bg: 'rgba(168, 85, 247, 0.18)', border: '#A855F7', text: '#D8B4FE', label: 'VIP' },
  { main: '#3B82F6', bg: 'rgba(59, 130, 246, 0.18)', border: '#3B82F6', text: '#93C5FD', label: 'CAT 1' },
  { main: '#10B981', bg: 'rgba(16, 185, 129, 0.18)', border: '#10B981', text: '#6EE7B7', label: 'CAT 2' },
  { main: '#F59E0B', bg: 'rgba(245, 158, 11, 0.18)', border: '#F59E0B', text: '#FCD34D', label: 'CAT 3' },
  { main: '#EC4899', bg: 'rgba(236, 72, 153, 0.18)', border: '#EC4899', text: '#F472B6', label: 'CAT 4' },
];

function getCategoryColor(index: number) {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

// Metode Pembayaran
const BANK_METHODS = [
  { id: 'BCA', label: 'BCA', icon: '🏦' },
  { id: 'BRI', label: 'BRI', icon: '🏦' },
  { id: 'BNI', label: 'BNI', icon: '🏦' },
];

const EWALLET_METHODS = [
  { id: 'Dana', label: 'Dana', icon: '💳' },
  { id: 'OVO', label: 'OVO', icon: '💳' },
  { id: 'GoPay', label: 'GoPay', icon: '💳' },
];

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<EventSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter kategori aktif pada seat map
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<number | 'all'>('all');

  // Kursi yang dipilih
  const [selectedSeats, setSelectedSeats] = useState<EventSeat[]>([]);

  // Fallback mode kuota manual (jika pengguna memilih tanpa seat map)
  const [bookingMode, setBookingMode] = useState<'seat' | 'manual'>('seat');
  const [manualCategory, setManualCategory] = useState<TicketCategory | null>(null);
  const [manualQty, setManualQty] = useState(1);

  // Pembayaran
  const [paymentType, setPaymentType] = useState<'bank' | 'ewallet'>('bank');
  const [paymentMethod, setPaymentMethod] = useState<string>('BCA');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventRes, seatsRes] = await Promise.all([
          eventService.getEventById(Number(id)),
          eventService.getSeats(Number(id)).catch(() => []),
        ]);

        const evData = eventRes?.data || eventRes?.event || eventRes;
        setEvent(evData);

        const seatList: EventSeat[] = Array.isArray(seatsRes) ? seatsRes : (seatsRes?.data || []);
        setSeats(seatList);

        const cats: TicketCategory[] = evData?.ticket_categories ?? [];
        if (cats.length > 0) {
          setManualCategory(cats[0]);
        }
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.message || 'Gagal memuat data event & denah kursi');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time listener: refresh saat kuota berubah
    const { connect, on, off } = require('@/store/realtimeStore');
    connect();
    on('categories:changed', fetchData);
    return () => {
      off('categories:changed');
    };
  }, [id]);

  // Map category id ke color styling
  const categoryColorMap = useMemo(() => {
    const map = new Map<number, typeof CATEGORY_PALETTE[0]>();
    const cats: TicketCategory[] = event?.ticket_categories ?? [];
    cats.forEach((c, idx) => {
      map.set(c.id, getCategoryColor(idx));
    });
    return map;
  }, [event]);

  // Urutan ring dari stage ke luar: VVIP, VIP, Premium, Reguler.
  // Nama kategori berasal dari database, jadi pencocokan dibuat fleksibel.
  const getCategoryPriority = (name: string) => {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.includes('vvip')) return 0;
    if (normalized === 'vip' || normalized.includes('vip')) return 1;
    if (normalized.includes('premium')) return 2;
    if (normalized.includes('reguler') || normalized.includes('regular')) return 3;
    return 10;
  };

  // Group kursi berdasarkan ticket_category_id dan row_label.
  // Urutan ini juga menentukan radius lingkaran kursi.
  const groupedSeats = useMemo(() => {
    const cats = [...(event?.ticket_categories ?? [])].sort((a, b) => {
      const priorityDiff = getCategoryPriority(a.name) - getCategoryPriority(b.name);
      return priorityDiff || a.id - b.id;
    });
    return cats.map((cat, idx) => {
      // Gunakan warna berdasarkan posisi kategori asli dari backend agar sama
      // dengan card kategori (bukan berdasarkan urutan ring yang sudah disortir).
      const colorInfo = categoryColorMap.get(cat.id) || getCategoryColor(idx);
      const catSeats = seats.filter((s) => s.ticket_category_id === cat.id);

      // Group per row_label
      const rowsMap = new Map<string, EventSeat[]>();
      catSeats.forEach((seat) => {
        const r = seat.row_label || 'A';
        if (!rowsMap.has(r)) rowsMap.set(r, []);
        rowsMap.get(r)!.push(seat);
      });

      const rows = Array.from(rowsMap.entries()).map(([rowLabel, rowSeats]) => ({
        rowLabel,
        seats: rowSeats.sort((a, b) => a.seat_number - b.seat_number),
      }));

      return {
        category: cat,
        colorInfo,
        rows,
        totalSeats: catSeats.length,
        availableSeats: catSeats.filter((s) => (s.display_status || s.status) === 'available').length,
      };
    });
  }, [event, seats, categoryColorMap]);

  // Toggle seleksi kursi
  const toggleSeatSelection = (seat: EventSeat) => {
    const isAvailable = (seat.display_status || seat.status) === 'available';
    if (!isAvailable) {
      Alert.alert('Kursi Tidak Tersedia', `Kursi ${seat.seat_label} sudah dipesan atau diblokir.`);
      return;
    }

    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);
    if (isAlreadySelected) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 10) {
        Alert.alert('Batas Maksimal', 'Maksimal 10 kursi per transaksi.');
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
    }
  };

  const removeSeat = (seatId: number) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  // Kalkulasi total harga
  const seatTotalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);
  }, [selectedSeats]);

  const manualPrice = manualCategory ? Number(manualCategory.price) : 0;
  const manualTotalPrice = manualPrice * manualQty;

  const currentTotalPrice = bookingMode === 'seat' ? seatTotalPrice : manualTotalPrice;
  const currentTotalQty = bookingMode === 'seat' ? selectedSeats.length : manualQty;

  // Submit Order
  const handleSubmitOrder = async () => {
    if (!event) {
      Alert.alert('Data Belum Siap', 'Data event masih dimuat. Silakan coba lagi.');
      return;
    }

    if (bookingMode === 'seat' && selectedSeats.length === 0) {
      Alert.alert('Pilih Kursi', 'Pilih minimal 1 kursi pada denah sebelum melanjutkan.');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Pilih Pembayaran', 'Pilih metode pembayaran terlebih dahulu.');
      return;
    }

    let payloadItems: { ticket_category_id: number; quantity: number }[] = [];
    let seatIds: number[] = [];

    if (bookingMode === 'seat') {
      if (selectedSeats.length === 0) {
        Alert.alert('Pilih Kursi', 'Pilih minimal 1 kursi pada denah sebelum melanjutkan.');
        return;
      }

      // Grouping items berdasarkan category
      const map = new Map<number, number>();
      selectedSeats.forEach((s) => {
        map.set(s.ticket_category_id, (map.get(s.ticket_category_id) || 0) + 1);
      });

      payloadItems = Array.from(map.entries()).map(([ticket_category_id, quantity]) => ({
        ticket_category_id,
        quantity,
      }));
      seatIds = selectedSeats.map((s) => s.id);
    } else {
      if (!manualCategory) {
        Alert.alert('Pilih Kategori', 'Pilih kategori tiket terlebih dahulu.');
        return;
      }
      payloadItems = [{ ticket_category_id: manualCategory.id, quantity: manualQty }];
    }

    try {
      setSubmitting(true);
      const res = await orderService.createOrder({
        event_id: event.id,
        items: payloadItems,
        seat_ids: seatIds.length > 0 ? seatIds : undefined,
      });

      const orderId = res?.order_id || res?.data?.order_id || res?.data?.id || res?.id;
      if (!orderId) throw new Error('Order ID tidak ditemukan dari server');

      // Langsung menuju ke layar pembayaran Midtrans
      router.replace(`/payment/${orderId}` as any);
    } catch (err: any) {
      console.error('Create order error:', err?.response?.data || err?.message || err);
      const msg = err?.response?.data?.message || err?.message || 'Gagal membuat pesanan. Coba lagi.';
      Alert.alert('Gagal Memesan', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <ActivityIndicator color={YELLOW} size="large" />
        <Text style={styles.loadingText}>Memuat denah kursi & event...</Text>
      </View>
    );
  }

  if (!event) return null;

  const cats = event.ticket_categories ?? [];
  const imgUrl = getImageUrl(event.poster);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerTitle}>Pilih Kursi</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            Pilih kursi favoritmu pada denah di bawah ini
          </Text>
        </View>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, bookingMode === 'seat' && styles.modeBtnActive]}
            onPress={() => setBookingMode('seat')}
          >
            <Ionicons name="grid-outline" size={14} color={bookingMode === 'seat' ? '#1a1a2e' : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, bookingMode === 'manual' && styles.modeBtnActive]}
            onPress={() => setBookingMode('manual')}
          >
            <Ionicons name="list-outline" size={14} color={bookingMode === 'manual' ? '#1a1a2e' : '#fff'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Event Header Mini Card (sesuai referensi TixVerse) */}
        <View style={styles.eventCard}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.eventImg} contentFit="cover" />
          ) : (
            <View style={[styles.eventImg, styles.placeholderImg]}>
              <Ionicons name="musical-notes" size={24} color={GRAY} />
            </View>
          )}
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
            <View style={styles.eventMetaRow}>
              <Ionicons name="calendar-outline" size={12} color={YELLOW} />
              <Text style={styles.eventMetaText}>
                {dayjs(event.event_date).format('ddd, DD MMM YYYY')}
                {event.event_time ? ` • ${event.event_time.slice(0, 5)} WIB` : ''}
              </Text>
            </View>
            <View style={styles.eventMetaRow}>
              <Ionicons name="location-outline" size={12} color={GRAY} />
              <Text style={styles.eventMetaText} numberOfLines={1}>{event.venue}</Text>
            </View>
            {event.artist_name && (
              <View style={styles.eventMetaRow}>
                <Ionicons name="mic-outline" size={12} color={GRAY} />
                <Text style={styles.eventMetaText} numberOfLines={1}>{event.artist_name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Category Legend & Price Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catLegendScroll}
          style={styles.catLegendContainer}
        >
          <TouchableOpacity
            style={[
              styles.catLegendPill,
              activeCategoryFilter === 'all' && styles.catLegendPillActive,
            ]}
            onPress={() => setActiveCategoryFilter('all')}
          >
            <Text style={[styles.catLegendText, activeCategoryFilter === 'all' && styles.catLegendTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>

          {cats.map((cat, idx) => {
            const color = categoryColorMap.get(cat.id) || getCategoryColor(idx);
            const isFilterActive = activeCategoryFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catLegendPill,
                  isFilterActive && { borderColor: color.main, backgroundColor: color.bg },
                ]}
                onPress={() => setActiveCategoryFilter(isFilterActive ? 'all' : cat.id)}
              >
                <View style={[styles.catColorDot, { backgroundColor: color.main }]} />
                <View>
                  <Text style={[styles.catLegendText, isFilterActive && { color: color.text, fontWeight: '700' }]}>
                    {cat.name}
                  </Text>
                  <Text style={styles.catLegendPrice}>
                    Rp{Number(cat.price).toLocaleString('id-ID')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Mode 1: Interactive Seat Map (Denah Kursi) */}
        {bookingMode === 'seat' ? (
          <View style={styles.seatMapCard}>
            {/* Denah stadion melingkar: panggung di tengah, kategori terdekat di dalam */}
            <View style={styles.circularMap}>
              <View style={styles.centerStage}>
                <Ionicons name="mic" size={22} color={YELLOW} />
                <Text style={styles.centerStageText}>STAGE</Text>
              </View>
              {groupedSeats.map(({ category, colorInfo, rows }) => {
                if (activeCategoryFilter !== 'all' && activeCategoryFilter !== category.id) return null;
                const ringSeats = rows.flatMap((row) => row.seats);
                const categoryIndex = groupedSeats.findIndex((g) => g.category.id === category.id);
                const radius = 72 + categoryIndex * 34;
                return ringSeats.map((seat, seatIndex) => {
                  const angle = (seatIndex / Math.max(ringSeats.length, 1)) * Math.PI * 2 - Math.PI / 2;
                  const left = 160 + Math.cos(angle) * radius - 14;
                  const top = 160 + Math.sin(angle) * radius - 14;
                  const status = seat.display_status || seat.status;
                  const isAvailable = status === 'available';
                  const isSold = status === 'sold' || status === 'held';
                  const isBlocked = status === 'blocked';
                  const isSelected = selectedSeats.some((s) => s.id === seat.id);
                  return (
                    <TouchableOpacity key={seat.id} style={[styles.circularSeat, { left, top },
                      isAvailable && { borderColor: colorInfo.main, backgroundColor: colorInfo.bg },
                      isSelected && { backgroundColor: colorInfo.main, borderColor: '#fff' },
                      isSold && styles.seatSold, isBlocked && styles.seatBlocked]}
                      onPress={() => toggleSeatSelection(seat)} disabled={!isAvailable} activeOpacity={0.7}>
                      {isSelected ? <Ionicons name="checkmark" size={11} color="#fff" /> :
                        <Text style={[styles.circularSeatText, isAvailable && { color: colorInfo.text },
                          isSold && styles.seatNumberTextSold, isBlocked && styles.seatNumberTextBlocked]}>{seat.seat_number}</Text>}
                    </TouchableOpacity>
                  );
                });
              })}
            </View>
            <View style={styles.circularLegend}>
              {groupedSeats.map(({ category, colorInfo }) => (
                <View key={category.id} style={styles.circularLegendItem}>
                  <View style={[styles.catColorDot, { backgroundColor: colorInfo.main }]} />
                  <Text style={styles.legendText}>{category.name}</Text>
                </View>
              ))}
            </View>

            {/* Stadium Bottom Label */}
            <View style={styles.tribunBottom}>
              <Text style={styles.tribunBottomLabel}>Tribun Tengah & Pintu Masuk</Text>
            </View>

            {/* Seat Map Legend (Sesuai Referensi Gambar) */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendAvail]} />
                <Text style={styles.legendText}>Tersedia</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendSelected]} />
                <Text style={styles.legendText}>Dipilih</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendSold]} />
                <Text style={styles.legendText}>Terisi</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.legendBlocked]} />
                <Text style={styles.legendText}>Tidak Tersedia</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Mode 2: Pemilihan Kategori Manual / Kuota Cepat */
          <View style={styles.manualCard}>
            <Text style={styles.sectionHeaderTitle}>Pilih Kategori Tiket</Text>
            <View style={styles.manualCatGrid}>
              {cats.map((cat, idx) => {
                const color = getCategoryColor(idx);
                const isSelected = manualCategory?.id === cat.id;
                const avail = cat.available ?? cat.remaining_quota ?? cat.quota;
                const isSoldOut = avail <= 0;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.manualCatItem,
                      isSelected && { borderColor: color.main, backgroundColor: color.bg },
                      isSoldOut && styles.manualCatItemDisabled,
                    ]}
                    onPress={() => {
                      if (!isSoldOut) {
                        setManualCategory(cat);
                        setManualQty(1);
                      }
                    }}
                    disabled={isSoldOut}
                  >
                    <View style={[styles.catColorDot, { backgroundColor: color.main }]} />
                    <Text style={[styles.manualCatName, isSelected && { color: color.text }]}>
                      {cat.name}
                    </Text>
                    <Text style={[styles.manualCatPrice, isSelected && { color: color.text }]}>
                      Rp{Number(cat.price).toLocaleString('id-ID')}
                    </Text>
                    <Text style={styles.manualCatAvail}>
                      {isSoldOut ? 'Sold Out' : `Sisa ${avail} tiket`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quantity Selector */}
            <View style={styles.manualQtyBox}>
              <View>
                <Text style={styles.manualQtyLabel}>{manualCategory?.name || 'Kategori'}</Text>
                <Text style={styles.manualQtyPrice}>
                  Rp{manualPrice.toLocaleString('id-ID')} / tiket
                </Text>
              </View>

              <View style={styles.manualQtyControls}>
                <TouchableOpacity
                  style={[styles.qtyBtn, manualQty <= 1 && styles.qtyBtnDisabled]}
                  onPress={() => setManualQty((q) => Math.max(1, q - 1))}
                  disabled={manualQty <= 1}
                >
                  <Ionicons name="remove" size={18} color={manualQty <= 1 ? GRAY : '#fff'} />
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{manualQty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, manualQty >= 10 && styles.qtyBtnDisabled]}
                  onPress={() => setManualQty((q) => Math.min(10, q + 1))}
                  disabled={manualQty >= 10}
                >
                  <Ionicons name="add" size={18} color={manualQty >= 10 ? GRAY : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Kursi yang Dipilih (Chips / Tags List seperti di Gambar Referensi) */}
        {bookingMode === 'seat' && (
          <View style={styles.selectedSeatsSection}>
            <View style={styles.selectedSeatsHeader}>
              <Text style={styles.sectionHeaderTitle}>Kursi yang Dipilih</Text>
              <Text style={styles.selectedSeatsCount}>{selectedSeats.length} kursi</Text>
            </View>

            {selectedSeats.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedChipsScroll}
              >
                {selectedSeats.map((seat) => {
                  const catColor = categoryColorMap.get(seat.ticket_category_id) || CATEGORY_PALETTE[0];
                  return (
                    <View
                      key={seat.id}
                      style={[styles.seatChip, { borderColor: catColor.main, backgroundColor: catColor.bg }]}
                    >
                      <View style={[styles.seatChipBadge, { backgroundColor: catColor.main }]}>
                        <Text style={styles.seatChipBadgeText}>{seat.category_name || 'TICKET'}</Text>
                      </View>
                      <Text style={[styles.seatChipLabel, { color: catColor.text }]}>
                        {seat.seat_label}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeSeat(seat.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={16} color={catColor.main} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.noSeatsBox}>
                <Ionicons name="hand-left-outline" size={20} color={GRAY} />
                <Text style={styles.noSeatsText}>
                  Ketuk salah satu kursi pada denah untuk memilih tempat dudukmu
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Detail Pemesanan Card (seperti sidebar kanan pada referensi) */}
        <View style={styles.orderSummaryCard}>
          <Text style={styles.sectionHeaderTitle}>Detail Pemesanan</Text>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryItemLabel}>Kategori</Text>
            <Text style={styles.summaryItemValue}>
              {bookingMode === 'seat'
                ? selectedSeats.length > 0
                  ? Array.from(new Set(selectedSeats.map((s) => s.category_name || 'VIP'))).join(', ')
                  : '-'
                : manualCategory?.name || '-'}
            </Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryItemLabel}>Jumlah Kursi</Text>
            <Text style={styles.summaryItemValue}>{currentTotalQty} Kursi</Text>
          </View>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryItemLabel}>Biaya Layanan</Text>
            <Text style={styles.summaryItemValue}>Gratis (Rp0)</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryTotalLabel}>Total Harga</Text>
            <Text style={styles.summaryTotalAmount}>
              Rp{currentTotalPrice.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Metode Pembayaran */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionHeaderTitle}>Metode Pembayaran</Text>

          {/* Toggle Bank / E-Wallet */}
          <View style={styles.payToggle}>
            <TouchableOpacity
              style={[styles.payToggleBtn, paymentType === 'bank' && styles.payToggleBtnActive]}
              onPress={() => {
                setPaymentType('bank');
                setPaymentMethod('BCA');
              }}
            >
              <Text style={[styles.payToggleText, paymentType === 'bank' && styles.payToggleTextActive]}>
                Transfer Bank
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.payToggleBtn, paymentType === 'ewallet' && styles.payToggleBtnActive]}
              onPress={() => {
                setPaymentType('ewallet');
                setPaymentMethod('Dana');
              }}
            >
              <Text style={[styles.payToggleText, paymentType === 'ewallet' && styles.payToggleTextActive]}>
                E-Wallet
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grid Pilihan Metode */}
          <View style={styles.payGrid}>
            {(paymentType === 'bank' ? BANK_METHODS : EWALLET_METHODS).map((m) => {
              const isSelected = paymentMethod === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.payItem, isSelected && styles.payItemSelected]}
                  onPress={() => setPaymentMethod(m.id)}
                >
                  <Text style={styles.payIcon}>{m.icon}</Text>
                  <Text style={[styles.payLabel, isSelected && styles.payLabelSelected]}>
                    {m.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={16} color={YELLOW} style={styles.payCheck} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Total Pembayaran</Text>
          <Text style={styles.bottomPriceValue}>
            Rp{currentTotalPrice.toLocaleString('id-ID')}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            (currentTotalQty === 0 || submitting) && styles.checkoutBtnDisabled,
          ]}
          onPress={() => {
            console.log('Checkout pressed', {
              bookingMode,
              selectedSeats: selectedSeats.length,
              total: currentTotalPrice,
              paymentMethod,
            });
            void handleSubmitOrder();
          }}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#1a1a2e" size="small" />
          ) : (
            <View style={styles.checkoutBtnRow}>
              <Text style={styles.checkoutBtnText}>Lanjut ke Pembayaran</Text>
              <Ionicons name="arrow-forward" size={16} color="#1a1a2e" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  loadingContainer: {
    flex: 1, backgroundColor: BG,
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingText: { color: GRAY, fontSize: 13 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  // Top Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    backgroundColor: BG, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, backgroundColor: CARD,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2d3748',
  },
  headerTextWrapper: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: GRAY, fontSize: 11, marginTop: 2 },
  modeToggle: {
    flexDirection: 'row', backgroundColor: CARD,
    borderRadius: 10, padding: 3, borderWidth: 1, borderColor: '#2d3748',
  },
  modeBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  modeBtnActive: { backgroundColor: YELLOW },

  // Event Mini Card (Referensi TixVerse)
  eventCard: {
    flexDirection: 'row', backgroundColor: CARD,
    borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#475569',
    marginBottom: 14, alignItems: 'center', gap: 12,
  },
  eventImg: { width: 72, height: 72, borderRadius: 10 },
  placeholderImg: { backgroundColor: CARD2, justifyContent: 'center', alignItems: 'center' },
  eventInfo: { flex: 1, gap: 3 },
  eventTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventMetaText: { color: GRAY, fontSize: 11 },

  // Category Legend Scroll Bar
  catLegendContainer: { marginBottom: 16 },
  catLegendScroll: { gap: 8, paddingVertical: 4 },
  catLegendPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: 8, borderWidth: 1, borderColor: '#475569', gap: 8,
  },
  catLegendPillActive: { borderColor: YELLOW, backgroundColor: '#1e2418' },
  catLegendText: { color: '#D1D5DB', fontSize: 12, fontWeight: '600' },
  catLegendTextActive: { color: YELLOW },
  catLegendPrice: { color: GRAY, fontSize: 10 },
  catColorDot: { width: 10, height: 10, borderRadius: 5 },

  // Seat Map Card
  seatMapCard: {
    backgroundColor: CARD, borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: '#475569',
    marginBottom: 16, overflow: 'hidden',
  },

  // Stage Graphic
  stageContainer: { alignItems: 'center', marginBottom: 20 },
  circularMap: {
    width: 320, height: 320, alignSelf: 'center', position: 'relative',
    borderRadius: 160, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#263449',
    marginVertical: 8,
  },
  centerStage: {
    position: 'absolute', left: 110, top: 110, width: 100, height: 100,
    borderRadius: 50, backgroundColor: '#172235', borderWidth: 2, borderColor: YELLOW,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  centerStageText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 3 },
  circularSeat: {
    position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', zIndex: 3,
  },
  circularSeatText: { fontSize: 8, fontWeight: '700' },
  circularLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 12 },
  circularLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  stageTrapezoid: {
    width: '78%', height: 42,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#334155',
    position: 'relative', overflow: 'hidden',
  },
  stageText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 3 },
  stageLightGlow: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3,
    backgroundColor: YELLOW, borderRadius: 2,
    shadowColor: YELLOW, shadowOpacity: 0.9, shadowRadius: 8, elevation: 4,
  },
  stageSub: { color: GRAY, fontSize: 9, letterSpacing: 2, marginTop: 4 },

  // Tribun Indicators
  tribunRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 8, marginBottom: 12,
  },
  tribunLabel: { color: '#4B5563', fontSize: 10, fontStyle: 'italic' },
  tribunBottom: { alignItems: 'center', marginVertical: 12 },
  tribunBottomLabel: { color: '#4B5563', fontSize: 10, fontStyle: 'italic' },

  // Sections
  sectionsContainer: { gap: 14 },
  sectionBlock: {
    backgroundColor: '#0f172a', borderRadius: 14,
    padding: 10, borderWidth: 1, borderColor: '#1e293b',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10, paddingHorizontal: 4,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionCategoryTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sectionPriceTag: { color: GRAY, fontSize: 11 },
  sectionAvailCount: { color: GRAY, fontSize: 11 },

  // Rows and Seats
  rowContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8, gap: 6,
  },
  rowLabelBadge: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
  },
  rowLabelText: { color: GRAY, fontSize: 10, fontWeight: '700' },
  seatsRowScroll: { gap: 6, paddingHorizontal: 2 },

  // Seat Button
  seatItem: {
    width: 38, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  seatNumberText: { fontSize: 10, fontWeight: '700' },
  seatSold: {
    backgroundColor: '#1e293b', borderColor: '#334155', opacity: 0.5,
  },
  seatNumberTextSold: { color: '#64748b', textDecorationLine: 'line-through' },
  seatBlocked: {
    backgroundColor: '#1E293B', borderColor: '#475569', opacity: 0.3,
  },
  seatNumberTextBlocked: { color: '#475569' },

  // Legend Bar (Sesuai Referensi)
  legendContainer: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1e293b',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 14, height: 14, borderRadius: 4 },
  legendAvail: { backgroundColor: 'rgba(59, 130, 246, 0.4)', borderWidth: 1, borderColor: '#3B82F6' },
  legendSelected: { backgroundColor: '#A855F7', borderWidth: 1, borderColor: '#fff' },
  legendSold: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#475569' },
  legendBlocked: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#475569' },
  legendText: { color: GRAY, fontSize: 10 },

  // Manual Mode Card
  manualCard: {
    backgroundColor: CARD, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#475569', marginBottom: 16,
  },
  manualCatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  manualCatItem: {
    flex: 1, minWidth: '45%', backgroundColor: CARD2,
    borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#2d3748',
  },
  manualCatItemDisabled: { opacity: 0.4 },
  manualCatName: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 4 },
  manualCatPrice: { color: YELLOW, fontSize: 12, fontWeight: '600', marginTop: 2 },
  manualCatAvail: { color: GRAY, fontSize: 10, marginTop: 4 },
  manualQtyBox: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: CARD2, borderRadius: 12,
    padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#2d3748',
  },
  manualQtyLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  manualQtyPrice: { color: GRAY, fontSize: 11, marginTop: 2 },
  manualQtyControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: {
    width: 34, height: 34, backgroundColor: CARD,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#374151',
  },
  qtyBtnDisabled: { opacity: 0.3 },
  qtyNum: { color: '#fff', fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  // Selected Seats Section (Sesuai Referensi Gambar)
  selectedSeatsSection: {
    backgroundColor: CARD, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#475569', marginBottom: 16,
  },
  selectedSeatsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionHeaderTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  selectedSeatsCount: { color: YELLOW, fontSize: 12, fontWeight: '700' },
  selectedChipsScroll: { gap: 8 },
  seatChip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1.5, gap: 6,
  },
  seatChipBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  seatChipBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  seatChipLabel: { fontSize: 12, fontWeight: '700' },
  noSeatsBox: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingVertical: 8,
  },
  noSeatsText: { color: GRAY, fontSize: 12, flex: 1 },

  // Order Summary Card
  orderSummaryCard: {
    backgroundColor: CARD, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#475569', marginBottom: 16,
    gap: 10,
  },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItemLabel: { color: GRAY, fontSize: 13 },
  summaryItemValue: { color: '#D1D5DB', fontSize: 13, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#475569', marginVertical: 4 },
  summaryTotalLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  summaryTotalAmount: { color: YELLOW, fontSize: 17, fontWeight: '800' },

  // Payment Section
  paymentSection: {
    backgroundColor: CARD, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#475569', marginBottom: 16,
  },
  payToggle: {
    flexDirection: 'row', backgroundColor: CARD2,
    borderRadius: 10, padding: 4, marginVertical: 12,
  },
  payToggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  payToggleBtnActive: { backgroundColor: YELLOW },
  payToggleText: { color: GRAY, fontSize: 12, fontWeight: '600' },
  payToggleTextActive: { color: '#1a1a2e', fontWeight: '700' },
  payGrid: { flexDirection: 'row', gap: 8 },
  payItem: {
    flex: 1, backgroundColor: CARD2, borderRadius: 10,
    padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#2d3748',
    gap: 4, position: 'relative',
  },
  payItemSelected: { borderColor: YELLOW, backgroundColor: '#1f2818' },
  payIcon: { fontSize: 20 },
  payLabel: { color: '#D1D5DB', fontSize: 12, fontWeight: '600' },
  payLabelSelected: { color: YELLOW },
  payCheck: { position: 'absolute', top: 6, right: 6 },

  // Bottom Sticky Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1E293B', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: '#475569',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, elevation: 12,
  },
  bottomPriceCol: { gap: 2 },
  bottomPriceLabel: { color: GRAY, fontSize: 11 },
  bottomPriceValue: { color: YELLOW, fontSize: 18, fontWeight: '800' },
  checkoutBtn: {
    backgroundColor: YELLOW, borderRadius: 30,
    paddingHorizontal: 22, paddingVertical: 14,
  },
  checkoutBtnDisabled: { opacity: 0.5 },
  checkoutBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkoutBtnText: { color: '#1a1a2e', fontSize: 14, fontWeight: '700' },
});
