/* =============================================================
   LANDING PAGE CONCERTA
   -------------------------------------------------------------
   Struktur halaman (atas ke bawah):
     1. Icon components
     2. Navbar
     3. HeroSection      (headline besar + stats)
     4. AboutSection     (foto + checklist + floating card)
     5. FeaturesSection  (grid 6 kartu)
     6. EcosystemSection (mockup browser + smartphone)
     7. CtaSection       (kartu ajakan login)
     8. Footer
   ============================================================= */

import { useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import heroImg from '../../assets/concert-hero.jpg';
import aboutImg from '../../assets/concert-about.jpg';

/* =============================================================
   1. ICON COMPONENTS
   ============================================================= */

type IconProps = {
  size?: number;
  className?: string;
};

function StrokeIcon({
  size = 20,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function ArrowRightIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </StrokeIcon>
  );
}

function CheckIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} size={props.size ?? 14}>
      <path d="M20 6 9 17l-5-5" />
    </StrokeIcon>
  );
}

function MenuIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </StrokeIcon>
  );
}

function CloseIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </StrokeIcon>
  );
}

function CalendarIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </StrokeIcon>
  );
}

function MicIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </StrokeIcon>
  );
}

function SlidersIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </StrokeIcon>
  );
}

function ClipboardIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </StrokeIcon>
  );
}

function CreditCardIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </StrokeIcon>
  );
}

function TrendingUpIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </StrokeIcon>
  );
}

function MailIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </StrokeIcon>
  );
}

function PhoneIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </StrokeIcon>
  );
}

function MapPinIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </StrokeIcon>
  );
}

function RefreshIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </StrokeIcon>
  );
}

/* Logo CONSERTA: kotak biru dengan ikon waveform + wordmark */
function BrandLogo() {
  return (
    <span className="concerta-brand">
      <span className="concerta-brand-mark" aria-hidden="true">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="9" width="2.4" height="6" rx="1.2" fill="#ffffff" />
          <rect x="8.2" y="5" width="2.4" height="14" rx="1.2" fill="#ffffff" />
          <rect x="12.9" y="7.4" width="2.4" height="9.2" rx="1.2" fill="#ffffff" />
          <rect x="17.6" y="9.8" width="2.4" height="4.4" rx="1.2" fill="#ffffff" />
        </svg>
      </span>
      <span className="concerta-brand-text">CONCERTA</span>
    </span>
  );
}

/* =============================================================
   2. NAVBAR
   ============================================================= */

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'features', label: 'Features' },
  { id: 'contact', label: 'Contact' },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <header className="concerta-navbar">
      <div className="concerta-container concerta-navbar-inner">
        <Link to="/" className="concerta-brand-link" onClick={() => go('home')}>
          <BrandLogo />
        </Link>

        <nav className="concerta-nav-links">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => go(link.id)}
              className="concerta-nav-link"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="concerta-nav-cta">
          <button
            type="button"
            className="concerta-btn concerta-btn-primary concerta-btn-nav"
            onClick={() => navigate(isAuthenticated ? '/admin' : '/login')}
          >
            Login Admin
          </button>

          <button
            type="button"
            className="concerta-hamburger"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="concerta-mobile-menu">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className="concerta-nav-link"
              onClick={() => go(link.id)}
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            className="concerta-btn concerta-btn-primary concerta-btn-nav"
            onClick={() => {
              setMenuOpen(false);
              navigate(isAuthenticated ? '/admin' : '/login');
            }}
          >
            Login Admin
          </button>
        </div>
      )}
    </header>
  );
}

/* =============================================================
   3. HERO SECTION
   ============================================================= */

const HERO_STATS = [
  { value: '120+', label: 'Konser dikelola' },
  { value: '85rb', label: 'Tiket terjual' },
  { value: '99,9%', label: 'Uptime sistem' },
];

