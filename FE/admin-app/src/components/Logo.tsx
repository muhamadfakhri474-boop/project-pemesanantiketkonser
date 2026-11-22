import { useId } from 'react';

interface LogoProps {
  height?: number;
  className?: string;
}

const YELLOW = '#FFC900';
const WORDMARK_FONT = "'Anton', 'Arial Black', sans-serif";

/* =============================================================
   LOGO CONSERTA
   Ikon   : tiket konser miring berisi sorotan lampu panggung &
            siluet penonton, dikelilingi swoosh orbit.
   Tulisan: "CONSERTA" — font Anton (tebal) dimiringkan seperti
            italic, huruf O berupa lingkaran berisi tiket putih.
   Dipakai bersama di Landing, Login, dan Register.
   ============================================================= */

/* ---------- Ikon tiket (digambar pada koordinat 0-64) ---------- */
function TicketMark() {
  const clipId = useId();
  return (
    <>
      {/* Swoosh orbit di belakang tiket */}
      <ellipse
        cx="31"
        cy="31"
        rx="28"
        ry="15.5"
        stroke={YELLOW}
        strokeWidth="4"
        transform="rotate(-15 31 31)"
      />

      {/* Tiket (dimiringkan) */}
      <g transform="rotate(-12 32 29)">
        {/* Badan tiket dengan lubang sobekan di kiri & kanan */}
        <path
          fill={YELLOW}
          d="M17.5 14 H46.5 Q50 14 50 17.5 V25.5
             A3.5 3.5 0 0 0 50 32.5 V40.5 Q50 44 46.5 44
             H17.5 Q14 44 14 40.5 V32.5
             A3.5 3.5 0 0 0 14 25.5 V17.5 Q14 14 17.5 14 Z"
        />

        {/* Panel putih di dalam tiket */}
        <rect x="18" y="18" width="28" height="22" rx="3.5" fill="#FFFFFF" />

        {/* Isi panel: lampu, sorotan, dan penonton (di-clip ke panel) */}
        <g clipPath={`url(#${clipId})`}>
          {/* Berkas cahaya dari tiga lampu */}
          <g fill={YELLOW} opacity="0.22">
            <path d="M24 23.5 L18.5 40 L29 40 Z" />
            <path d="M32 23.5 L26.5 40 L38 40 Z" />
            <path d="M40 23.5 L35 40 L45.5 40 Z" />
          </g>

          {/* Tiga lampu sorot */}
          <circle cx="24" cy="20.8" r="1.7" fill={YELLOW} />
          <circle cx="32" cy="20.8" r="1.7" fill={YELLOW} />
          <circle cx="40" cy="20.8" r="1.7" fill={YELLOW} />

          {/* Tangan penonton yang terangkat */}
          <g stroke={YELLOW} strokeWidth="1.6" strokeLinecap="round">
            <path d="M21 40 L19 34.5" />
            <path d="M26 40 L27.5 34.5" />
            <path d="M30.5 40 L29 33.8" />
            <path d="M34.5 40 L36 33.8" />
            <path d="M38.5 40 L40 34.5" />
            <path d="M43.5 40 L45.2 35" />
          </g>

          {/* Kepala penonton + dasar kerumunan */}
          <g fill={YELLOW}>
            <rect x="18" y="38.6" width="28" height="1.4" />
            <circle cx="21.5" cy="37.6" r="2.5" />
            <circle cx="26" cy="38.3" r="2.5" />
            <circle cx="31" cy="37" r="2.7" />
            <circle cx="36" cy="38.3" r="2.5" />
            <circle cx="40.5" cy="37.6" r="2.5" />
            <circle cx="45" cy="38.2" r="2.4" />
          </g>
        </g>
      </g>

      {/* Definisi clip panel (area isi tiket) */}
      <clipPath id={clipId}>
        <rect x="18" y="18" width="28" height="22" rx="3.5" />
      </clipPath>
    </>
  );
}

/* ---------- Wordmark "CONSERTA" — font Anton dimiringkan.
   Posisi & lebar tiap bagian dipatok dengan textLength supaya
   komposisinya selalu sama meski font baru selesai dimuat ---------- */
function Wordmark() {
  const textStyle = {
    fontFamily: WORDMARK_FONT,
    fontSize: 80,
    fill: YELLOW,
  } as const;

  return (
    <g>
      {/* C */}
      <text x="0" y="60" textLength="40" lengthAdjust="spacingAndGlyphs" style={textStyle}>
        C
      </text>

      {/* O — lingkaran penuh dengan tiket putih di dalamnya */}
      <circle cx="74" cy="30" r="30" fill={YELLOW} />
      <g transform="rotate(-32 74 30)">
        <rect x="65.5" y="14" width="17" height="32" rx="4" fill="#FFFFFF" />
        <circle cx="65.5" cy="30" r="2.6" fill={YELLOW} />
        <circle cx="82.5" cy="30" r="2.6" fill={YELLOW} />
      </g>

      {/* NSERTA */}
      <text
        x="108"
        y="60"
        textLength="330"
        lengthAdjust="spacingAndGlyphs"
        style={textStyle}
      >
        NSERTA
      </text>
    </g>
  );
}

/* ---------- Logo penuh (vertikal): ikon di atas, tulisan di bawah —
   komposisi sama seperti file logo referensi ---------- */
export function ConsertaLogoFull({ height = 120, className }: LogoProps) {
  return (
    <svg
      height={height}
      viewBox="0 0 452 242"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="CONSERTA"
    >
      <g transform="translate(146,0) scale(2.5)">
        <TicketMark />
      </g>
      <g transform="translate(12,174) skewX(-10)">
        <Wordmark />
      </g>
    </svg>
  );
}

/* ---------- Hanya ikon tiket — untuk sidebar yang di-collapse ---------- */
export function ConsertaLogoIcon({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="CONSERTA"
    >
      <TicketMark />
    </svg>
  );
}
