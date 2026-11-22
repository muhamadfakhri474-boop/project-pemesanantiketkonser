// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  StatusBar, Share, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
import QRCode from 'react-native-qrcode-svg';
import { orderService, Order } from '@/services/order.service';
import { getImageUrl } from '@/utils/image';
import { Image } from 'expo-image';

const BG = '#0B1120';
const CARD = '#1E293B';
const CARD2 = '#334155';
const YELLOW = '#3B82F6';
const GRAY = '#94A3B8';

function getStatusStyle(status: Order['payment_status']) {
  switch (status) {
    case 'paid':      return { bg: '#1e3a5f', text: '#60a5fa', label: 'Paid' };
    case 'cancelled': return { bg: '#3f1f1f', text: '#f87171', label: 'Cancelled' };
    case 'rejected':  return { bg: '#3f1f1f', text: '#f87171', label: 'Rejected' };
    case 'failed':    return { bg: '#3f1f1f', text: '#f87171', label: 'Failed' };
    case 'expired':   return { bg: '#292524', text: '#a8a29e', label: 'Expired' };
    case 'pending':   return { bg: '#3f2f0f', text: '#fbbf24', label: 'Pending' };
    default:          return { bg: '#475569', text: GRAY,      label: status };
  }
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await orderService.getOrderById(Number(id));
        const data = res?.data || res?.order || res;
        if (!data?.id) throw new Error('Data order tidak valid');
        setOrder(data);
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.message || 'Gagal memuat detail pesanan');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Countdown timer untuk payment deadline
  useEffect(() => {
    if (!order?.payment_deadline || order.payment_status !== 'pending') {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = dayjs();
      const deadline = dayjs(order.payment_deadline);
      const diffSec = deadline.diff(now, 'second');

      if (diffSec <= 0) {
        setTimeLeft('Waktu Habis');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order?.payment_deadline, order?.payment_status]);

  const handleCancel = () => {
    Alert.alert(
      'Batalkan Pesanan?',
      'Pesanan yang dibatalkan tidak dapat dipulihkan. Kuota tiket dan kursi akan dikembalikan.',
      [
        { text: 'Tidak', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await orderService.cancelOrder(Number(id));
              Alert.alert(
                'Pesanan Dibatalkan',
                'Pesanan kamu berhasil dibatalkan.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/history' as any) }],
                { cancelable: false }
              );
            } catch (err: any) {
              const msg = err?.response?.data?.message || 'Gagal membatalkan pesanan.';
              Alert.alert('Error', msg);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={YELLOW} size="large" />
      </View>
    );
  }

  if (!order) return null;

  const status = getStatusStyle(order.payment_status);
  const imgUrl = getImageUrl(order.poster);
  const isPaid = order.payment_status === 'paid';
  const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? order.seats?.length ?? 0;

  // Data yang di-encode ke QR Code
  const qrData = JSON.stringify({
    orderId: order.id,
    event: order.event_title,
    customer: `ORD-${String(order.id).padStart(3, '0')}`,
    date: order.event_date,
    venue: order.venue,
    qty: totalQty,
    seats: order.seats?.map((s) => s.seat_label) || [],
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Tiket saya untuk ${order.event_title}\nOrder: ORD-${String(order.id).padStart(3, '0')}\nTanggal: ${dayjs(order.event_date).format('DD MMM YYYY')}\nVenue: ${order.venue}`,
      });
    } catch {}
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Detail</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Event Image */}
        {imgUrl && (
          <Image
            source={{ uri: imgUrl }}
            style={styles.eventImage}
            contentFit="cover"
          />
        )}

        <View style={styles.content}>
          {/* Order ID + Status */}
          <View style={styles.orderTopRow}>
            <Text style={styles.orderId}>ORD-{String(order.id).padStart(3, '0')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>

          {/* Payment Countdown jika status pending */}
          {order.payment_status === 'pending' && timeLeft && (
            <View style={styles.deadlineBox}>
              <Ionicons name="time-outline" size={16} color="#fbbf24" />
              <Text style={styles.deadlineLabel}>Batas Waktu Pembayaran:</Text>
              <Text style={styles.deadlineValue}>{timeLeft}</Text>
            </View>
          )}

          {/* Event Info */}
          <Text style={styles.eventTitle}>{order.event_title}</Text>
          <Text style={styles.artistName}>{order.artist_name}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={GRAY} />
            <Text style={styles.infoText}>
              {dayjs(order.event_date).format('dddd, DD MMMM YYYY')}
              {order.event_time ? ` · ${order.event_time.slice(0, 5)}` : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={15} color={GRAY} />
            <Text style={styles.infoText}>{order.venue}</Text>
          </View>

          <View style={styles.divider} />

          {/* Assigned Seats jika ada */}
          {order.seats && order.seats.length > 0 && (
            <View style={styles.seatsSection}>
              <Text style={styles.sectionTitle}>Kursi yang Dipesan</Text>
              <View style={styles.seatsList}>
                {order.seats.map((s) => (
                  <View key={s.event_seat_id} style={styles.seatTag}>
                    <Ionicons name="bookmark" size={12} color={YELLOW} />
                    <Text style={styles.seatTagText}>
                      {s.section_name} • {s.seat_label}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.divider} />
            </View>
          )}

          {/* Ticket Items */}
          <Text style={styles.sectionTitle}>Tickets</Text>
          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.ticketItem}>
              <View>
                <Text style={styles.ticketCategory}>{item.category_name}</Text>
                <Text style={styles.ticketQty}>x{item.quantity}</Text>
              </View>
              <Text style={styles.ticketPrice}>
                Rp{item.subtotal.toLocaleString('id-ID')}
              </Text>
            </View>
          ))}

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>
              Rp{order.total_price.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Order Date */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Order Date</Text>
            <Text style={styles.metaValue}>
              {dayjs(order.order_date).format('DD MMM YYYY, HH:mm')}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* QR Code — hanya tampil kalau paid */}
          {isPaid ? (
            <View style={styles.qrSection}>
              <Text style={styles.sectionTitle}>E-Ticket QR Code</Text>
              <Text style={styles.qrSubtitle}>
                Tunjukkan QR Code ini kepada panitia saat check-in di venue
              </Text>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrData}
                  size={200}
                  backgroundColor="#fff"
                  color="#0B1120"
                />
              </View>
              <Text style={styles.qrNote}>
                Scan QR Code ini untuk verifikasi keaslian tiket konser
              </Text>
            </View>
          ) : (
            <View style={styles.qrPending}>
              <Ionicons name="lock-closed-outline" size={32} color={GRAY} />
              <Text style={styles.qrPendingTitle}>QR Code Belum Tersedia</Text>
              <Text style={styles.qrPendingText}>
                {order.payment_status === 'pending'
                  ? 'QR Code akan aktif secara otomatis setelah pembayaran sukses diverifikasi.'
                  : 'Pesanan ini tidak dapat digunakan.'}
              </Text>
            </View>
          )}

          {/* Tombol Lanjut Bayar & Cancel Button — muncul jika status pending */}
          {order.payment_status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={() => router.push(`/payment/${order.id}` as any)}
                activeOpacity={0.85}
              >
                <Ionicons name="card-outline" size={18} color="#1a1a2e" />
                <Text style={styles.payNowBtnText}>Bayar Sekarang (Midtrans)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#ef4444" size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                    <Text style={styles.cancelBtnText}>Batalkan Pesanan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  loadingContainer: {
    flex: 1, backgroundColor: BG,
    justifyContent: 'center', alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38, height: 38,
    backgroundColor: CARD,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  shareBtn: {
    width: 38, height: 38,
    backgroundColor: CARD,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },

  // Image
  eventImage: { width: '100%', height: 180 },

  // Content
  content: { padding: 20 },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  orderId: { color: GRAY, fontSize: 13 },
  statusBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  // Deadline Box
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27200a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#78350f',
  },
  deadlineLabel: { color: '#fbbf24', fontSize: 12, fontWeight: '600' },
  deadlineValue: { color: '#fff', fontSize: 12, fontWeight: '800' },

  eventTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  artistName: { color: GRAY, fontSize: 14, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 6,
  },
  infoText: { color: '#D1D5DB', fontSize: 13 },

  divider: {
    height: 1, backgroundColor: '#475569',
    marginVertical: 16,
  },

  // Seats Section
  seatsSection: { marginBottom: 4 },
  seatsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  seatTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: CARD2, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#2d3748',
  },
  seatTagText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Tickets
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CARD2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  ticketCategory: { color: '#fff', fontSize: 14, fontWeight: '600' },
  ticketQty: { color: GRAY, fontSize: 12, marginTop: 2 },
  ticketPrice: { color: YELLOW, fontSize: 14, fontWeight: '700' },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  totalPrice: { color: YELLOW, fontSize: 16, fontWeight: '700' },

  // Meta
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: { color: GRAY, fontSize: 13 },
  metaValue: { color: '#D1D5DB', fontSize: 13 },

  // QR Code
  qrSection: { alignItems: 'center' },
  qrSubtitle: { color: GRAY, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  qrWrapper: {
    padding: 16, backgroundColor: '#fff',
    borderRadius: 18, marginBottom: 12,
  },
  qrNote: { color: GRAY, fontSize: 11, textAlign: 'center' },
  qrPending: {
    alignItems: 'center', padding: 24,
    backgroundColor: CARD, borderRadius: 16, gap: 8,
    borderWidth: 1, borderColor: '#475569',
  },
  qrPendingTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  qrPendingText: { color: GRAY, fontSize: 12, textAlign: 'center' },

  // Action Buttons
  actionButtons: { marginTop: 24, gap: 12 },
  payNowBtn: {
    backgroundColor: YELLOW, borderRadius: 12,
    paddingVertical: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  payNowBtnText: { color: '#1a1a2e', fontSize: 14, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#ef4444',
    gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
});
