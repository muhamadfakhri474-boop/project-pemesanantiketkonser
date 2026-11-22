// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import { orderService, Order } from '@/services/order.service';

const BG = '#0B1120';
const CARD = '#1E293B';
const GRAY = '#94A3B8';
const YELLOW = '#3B82F6';

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

export default function HistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getMyOrders();
      const data = res?.data || res?.orders || res || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log('Fetch orders error:', err?.message);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <FlatList
        data={orders}
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
              <Ionicons name="receipt-outline" size={52} color={GRAY} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your booking history will appear here</Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/explore' as any)}
              >
                <Text style={styles.exploreBtnText}>Browse Concerts</Text>
              </TouchableOpacity>
            </View>
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Order History</Text>
            {orders.length > 0 && (
              <Text style={styles.headerSub}>{orders.length} Booking</Text>
            )}
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const status = getStatusStyle(order.payment_status);
  const firstItem = order.items?.[0];
  const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/order/${order.id}` as any)}
    >
      {/* Order ID + Status */}
      <View style={styles.cardTop}>
        <Text style={styles.orderId}>ORD-{String(order.id).padStart(3, '0')}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        </View>
      </View>

      {/* Event Title */}
      <Text style={styles.eventTitle} numberOfLines={1}>{order.event_title}</Text>
      <Text style={styles.eventSub} numberOfLines={1}>
        {order.artist_name} · {order.venue}
      </Text>

      <View style={styles.divider} />

      {/* Category + Qty + Date */}
      <View style={styles.cardBottom}>
        <View style={styles.bottomLeft}>
          {firstItem && (
            <>
              <Text style={styles.bottomLabel}>Category</Text>
              <Text style={styles.bottomValue}>{firstItem.category_name}</Text>
            </>
          )}
        </View>
        <View style={styles.bottomMid}>
          {firstItem && (
            <>
              <Text style={styles.bottomLabel}>Qty</Text>
              <Text style={styles.bottomValue}>{totalQty}</Text>
            </>
          )}
        </View>
        <Text style={styles.dateText}>
          {dayjs(order.order_date).format('MMM D, YYYY')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  // Header
  header: {
    paddingTop: 52,
    paddingBottom: 20,
  },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '700' },
  headerSub: { color: GRAY, fontSize: 14, marginTop: 4 },

  // Card
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: { color: GRAY, fontSize: 12 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  eventTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  eventSub: { color: GRAY, fontSize: 12 },
  divider: {
    height: 1,
    backgroundColor: '#475569',
    marginVertical: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bottomLeft: { marginRight: 24 },
  bottomMid: { flex: 1 },
  bottomLabel: { color: GRAY, fontSize: 11, marginBottom: 2 },
  bottomValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dateText: { color: GRAY, fontSize: 12 },

  // Empty
  center: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: GRAY, fontSize: 14 },
  exploreBtn: {
    marginTop: 8,
    backgroundColor: YELLOW,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  exploreBtnText: { color: '#1a1a2e', fontWeight: '700', fontSize: 14 },
});
