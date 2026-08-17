// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - CSV Export Helper
// Dipakai di halaman admin (Orders, Services, Testimonials, FAQs, Reports).
// ─────────────────────────────────────────────────────────────────────────────

export interface CsvColumn {
  header: string;
  /** Ambil nilai dari baris data. */
  value: (row: Record<string, unknown>) => string | number | null | undefined;
}

/**
 * Buat & unduh file CSV dari array baris.
 * Semua sel di-quote agar aman (koma / kutip dalam data).
 */
export function exportToCsv(
  filename: string,
  columns: CsvColumn[],
  rows: Record<string, unknown>[]
) {
  const header = columns.map((c) => c.header).join(",");
  const body = rows.map((row) =>
    columns
      .map((c) => {
        const v = c.value(row);
        return v == null ? "" : String(v);
      })
      .map((cell) => `"${cell.replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}