function HeroSection() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section id="home" className="concerta-hero">
      <div
        className="concerta-hero-bg"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="concerta-hero-overlay" />

      <div className="concerta-container concerta-hero-inner">
        <div className="concerta-hero-content">
          <h1 className="concerta-hero-title">
            Manage Every Concert,
            <br />
            Make Every <span className="concerta-highlight">Moment</span>
            <br />
            Count.
          </h1>

          <p className="concerta-hero-desc">
            CONCERTA membantu administrator mengelola konser, artis, kategori
            tiket, pesanan, dan verifikasi pembayaran dalam satu dashboard yang
            rapi dan terpercaya.
          </p>

          <div className="concerta-hero-buttons">
            <button
              type="button"
              className="concerta-btn concerta-btn-primary concerta-btn-hero"
              onClick={() => navigate(isAuthenticated ? '/admin' : '/login')}
            >
              <span>Login sebagai Administrator</span>
              <ArrowRightIcon size={17} className="concerta-btn-arrow" />
            </button>

            <button
              type="button"
              className="concerta-btn concerta-btn-outline concerta-btn-hero"
              onClick={() => scrollToSection('about')}
            >
              Discover CONCERTA
            </button>
          </div>
        </div>

        <div className="concerta-hero-stats">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="concerta-stat-col">
              <div className="concerta-stat-value">{stat.value}</div>
              <div className="concerta-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============================================================
   4. ABOUT SECTION
   ============================================================= */

const ABOUT_CHECKLIST = [
  'Mengurangi pekerjaan manual dan kesalahan pencatatan data.',
  'Memantau kuota dan penjualan tiket secara langsung.',
  'Mempercepat verifikasi pembayaran pelanggan.',
];

