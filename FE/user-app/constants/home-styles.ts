import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const BG     = '#0B1120';
export const CARD   = '#1E293B';
export const CARD2  = '#334155';
export const BLUE   = '#3B82F6';
export const YELLOW = BLUE; // backward-compatible alias for existing home components
export const GRAY   = '#94A3B8';
export const WHITE  = '#F8FAFC';
export const WHITE2 = 'rgba(248,250,252,0.68)';

/** Lebar satu slide banner = lebar layar (full-bleed) */
export const FEATURED_W = width;

export const homeStyles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },

  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
  },
  greeting:        { color: WHITE,  fontSize: 23, fontWeight: '800', letterSpacing: 0.2 },
  wave:            { fontSize: 23 },
  greetingSubtitle:{ color: GRAY,   fontSize: 13, marginTop: 3 },

  // ─── Search ────────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#475569',
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, color: WHITE, fontSize: 14, letterSpacing: 0.1 },

  // ─── Banner (full-width, taller) ───────────────────────────────────────────
  bannerWrapper:  { marginBottom: 6 },
  bannerLoading: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: CARD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerBg: {
    width: FEATURED_W,
    height: 220,
    justifyContent: 'flex-end',
  },
  bannerImage: {},
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    // gradient-like: transparan atas → hitam bawah
    backgroundColor: 'transparent',
  },
  featuredBadge: {
    position: 'absolute',
    top: 14,
    left: 20,
    backgroundColor: YELLOW,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredBadgeText: { color: '#111', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  bannerContent:     { padding: 20, paddingTop: 0 },
  bannerTitle:       { color: WHITE, fontSize: 20, fontWeight: '800', letterSpacing: 0.1 },
  bannerSub:         { color: WHITE2, fontSize: 13, marginTop: 4 },
  bannerBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: YELLOW,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
  },
  bannerBtnText: { color: '#111', fontSize: 12, fontWeight: '700' },
  dotsRow:    { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3a4258' },
  dotActive:  { backgroundColor: YELLOW, width: 20, borderRadius: 4 },

  // ─── Category chips ────────────────────────────────────────────────────────
  categories:        { marginBottom: 4 },
  categoriesContent: { paddingHorizontal: 20, gap: 8 },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#475569',
  },
  catBtnActive:   { backgroundColor: YELLOW, borderColor: YELLOW },
  catText:        { color: GRAY,   fontSize: 13, fontWeight: '500' },
  catTextActive:  { color: '#111', fontSize: 13, fontWeight: '800' },

  // ─── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 14,
  },
  sectionTitle: { color: WHITE,  fontSize: 18, fontWeight: '800' },
  seeAll:       { color: YELLOW, fontSize: 13, fontWeight: '600' },
  emptyText:    { color: GRAY,   fontSize: 14, paddingHorizontal: 8, paddingVertical: 20 },

  // ─── Event Card (vertical card in horizontal scroll) ───────────────────────
  featuredListContent: { paddingHorizontal: 20, gap: 14, paddingBottom: 4 },
  eventCard: {
    width: 190,
    backgroundColor: CARD2,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#475569',
  },
  eventCardImg:    { width: '100%', height: 140, position: 'relative' },
  eventCardImgFill:{ width: '100%', height: '100%' },

  // gradient overlay di bawah gambar
  eventCardImgGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'transparent',
  },
  genreBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(245,197,24,0.92)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  genreText: { color: '#111', fontSize: 10, fontWeight: '800' },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 6,
  },

  eventCardBody:   { padding: 12, gap: 2 },
  eventCardTitle:  { color: WHITE, fontSize: 14, fontWeight: '700', marginBottom: 1 },
  eventCardArtist: { color: GRAY,  fontSize: 12, marginBottom: 8 },
  eventCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventCardPrice:  { color: YELLOW, fontSize: 12, fontWeight: '700' },
  eventCardQuota:  { color: GRAY,   fontSize: 11 },

  // ─── Upcoming Card (row card) ──────────────────────────────────────────────
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#475569',
    gap: 14,
  },
  upcomingImg:    { width: 68, height: 68, borderRadius: 12 },
  upcomingInfo:   { flex: 1 },
  upcomingTitle:  { color: WHITE, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  upcomingArtist: { color: GRAY,  fontSize: 12 },
  upcomingDate: {
    fontSize: 11,
    color: YELLOW,
    fontWeight: '600',
    marginTop: 4,
  },
});
