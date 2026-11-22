import { DefaultTheme, DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth.store';
import { useRealtimeStore } from '@/store/realtimeStore';

const YELLOW = '#3B82F6';
const BG = '#0B1120';

function SplashScreen() {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo fade + scale in
      Animated.parallel([
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animasi
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, [logoAnim, progressAnim, textAnim]);

  const logoScale = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={splash.container}>
      <StatusBar style="light" />

      {/* Center content */}
      <View style={splash.center}>
        {/* Logo box */}
        <Animated.View
          style={[
            splash.logoBox,
            { opacity: logoAnim, transform: [{ scale: logoScale }] },
          ]}
        >
          <Text style={splash.logoStar}>★</Text>
        </Animated.View>

        {/* App name */}
        <Animated.Text style={[splash.appName, { opacity: textAnim }]}>
          Crescendo
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[splash.tagline, { opacity: textAnim }]}>
          Your Concert Experience
        </Animated.Text>
      </View>

      {/* Bottom loading bar */}
      <View style={splash.bottomSection}>
        <View style={splash.progressBg}>
          <Animated.View style={[splash.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={splash.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  logoBox: {
    width: 88,
    height: 88,
    backgroundColor: YELLOW,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: YELLOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  logoStar: {
    fontSize: 44,
    color: '#1a1a2e',
  },
  appName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
  },
  tagline: {
    color: '#6B7280',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  bottomSection: {
    width: '100%',
    paddingHorizontal: 48,
    alignItems: 'center',
    gap: 12,
  },
  progressBg: {
    width: '100%',
    height: 3,
    backgroundColor: '#1f2937',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: YELLOW,
    borderRadius: 2,
  },
  loadingText: {
    color: '#374151',
    fontSize: 12,
    letterSpacing: 1,
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const loadToken = useAuthStore((state) => state.loadToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connectSocket = useRealtimeStore((state) => state.connect);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Cek apakah ada token tersimpan di storage
      await loadToken();
      // Minimal 1,2 detik supaya splash screen sempat terlihat
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsReady(true);
    };
    init();
  }, [loadToken]);

  useEffect(() => {
    if (!isReady) return;
    connectSocket();
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isReady, isAuthenticated, connectSocket]);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
