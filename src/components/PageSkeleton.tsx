/**
 * Fallback ringan saat chunk halaman lazy sedang diunduh.
 * Menggunakan min-h-screen agar tidak ada layout shift berarti.
 */
const PageSkeleton = () => (
  <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        Memuat halaman…
      </span>
    </div>
  </div>
);

export default PageSkeleton;
