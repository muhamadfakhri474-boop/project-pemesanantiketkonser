import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  type ScrollViewInstance,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from 'dayjs';
import { Event } from '@/services/event.service';
import { getImageUrl } from '@/utils/image';
import { homeStyles as s, FEATURED_W } from '@/constants/home-styles';

interface Props {
  events: Event[];
  activeIndex: number;
  onIndexChange: (idx: number) => void;
}

export default function FeaturedBanner({ events, activeIndex, onIndexChange }: Props) {
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    if (events.length < 2) return;
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % events.length;
      scrollRef.current?.scrollTo({ x: nextIndex * FEATURED_W, animated: true });
      onIndexChange(nextIndex);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeIndex, events.length, onIndexChange]);

  if (events.length === 0) return null;

  return (
    <View style={s.bannerWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / FEATURED_W);
          onIndexChange(idx);
        }}
      >
        {events.map((event) => {
          // Gunakan foto grup/artis dari database sebagai background utama banner.
          // Poster event menjadi fallback jika artist_photo belum tersedia.
          const backgroundUrl = getImageUrl(event.artist_photo || event.poster);
          const cats = event.ticket_categories ?? [];
          const minPrice =
            event.min_price != null && Number(event.min_price) > 0
              ? Number(event.min_price)
              : cats.length > 0
              ? cats.reduce((m, c) => Math.min(m, Number(c.price)), Number(cats[0].price))
              : null;

          return (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.93}
              onPress={() => router.push(`/event/${event.id}` as any)}
            >
              <View style={local.slide}>
                <View style={local.bluePanel}>
                  <Image
                    source={backgroundUrl ? { uri: backgroundUrl } : require('@/assets/images/splash-icon.png')}
                    style={local.backgroundImage}
                    contentFit="cover"
                    transition={250}
                  />
                  <View style={local.imageOverlay} />
                  <View style={local.decorCircle} />
                  <Text style={local.eyebrow}>FEATURED CONCERT</Text>
                  <Text style={local.artistName} numberOfLines={1}>
                    {event.artist_name || event.title}
                  </Text>
                  {event.artist_name ? (
                    <Text style={local.eventName} numberOfLines={1}>{event.title}</Text>
                  ) : null}
                </View>
                <View style={local.infoPanel}>
                  <View style={local.infoText}>
                    <Text style={local.infoLabel}>Pilihan utama</Text>
                    <Text style={local.infoTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={local.infoMeta} numberOfLines={1}>
                      {dayjs(event.event_date).format('D MMM YYYY')} {event.venue ? `· ${event.venue}` : ''}
                    </Text>
                  </View>
                  <View style={local.arrowButton}>
                    <Text style={local.arrow}>›</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Dots */}
      <View style={s.dotsRow}>
        {events.map((_, i) => (
          <View key={i} style={[s.dot, i === activeIndex && s.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  slide: {
    width: FEATURED_W,
    height: 244,
    paddingHorizontal: 15,
  },
  bluePanel: {
    height: 162,
    backgroundColor: '#2563D9',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 13,
    paddingTop: 18,
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.96,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11,17,32,0.38)',
  },
  decorCircle: {
    position: 'absolute',
    width: 126,
    height: 126,
    borderRadius: 63,
    right: -20,
    top: -20,
    backgroundColor: 'rgba(96,165,250,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.16)',
  },
  eyebrow: {
    color: '#BFDBFE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 82,
  },
  artistName: {
    color: '#F8FAFC',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    maxWidth: '58%',
  },
  eventName: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  infoPanel: {
    height: 82,
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: { flex: 1, paddingRight: 10 },
  infoLabel: {
    alignSelf: 'flex-start',
    color: '#93C5FD',
    backgroundColor: '#263B60',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
  },
  infoTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
  infoMeta: { color: '#94A3B8', fontSize: 11, marginTop: 3 },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { color: '#F8FAFC', fontSize: 25, lineHeight: 27, fontWeight: '300' },
});
