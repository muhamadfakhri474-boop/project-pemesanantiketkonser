// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { paymentService } from '@/services/payment.service';

const BG = '#0B1120';
const YELLOW = '#3B82F6';
const GRAY = '#94A3B8';

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [webLoading, setWebLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await paymentService.createPayment(Number(orderId));
        const url = res?.payment_url || res?.data?.payment_url;
        if (!url) throw new Error('Payment URL tidak ditemukan');
        setPaymentUrl(url);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Gagal memuat halaman pembayaran';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [orderId]);

  // Handle redirect dari Midtrans setelah bayar
  const handleNavChange = (navState: WebViewNavigation) => {
    const url = navState.url;
    console.log('WebView URL:', url);

    // Midtrans sandbox wrap custom scheme di dalam URL deeplink
    // contoh: https://simulator.sandbox.midtrans.com/v2/deeplink/detail?url=konserticket%3A%2F%2Fpayment-success%3Forder_id%3D1
    let targetUrl = url;
    if (url.includes('deeplink/detail?url=')) {
      try {
        const encoded = url.split('url=')[1];
        targetUrl = decodeURIComponent(encoded);
        console.log('Decoded deeplink URL:', targetUrl);
      } catch {}
    }

    // Custom scheme konserticket://
    if (targetUrl.startsWith('konserticket://') || targetUrl.includes('konserticket://')) {
      // Selalu pakai orderId dari screen params, bukan dari URL callback
      // karena saat testing manual, order_id di URL bisa berbeda
      const callbackOrderId = orderId;

      if (targetUrl.includes('payment-success')) {
        Alert.alert(
          '✅ Pembayaran Berhasil',
          'Pembayaran kamu sedang diproses. Status tiket akan diperbarui segera.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/history' as any) }],
          { cancelable: false }
        );
        return;
      }

      if (targetUrl.includes('payment-pending')) {
        Alert.alert(
          '⏳ Pembayaran Pending',
          'Pembayaran kamu sedang diproses. Cek status di halaman pesanan.',
          [{ text: 'OK', onPress: () => router.replace(`/order/${callbackOrderId}` as any) }],
          { cancelable: false }
        );
        return;
      }

      if (targetUrl.includes('payment-error')) {
        Alert.alert(
          '❌ Pembayaran Gagal',
          'Pembayaran gagal atau dibatalkan.',
          [{ text: 'Kembali ke Pesanan', onPress: () => router.replace(`/order/${callbackOrderId}` as any) }],
          { cancelable: false }
        );
        return;
      }
    }

    // Fallback dari query param Midtrans langsung
    if (
      url.includes('transaction_status=settlement') ||
      url.includes('transaction_status=capture') ||
      url.includes('status_code=200')
    ) {
      handlePaymentSuccess();
      return;
    }

    if (url.includes('transaction_status=pending')) {
      Alert.alert(
        '⏳ Pembayaran Pending',
        'Pembayaran kamu sedang diproses.',
        [{ text: 'OK', onPress: () => router.replace(`/order/${orderId}` as any) }],
        { cancelable: false }
      );
      return;
    }

    if (
      url.includes('transaction_status=cancel') ||
      url.includes('transaction_status=deny') ||
      url.includes('transaction_status=expire')
    ) {
      handlePaymentFailed(url);
    }
  };

  const handlePaymentSuccess = () => {
    Alert.alert(
      '✅ Pembayaran Berhasil',
      'Pembayaran kamu sedang diproses. Status tiket akan diperbarui segera.',
      [{
        text: 'Lihat Pesanan',
        onPress: () => router.replace(`/order/${orderId}` as any),
      }],
      { cancelable: false }
    );
  };

  const handlePaymentFailed = (url: string) => {
    let msg = 'Pembayaran dibatalkan atau gagal.';
    if (url.includes('expire')) msg = 'Waktu pembayaran habis.';
    if (url.includes('deny')) msg = 'Pembayaran ditolak.';

    Alert.alert(
      '❌ Pembayaran Gagal',
      msg + ' Kamu bisa mencoba lagi dari halaman pesanan.',
      [{
        text: 'Kembali ke Pesanan',
        onPress: () => router.replace(`/order/${orderId}` as any),
      }],
      { cancelable: false }
    );
  };

  const handleClose = () => {
    Alert.alert(
      'Batalkan Pembayaran?',
      'Apakah kamu yakin ingin meninggalkan halaman pembayaran? Pesanan akan tetap tersimpan.',
      [
        { text: 'Lanjutkan Bayar', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => router.replace(`/order/${orderId}` as any),
        },
      ]
    );
  };

  // Loading state saat ambil payment URL
  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <ActivityIndicator color={YELLOW} size="large" />
        <Text style={styles.loadingText}>Menyiapkan halaman pembayaran...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <Ionicons name="alert-circle-outline" size={52} color="#ef4444" />
        <Text style={styles.errorTitle}>Gagal Memuat Pembayaran</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.retryText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pembayaran</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* WebView loading overlay */}
      {webLoading && (
        <View style={styles.webLoading}>
          <ActivityIndicator color={YELLOW} size="large" />
          <Text style={styles.loadingText}>Memuat halaman Midtrans...</Text>
        </View>
      )}

      {/* Midtrans Snap WebView */}
      {paymentUrl && (
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavChange}
          onLoadStart={() => setWebLoading(true)}
          onLoadEnd={() => setWebLoading(false)}
          onError={() => {
            setWebLoading(false);
            setError('Koneksi gagal. Periksa jaringan kamu.');
          }}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          allowsBackForwardNavigationGestures
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  // Header (putih karena WebView Midtrans background putih)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeBtn: {
    width: 38, height: 38,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '700',
  },

  webView: { flex: 1 },

  // Loading & Error states
  centered: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  webLoading: {
    position: 'absolute',
    top: 110, left: 0, right: 0, bottom: 0,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  loadingText: { color: GRAY, fontSize: 14 },
  errorTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  errorMsg: { color: GRAY, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 8,
  },
  retryText: { color: '#1a1a2e', fontWeight: '700', fontSize: 14 },
});
