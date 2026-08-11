interface PageBackgroundProps {
  opacity?: number;
  className?: string;
}

/**
 * PageBackground — lapisan dekoratif lokal untuk section hero di tiap page.
 *
 * Sebelumnya komponen ini merender Scanner (WebGL) sendiri per-section,
 * yang boros GPU (bisa 3-4 context WebGL aktif di satu page). Sekarang
 * efek Scanner global sudah dirender satu kali di Layout (fixed), jadi
 * di sini cukup lapisan solid semi-transparan + gradient fade bawah agar
 * section punya kedalaman visual tanpa double WebGL.
 *
 * Prop `opacity` dipertahankan untuk kompatibilitas API lama (mengontrol
 * seberapa pekat lapisan solid — nilai kecil = lebih transparan sehingga
 * Scanner global di belakang lebih terlihat).
 */
const PageBackground = ({ opacity = 0.25, className = "" }: PageBackgroundProps) => {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Lapisan solid semi-transparan — bg dasar section.
          Opasitas rendah agar Scanner global di belakang tetap terlihat. */}
      <div
        className="absolute inset-0 bg-[#1a1a1a]"
        style={{ opacity: 1 - opacity }}
      />
      {/* Gradient fade ke background di bawah section untuk transisi halus
          ke section berikutnya. */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#1a1a1a] to-transparent z-[1]" />
    </div>
  );
};

export default PageBackground;