function AboutSection() {
  return (
    <section id="about" className="concerta-about">
      <div className="concerta-container">
        <div className="concerta-about-row">
          <div className="concerta-about-media">
            <img
              src={aboutImg}
              alt="Penonton konser dengan lampu panggung"
              className="concerta-about-img"
            />

            <div className="concerta-about-card">
              <span className="concerta-about-card-label">
                Tiket terjual bulan ini
              </span>
              <span className="concerta-about-card-value">12.480</span>
              <span className="concerta-about-card-trend">
                +18% dari bulan lalu
              </span>
            </div>
          </div>

          <div className="concerta-about-copy">
            <span className="concerta-eyebrow">Tentang Concerta</span>
            <h2 className="concerta-heading-2">
              Satu pusat kendali untuk seluruh operasional konser
            </h2>

            <p className="concerta-about-desc">
              CONCERTA adalah platform berbasis web yang dirancang khusus untuk
              administrator penyelenggara konser. Seluruh data penting tersedia
              dalam satu tempat, sehingga keputusan dapat diambil lebih cepat
              dan akurat.
            </p>

            <div className="concerta-checklist">
              {ABOUT_CHECKLIST.map((item) => (
                <div key={item} className="concerta-check-row">
                  <span className="concerta-check-icon">
                    <CheckIcon size={13} />
                  </span>
                  <span className="concerta-check-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =============================================================
   5. FEATURES SECTION (6 kartu)
   ============================================================= */

type Feature = {
  title: string;
  desc: string;
  Icon: (props: { size?: number }) => ReactElement;
};

const FEATURES: Feature[] = [
  {
    title: 'Concert Management',
    desc: 'Tambah, ubah, dan pantau seluruh jadwal konser lengkap dengan poster, venue, dan status acara.',
    Icon: CalendarIcon,
  },
  {
    title: 'Artist Management',
    desc: 'Kelola profil artis dan pengisi acara beserta genre dan deskripsi singkatnya.',
    Icon: MicIcon,
  },
  {
    title: 'Ticket Category Management',
    desc: 'Atur kategori VVIP, VIP, Festival, dan Reguler dengan harga serta kuota masing-masing.',
    Icon: SlidersIcon,
  },
  {
    title: 'Order Management',
    desc: 'Lihat seluruh pesanan pelanggan, cari, filter, dan telusuri detailnya dengan cepat.',
    Icon: ClipboardIcon,
  },
  {
    title: 'Payment Verification',
    desc: 'Periksa bukti pembayaran, lalu setujui atau tolak dengan konfirmasi yang jelas.',
    Icon: CreditCardIcon,
  },
  {
    title: 'Ticket Sales Control',
    desc: 'Buka atau tutup penjualan dan pantau tiket terjual serta sisa kuota secara langsung.',
    Icon: TrendingUpIcon,
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="concerta-features">
      <div className="concerta-container">
        <div className="concerta-section-head">
          <span className="concerta-eyebrow">Fitur Utama</span>
          <h2 className="concerta-heading-2 concerta-heading-center">
            Semua yang dibutuhkan administrator
          </h2>
          <p className="concerta-section-sub">
            Enam modul inti yang saling terhubung untuk menjalankan konser dari
            persiapan hingga penjualan.
          </p>
        </div>

        <div className="concerta-features-grid">
          {FEATURES.map(({ title, desc, Icon }) => (
            <div key={title} className="concerta-feature-card">
              <span className="concerta-feature-icon">
                <Icon size={21} />
              </span>
              <h3 className="concerta-feature-title">{title}</h3>
              <p className="concerta-feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============================================================
   6. ECOSYSTEM SECTION
   ============================================================= */

const ECO_STEPS = [
  {
    num: '1',
    title: 'Admin mengelola data',
    desc: 'Konser, artis, tiket, dan kuota diperbarui dari web.',
  },
  {
    num: '2',
    title: 'Pelanggan memesan di aplikasi',
    desc: 'Pesanan dan unggahan bukti bayar dikirim otomatis.',
  },
  {
    num: '3',
    title: 'Admin memverifikasi',
    desc: 'Status pembayaran tersinkron ke aplikasi pelanggan.',
  },
];

function EcosystemSection() {
  return (
    <section className="concerta-ecosystem">
      <div className="concerta-container">
        <div className="concerta-eco-row">
          <div className="concerta-eco-copy">
            <span className="concerta-eyebrow">Integrated Ecosystem</span>
            <h2 className="concerta-heading-2">
              Terhubung langsung dengan aplikasi mobile pelanggan
            </h2>

            <p className="concerta-eco-desc">
              Website administrator ini adalah pusat data. Konser, kategori
              tiket, harga, dan kuota yang Anda atur akan tampil di aplikasi
              mobile pelanggan. Pesanan dan bukti pembayaran dari pelanggan
              masuk kembali ke dashboard untuk diverifikasi.
            </p>

            <div className="concerta-eco-steps">
              {ECO_STEPS.map((step) => (
                <div key={step.num} className="concerta-eco-step">
                  <span className="concerta-eco-step-num">{step.num}</span>
                  <div>
                    <h4 className="concerta-eco-step-title">{step.title}</h4>
                    <p className="concerta-eco-step-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="concerta-eco-visual">
            {/* Browser mockup — Web Admin */}
            <div className="concerta-browser">
              <div className="concerta-browser-top">
                <span className="concerta-browser-dot red" />
                <span className="concerta-browser-dot yellow" />
                <span className="concerta-browser-dot green" />
              </div>
              <div className="concerta-browser-body">
                <span className="concerta-skeleton w-70" />
                <span className="concerta-skeleton w-100" />
                <span className="concerta-skeleton w-55" />
                <span className="concerta-skeleton-panel" />
              </div>
              <div className="concerta-browser-label">Web Admin</div>
            </div>

            {/* Penghubung */}
            <div className="concerta-sync-circle" aria-hidden="true">
              <RefreshIcon size={22} />
            </div>

            {/* Phone mockup — Aplikasi Pelanggan */}
            <div className="concerta-phone">
              <div className="concerta-phone-pill" />
              <div className="concerta-phone-screen">
                <div className="concerta-phone-poster">
                  <img src={aboutImg} alt="Poster konser" />
                </div>
                <h6 className="concerta-phone-title">Malam Sheila on 7</h6>
                <p className="concerta-phone-date">15 Agu 2026 &middot; Istora Senayan</p>

                <div className="concerta-phone-ticket">
                  <span className="concerta-phone-ticket-name">VIP</span>
                  <span className="concerta-phone-ticket-price">Rp 1.250.000</span>
                </div>
                <div className="concerta-phone-ticket">
                  <span className="concerta-phone-ticket-name">Festival</span>
                  <span className="concerta-phone-ticket-price">Rp 650.000</span>
                </div>

                <span className="concerta-phone-btn">Pesan Tiket</span>
              </div>
              <div className="concerta-phone-label">Aplikasi Pelanggan</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =============================================================
   7. CTA SECTION
   ============================================================= */

function CtaSection() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section className="concerta-cta">
      <div className="concerta-container">
        <div className="concerta-cta-card">
          <h2 className="concerta-heading-2 concerta-heading-center">
            Ready to Manage Your Concerts?
          </h2>
          <p className="concerta-cta-desc">
            Masuk ke dashboard dan mulai kelola konser, tiket, serta pembayaran
            dengan lebih efisien hari ini.
          </p>
          <button
            type="button"
            className="concerta-btn concerta-btn-primary concerta-btn-hero"
            onClick={() => navigate(isAuthenticated ? '/admin' : '/login')}
          >
            <span>Login Admin</span>
            <ArrowRightIcon size={17} className="concerta-btn-arrow" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* =============================================================
   8. FOOTER
   ============================================================= */

function Footer() {
  return (
    <footer id="contact" className="concerta-footer">
      <div className="concerta-container">
        <div className="concerta-footer-grid">
          <div className="concerta-footer-brand">
            <BrandLogo />
            <p className="concerta-footer-desc">
              Platform manajemen dan pengelolaan konser musik berbasis web untuk
              administrator penyelenggara acara.
            </p>
          </div>

          <div>
            <h5 className="concerta-footer-title">Navigasi</h5>
            <div className="concerta-footer-links">
              <button type="button" onClick={() => scrollToSection('home')}>
                Home
              </button>
              <button type="button" onClick={() => scrollToSection('about')}>
                About
              </button>
              <button type="button" onClick={() => scrollToSection('features')}>
                Features
              </button>
              <button type="button" onClick={() => scrollToSection('contact')}>
                Contact
              </button>
              <Link to="/login">Login Admin</Link>
            </div>
          </div>

          <div>
            <h5 className="concerta-footer-title">Kontak</h5>
            <div className="concerta-footer-contact">
              <MailIcon size={16} />
              <span>halo@concerta.id</span>
            </div>
            <div className="concerta-footer-contact">
              <PhoneIcon size={16} />
              <span>+62 21 5090 1234</span>
            </div>
            <div className="concerta-footer-contact">
              <MapPinIcon size={16} />
              <span>Jl. Jend. Sudirman No. 45, Jakarta Selatan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="concerta-footer-bottom">
        <span>&copy; 2026 CONCERTA. Hak cipta dilindungi.</span>
      </div>
    </footer>
  );
}

/* =============================================================
   HALAMAN
   ============================================================= */

export default function LandingPage() {
  return (
    <div className="concerta-page">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <EcosystemSection />
      <CtaSection />
      <Footer />

      <style>{landingStyles}</style>
    </div>
  );
}

/* =============================================================
   STYLING
   ============================================================= */

const landingStyles = `
/* CONCERTA — Landing Page Styles
   Palette:
   Main Background #0B1120 | Surface / Card #1E293B | Secondary Surface #334155
   Primary Blue #3B82F6 | Secondary Blue #60A5FA
   Primary Text #F8FAFC | Secondary Text #94A3B8
   Border #475569 | Success #22C55E | Error #EF4444 | Warning #F59E0B */

html {
  scroll-behavior: smooth;
}

.concerta-page {
  width: 100%;
  min-height: 100vh;
  background-color: #0b1120;
  color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

.concerta-page button {
  font-family: inherit;
}

.concerta-container {
  width: 100%;
  max-width: 1344px;
  margin: 0 auto;
  padding: 0 48px;
  box-sizing: border-box;
}

/* ---------- Shared typography & accents ---------- */
.concerta-eyebrow {
  color: #3b82f6;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 16px;
}

.concerta-heading-2 {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.16;
  letter-spacing: -1px;
  color: #f8fafc;
  margin: 0 0 18px 0;
}

.concerta-heading-center {
  text-align: center;
}

.concerta-highlight {
  color: #3b82f6;
}

.concerta-section-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.concerta-section-sub {
  max-width: 640px;
  font-size: 16px;
  line-height: 1.65;
  color: #94a3b8;
  margin: 0 auto 52px;
}

/* ---------- Brand ---------- */
.concerta-brand-link {
  text-decoration: none;
  display: inline-flex;
}

.concerta-brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
}

.concerta-brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background-color: #3b82f6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.concerta-brand-text {
  color: #f8fafc;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

/* ---------- Buttons ---------- */
.concerta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.18s ease, transform 0.18s ease,
    box-shadow 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.concerta-btn .concerta-btn-arrow {
  display: inline-flex;
  transition: transform 0.18s ease;
}

.concerta-btn:hover .concerta-btn-arrow {
  transform: translateX(3px);
}

.concerta-btn-primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.concerta-btn-primary:hover {
  background-color: #2f74e6;
  box-shadow: 0 8px 22px rgba(59, 130, 246, 0.35);
}

.concerta-btn-nav {
  padding: 12px 22px;
  font-size: 14.5px;
}

.concerta-btn-hero {
  padding: 16px 26px;
  font-size: 15px;
}

.concerta-btn-outline {
  background: transparent;
  color: #f8fafc;
  border: 1px solid #475569;
  padding: 15px 24px;
  font-size: 15px;
}

.concerta-btn-outline:hover {
  border-color: #60a5fa;
  color: #ffffff;
  background-color: rgba(59, 130, 246, 0.08);
}

/* ---------- 1. NAVBAR ---------- */
.concerta-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  background-color: rgba(9, 14, 27, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(71, 85, 105, 0.32);
}

.concerta-navbar-inner {
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.concerta-nav-links {
  display: flex;
  align-items: center;
  gap: 38px;
}

.concerta-nav-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 14.5px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.15s ease;
}

.concerta-nav-link:hover {
  color: #f8fafc;
}

.concerta-nav-cta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.concerta-hamburger {
  display: none;
  background: transparent;
  border: none;
  color: #f8fafc;
  cursor: pointer;
  padding: 4px;
}

.concerta-mobile-menu {
  display: none;
}

/* ---------- 2. HERO ---------- */
.concerta-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 820px;
  overflow: hidden;
  background-color: #0b1120;
}

.concerta-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.concerta-hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(11, 17, 32, 0.94) 0%, rgba(11, 17, 32, 0.72) 40%, rgba(11, 17, 32, 0.3) 100%),
    linear-gradient(180deg, rgba(11, 17, 32, 0.85) 0%, rgba(11, 17, 32, 0.35) 40%, rgba(11, 17, 32, 0.9) 100%);
}

.concerta-hero-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-top: 76px;
}

.concerta-hero-content {
  padding-top: 96px;
}

.concerta-hero-title {
  font-size: 68px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -2.2px;
  color: #f8fafc;
  margin: 0 0 26px 0;
  max-width: 900px;
}

.concerta-hero-desc {
  color: #cbd5e1;
  font-size: 16.5px;
  line-height: 1.75;
  max-width: 620px;
  margin: 0 0 38px 0;
}

.concerta-hero-buttons {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.concerta-hero-stats {
  margin-top: auto;
  display: flex;
  gap: 86px;
  border-top: 1px solid rgba(148, 163, 184, 0.28);
  padding: 26px 0 52px;
}

.concerta-stat-col {
  display: flex;
  flex-direction: column;
}

.concerta-stat-value {
  font-size: 33px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.8px;
  color: #f8fafc;
}

.concerta-stat-label {
  margin-top: 7px;
  font-size: 14px;
  color: #94a3b8;
}

/* ---------- 3. ABOUT ---------- */
.concerta-about {
  padding: 110px 0;
  background-color: #0b1120;
  scroll-margin-top: 76px;
}

.concerta-about-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 72px;
  align-items: center;
}

.concerta-about-media {
  position: relative;
}

.concerta-about-img {
  width: 100%;
  height: 430px;
  object-fit: cover;
  border-radius: 16px;
  display: block;
}

.concerta-about-card {
  position: absolute;
  right: -22px;
  bottom: -24px;
  display: flex;
  flex-direction: column;
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 16px 22px;
  min-width: 190px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.concerta-about-card-label {
  font-size: 12.5px;
  color: #94a3b8;
}

.concerta-about-card-value {
  margin-top: 3px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.6px;
  color: #f8fafc;
}

.concerta-about-card-trend {
  margin-top: 2px;
  font-size: 12.5px;
  font-weight: 600;
  color: #22c55e;
}

.concerta-about-copy .concerta-heading-2 {
  font-size: 44px;
  max-width: 540px;
}

.concerta-about-desc {
  font-size: 16px;
  color: #94a3b8;
  line-height: 1.75;
  margin: 0 0 30px 0;
  max-width: 540px;
}

.concerta-checklist {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.concerta-check-row {
  display: flex;
  align-items: center;
  gap: 13px;
}

.concerta-check-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.16);
  color: #60a5fa;
  flex-shrink: 0;
}

.concerta-check-text {
  font-size: 16px;
  color: #f8fafc;
}

/* ---------- 4. FEATURES ---------- */
.concerta-features {
  padding: 100px 0 120px;
  background-color: #0b1120;
  scroll-margin-top: 76px;
}

.concerta-features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.concerta-feature-card {
  background-color: #1e293b;
  border: 1px solid rgba(71, 85, 105, 0.45);
  border-radius: 14px;
  padding: 30px 28px;
  box-sizing: border-box;
  transition: transform 0.18s ease, border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.concerta-feature-card:hover {
  transform: translateY(-3px);
  border-color: rgba(59, 130, 246, 0.55);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.35);
}

.concerta-feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: rgba(59, 130, 246, 0.14);
  color: #60a5fa;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}

.concerta-feature-title {
  font-size: 19px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 12px 0;
}

.concerta-feature-desc {
  font-size: 14.5px;
  color: #94a3b8;
  line-height: 1.65;
  margin: 0;
}

/* ---------- 5. ECOSYSTEM ---------- */
.concerta-ecosystem {
  padding: 110px 0;
  background-color: #0b1120;
  overflow: hidden;
}

.concerta-eco-row {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 56px;
  align-items: center;
}

.concerta-eco-copy .concerta-heading-2 {
  font-size: 42px;
  max-width: 560px;
}

.concerta-eco-desc {
  font-size: 16px;
  color: #94a3b8;
  line-height: 1.75;
  margin: 0 0 30px 0;
  max-width: 560px;
}

.concerta-eco-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 560px;
}

.concerta-eco-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background-color: #1e293b;
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 10px;
  padding: 16px 18px;
}

.concerta-eco-step-num {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background-color: #3b82f6;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.concerta-eco-step-title {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  margin: 1px 0 4px 0;
}

.concerta-eco-step-desc {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.55;
}

.concerta-eco-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.concerta-browser {
  width: 232px;
  border-radius: 14px;
  background-color: #1e293b;
  border: 1px solid #334155;
  overflow: hidden;
  flex-shrink: 0;
}

.concerta-browser-top {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(71, 85, 105, 0.4);
}

.concerta-browser-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.concerta-browser-dot.red {
  background-color: #ef4444;
}

.concerta-browser-dot.yellow {
  background-color: #f59e0b;
}

.concerta-browser-dot.green {
  background-color: #22c55e;
}

.concerta-browser-body {
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.concerta-skeleton {
  display: block;
  height: 14px;
  border-radius: 5px;
  background-color: #334155;
}

.concerta-skeleton.w-70 {
  width: 68%;
}

.concerta-skeleton.w-100 {
  width: 100%;
}

.concerta-skeleton.w-55 {
  width: 46%;
}

.concerta-skeleton-panel {
  display: block;
  height: 74px;
  border-radius: 8px;
  background-color: rgba(59, 130, 246, 0.28);
  margin-top: 4px;
}

.concerta-browser-label {
  text-align: center;
  font-size: 12.5px;
  color: #94a3b8;
  padding: 0 0 14px;
}

.concerta-sync-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 10px 26px rgba(59, 130, 246, 0.4);
}

.concerta-phone {
  width: 226px;
  border-radius: 34px;
  background-color: #0b1120;
  border: 6px solid #334155;
  padding: 12px 12px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.concerta-phone-pill {
  width: 52px;
  height: 5px;
  border-radius: 3px;
  background-color: #334155;
  margin: 0 auto 12px;
}

.concerta-phone-screen {
  display: flex;
  flex-direction: column;
}

.concerta-phone-poster {
  height: 96px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.concerta-phone-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.concerta-phone-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 3px 0;
}

.concerta-phone-date {
  font-size: 11px;
  color: #94a3b8;
  margin: 0 0 12px 0;
}

.concerta-phone-ticket {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.concerta-phone-ticket-name {
  font-size: 12px;
  font-weight: 700;
  color: #f8fafc;
}

.concerta-phone-ticket-price {
  font-size: 11.5px;
  color: #94a3b8;
}

.concerta-phone-btn {
  margin-top: 4px;
  display: block;
  text-align: center;
  background-color: #3b82f6;
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  border-radius: 8px;
  padding: 10px 0;
}

.concerta-phone-label {
  text-align: center;
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 12px;
}

/* ---------- 6. CTA ---------- */
.concerta-cta {
  padding: 20px 0 100px;
  background-color: #0b1120;
}

.concerta-cta-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 78px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.concerta-cta-card .concerta-heading-2 {
  font-size: 44px;
  margin-bottom: 16px;
}

.concerta-cta-desc {
  font-size: 16px;
  color: #94a3b8;
  line-height: 1.7;
  max-width: 560px;
  margin: 0 0 30px;
}

/* ---------- 7. FOOTER ---------- */
.concerta-footer {
  background-color: #080d18;
  border-top: 1px solid rgba(71, 85, 105, 0.32);
  padding-top: 72px;
  scroll-margin-top: 76px;
}

.concerta-footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1.2fr;
  gap: 56px;
  padding-bottom: 64px;
}

.concerta-footer-brand .concerta-brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 9px;
}

.concerta-footer-brand .concerta-brand-text {
  font-size: 16px;
}

.concerta-footer-desc {
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.7;
  max-width: 320px;
  margin: 18px 0 0;
}

.concerta-footer-title {
  color: #f8fafc;
  font-size: 14.5px;
  font-weight: 700;
  margin: 0 0 20px 0;
}

.concerta-footer-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.concerta-footer-links a,
.concerta-footer-links button {
  background: none;
  border: none;
  padding: 0;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  text-align: left;
  transition: color 0.15s ease;
}

.concerta-footer-links a:hover,
.concerta-footer-links button:hover {
  color: #60a5fa;
}

.concerta-footer-contact {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 14px;
  line-height: 1.5;
}

.concerta-footer-contact svg {
  color: #60a5fa;
  flex-shrink: 0;
  margin-top: 2px;
}

.concerta-footer-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 26px 0;
  border-top: 1px solid rgba(71, 85, 105, 0.28);
  color: #64748b;
  font-size: 13px;
}

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .concerta-hero-title {
    font-size: 54px;
  }

  .concerta-about-row {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .concerta-about-card {
    right: 16px;
    bottom: 16px;
  }

  .concerta-features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .concerta-eco-row {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .concerta-footer-grid {
    grid-template-columns: 1.4fr 1fr;
    gap: 40px;
  }
}

@media (max-width: 768px) {
  .concerta-container {
    padding: 0 22px;
  }

  .concerta-nav-links,
  .concerta-nav-cta .concerta-btn-nav {
    display: none;
  }

  .concerta-hamburger {
    display: inline-flex;
  }

  .concerta-mobile-menu {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 18px 22px 22px;
    border-top: 1px solid rgba(71, 85, 105, 0.32);
    background-color: rgba(9, 14, 27, 0.98);
  }

  .concerta-hero {
    min-height: 700px;
  }

  .concerta-hero-inner {
    padding-top: 76px;
  }

  .concerta-hero-content {
    padding-top: 56px;
  }

  .concerta-hero-title {
    font-size: 40px;
    letter-spacing: -1.4px;
  }

  .concerta-hero-desc {
    font-size: 15px;
  }

  .concerta-hero-stats {
    gap: 32px;
    padding-bottom: 40px;
    flex-wrap: wrap;
  }

  .concerta-stat-value {
    font-size: 26px;
  }

  .concerta-heading-2,
  .concerta-about-copy .concerta-heading-2,
  .concerta-eco-copy .concerta-heading-2,
  .concerta-cta-card .concerta-heading-2 {
    font-size: 30px;
  }

  .concerta-about {
    padding: 72px 0;
  }

  .concerta-about-img {
    height: 300px;
  }

  .concerta-features {
    padding: 72px 0;
  }

  .concerta-features-grid {
    grid-template-columns: 1fr;
  }

  .concerta-ecosystem {
    padding: 72px 0;
  }

  .concerta-eco-visual {
    flex-wrap: wrap;
  }

  .concerta-cta {
    padding-bottom: 72px;
  }

  .concerta-cta-card {
    padding: 48px 24px;
  }

  .concerta-footer {
    padding-top: 56px;
  }

  .concerta-footer-grid {
    grid-template-columns: 1fr;
    gap: 36px;
    padding-bottom: 48px;
  }
}
`;
