import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Eye,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/admin/supabase";
import { useAuditLogger } from "@/hooks/useAuditLog";

type Claim = {
  id: string;
  ticket_number: string;
  order_id: string | null;
  customer_name: string;
  service_slug: string;
  service_name: string;
  complaint: string;
  order_date_hint: string | null;
  status: string;
  invoice_number: string | null;
  warranty_days: number | null;
  expires_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "PENDING", label: "Pending" },
  { value: "NEED_VERIFICATION", label: "Perlu Verifikasi" },
  { value: "EXPIRED", label: "Kadaluwarsa" },
  { value: "PROCESSING", label: "Diproses" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "REJECTED", label: "Ditolak" },
];

const MANUAL_SERVICES = [
  { slug: "standart", name: "STANDART", days: 7 },
  { slug: "elite", name: "ELITE", days: 14 },
  { slug: "extreme", name: "EXTREME", days: 30 },
  { slug: "app-settinx", name: "IPAN APP SettinX V1", days: 14 },
] as const;

function generateTicket() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 5; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `CLM-${ymd}-${rand}`;
}

const NEXT_STATUS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "REJECTED"],
  NEED_VERIFICATION: ["PROCESSING", "REJECTED"],
  EXPIRED: ["PROCESSING", "REJECTED"],
  PROCESSING: ["COMPLETED", "REJECTED"],
  COMPLETED: [],
  REJECTED: ["PROCESSING"],
};

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
    case "NEED_VERIFICATION":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" /> Perlu Verifikasi
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3 h-3" /> Kadaluwarsa
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Loader2 className="w-3 h-3 animate-spin" /> Diproses
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
          <CheckCircle2 className="w-3 h-3" /> Selesai
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
          <XCircle className="w-3 h-3" /> Ditolak
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
          {status}
        </span>
      );
  }
}

export default function AdminGaransi() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Claim | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualForm, setManualForm] = useState({
    customer_name: "",
    service_slug: "",
    complaint: "",
    order_date_hint: "",
    invoice_number: "",
    status: "PENDING",
    admin_notes: "",
  });
  const logAudit = useAuditLogger();

  const fetchClaims = async () => {
    setLoading(true);
    try {
      let q = supabase.from("warranty_claims").select("*").order("created_at", { ascending: false }).limit(100);
      if (statusFilter !== "ALL") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data as Claim[]) || [];
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        rows = rows.filter(
          (r) =>
            r.ticket_number.toLowerCase().includes(s) ||
            r.customer_name.toLowerCase().includes(s) ||
            r.service_name.toLowerCase().includes(s) ||
            (r.invoice_number && r.invoice_number.toLowerCase().includes(s))
        );
      }
      setClaims(rows);
    } catch (e: any) {
      console.error("Failed to fetch claims", e);
      toast.error("Gagal memuat klaim garansi: " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("admin-warranty-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "warranty_claims" }, () => {
        fetchClaims();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

  const handleStatus = async (id: string, next: string) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from("warranty_claims").update({ status: next }).eq("id", id);
      if (error) throw error;
      await logAudit("warranty.status.update", id, { status: next });
      toast.success(`Status diubah ke ${next}`);
      if (selected?.id === id) setSelected({ ...selected, status: next });
      await fetchClaims();
    } catch (e: any) {
      toast.error("Gagal ubah status: " + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("warranty_claims")
        .update({ admin_notes: selected.admin_notes })
        .eq("id", selected.id);
      if (error) throw error;
      toast.success("Catatan disimpan");
      await fetchClaims();
    } catch (e: any) {
      toast.error("Gagal simpan catatan: " + e.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualForm.customer_name.trim() || !manualForm.service_slug || !manualForm.complaint.trim()) {
      toast.error("Nama, layanan, dan keluhan wajib diisi");
      return;
    }
    if (manualForm.complaint.trim().length < 10) {
      toast.error("Keluhan minimal 10 karakter");
      return;
    }
    setManualSaving(true);
    try {
      const svc = MANUAL_SERVICES.find((s) => s.slug === manualForm.service_slug);
      const ticket = generateTicket();
      const row: Record<string, unknown> = {
        ticket_number: ticket,
        customer_name: manualForm.customer_name.trim(),
        service_slug: manualForm.service_slug,
        service_name: svc?.name || manualForm.service_slug,
        complaint: manualForm.complaint.trim(),
        order_date_hint: manualForm.order_date_hint || null,
        invoice_number: manualForm.invoice_number.trim() || null,
        status: manualForm.status,
        warranty_days: svc?.days || null,
        admin_notes: manualForm.admin_notes.trim() || null,
      };
      const { data, error } = await supabase.from("warranty_claims").insert(row).select().single();
      if (error) throw error;
      await logAudit("warranty.manual.create", (data as Claim).id, { ticket_number: ticket, status: manualForm.status });
      toast.success(`Klaim manual ${ticket} berhasil dibuat`);
      setShowManual(false);
      setManualForm({ customer_name: "", service_slug: "", complaint: "", order_date_hint: "", invoice_number: "", status: "PENDING", admin_notes: "" });
      await fetchClaims();
    } catch (e: any) {
      toast.error("Gagal membuat klaim: " + e.message);
    } finally {
      setManualSaving(false);
    }
  };

  const pendingCount = claims.filter((c) => c.status === "PENDING" || c.status === "NEED_VERIFICATION").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-[#94A3B8]" /> Garansi
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-yellow-500 text-zinc-900 text-sm font-bold">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Kelola klaim garansi dari customer — auto-match nama &amp; paket ke data order.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowManual(true)}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Klaim Manual
            </Button>
            <Button variant="outline" size="sm" onClick={fetchClaims} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        <Card className="bg-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filter &amp; Cari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchClaims()}
                  placeholder="Cari tiket / nama / layanan / invoice..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 rounded-lg bg-background border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <Button size="sm" onClick={fetchClaims}>Terapkan</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Memuat klaim...
              </div>
            ) : claims.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ShieldCheck className="w-10 h-10 mb-3 opacity-30" />
                <p>Belum ada klaim garansi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tiket</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Layanan</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs font-semibold">{c.ticket_number}</TableCell>
                        <TableCell className="text-sm">{c.customer_name}</TableCell>
                        <TableCell className="text-sm">{c.service_name}</TableCell>
                        <TableCell className="font-mono text-xs">{c.invoice_number || "-"}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(c.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelected(c);
                                setShowDetail(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {NEXT_STATUS[c.status]?.slice(0, 1).map((ns) => (
                              <Button
                                key={ns}
                                variant="outline"
                                size="sm"
                                disabled={updating === c.id}
                                onClick={() => handleStatus(c.id, ns)}
                              >
                                {updating === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : ns === "PROCESSING" ? "Proses" : ns}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail dialog */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-lg bg-[#1a1a1a] border-white/10 text-[#F4F4F5]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#94A3B8]" /> {selected?.ticket_number}
              </DialogTitle>
              <DialogDescription className="text-zinc-500">
                Detail klaim garansi — ubah status atau tambah catatan admin.
              </DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs">Customer</span>
                    <p className="font-medium">{selected.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Layanan</span>
                    <p className="font-medium">{selected.service_name}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Invoice</span>
                    <p className="font-mono text-xs">{selected.invoice_number || "-"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Garansi</span>
                    <p>{selected.warranty_days ? `${selected.warranty_days} hari` : "-"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Status</span>
                    <div className="mt-1">{getStatusBadge(selected.status)}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Dibuat</span>
                    <p className="text-xs">{format(new Date(selected.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-zinc-400">Keluhan</Label>
                  <p className="mt-1 text-sm leading-relaxed bg-[#131314] border border-white/10 rounded-lg p-3 whitespace-pre-wrap">
                    {selected.complaint}
                  </p>
                </div>

                <div>
                  <Label htmlFor="admin_notes" className="text-xs text-zinc-400">Catatan Admin (internal)</Label>
                  <textarea
                    id="admin_notes"
                    value={selected.admin_notes || ""}
                    onChange={(e) => setSelected({ ...selected, admin_notes: e.target.value })}
                    rows={3}
                    placeholder="Catatan internal..."
                    className="mt-1 w-full rounded-lg bg-[#131314] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/20 resize-none"
                  />
                  <Button size="sm" variant="outline" className="mt-2" onClick={handleSaveNotes} disabled={savingNotes}>
                    {savingNotes ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null} Simpan Catatan
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {(NEXT_STATUS[selected.status] || []).map((ns) => (
                    <Button
                      key={ns}
                      size="sm"
                      variant={ns === "COMPLETED" ? "default" : ns === "REJECTED" ? "destructive" : "outline"}
                      disabled={updating === selected.id}
                      onClick={() => handleStatus(selected.id, ns)}
                    >
                      {updating === selected.id ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                      {ns === "PROCESSING" ? "Proses" : ns === "COMPLETED" ? "Selesai" : ns === "REJECTED" ? "Tolak" : ns}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual dialog */}
        <Dialog open={showManual} onOpenChange={setShowManual}>
          <DialogContent className="max-w-lg bg-[#1a1a1a] border-white/10 text-[#F4F4F5]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-[#94A3B8]" /> Tambah Klaim Manual</DialogTitle>
              <DialogDescription className="text-zinc-500">Buat klaim garansi manual untuk customer yang hubungi via WA/DM — tanpa lewat form publik.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-zinc-400">Nama Customer *</Label>
                <input value={manualForm.customer_name} onChange={(e) => setManualForm((f) => ({ ...f, customer_name: e.target.value }))} placeholder="Nama sesuai order" className="mt-1 w-full rounded-lg bg-[#131314] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-400">Layanan *</Label>
                  <select value={manualForm.service_slug} onChange={(e) => setManualForm((f) => ({ ...f, service_slug: e.target.value }))} className="mt-1 w-full rounded-lg bg-[#131314] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/20">
                    <option value="">— Pilih —</option>
                    {MANUAL_SERVICES.map((s) => (<option key={s.slug} value={s.slug}>{s.name} — {s.days} hari</option>))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Status</Label>
                  <select value={manualForm.status} onChange={(e) => setManualForm((f) => ({ ...f, status: e.target.value }))} className="mt-1 w-full rounded-lg bg-[#131314] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/20">
                    {STATUS_OPTIONS.filter((s) => s.value !== "ALL").map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-400">Tanggal Order (opsional)</Label>
                  <input type="date" value={manualForm.order_date_hint} onChange={(e) => setManualForm((f) => ({ ...f, order_date_hint: e.target.value }))} className="mt-1 w-full rounded-lg bg-[#131314] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/20 [color-scheme:dark]" />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Invoice (opsional)</Label>
                  <input value={manualForm.invoice_number} onChange={(e) => setManualForm((f) => ({ ...f, invoice_number: e.target.value }))} placeholder="IPN-..." className="mt-1 w-full rounded-lg bg-[#131314] border border-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:border-white/20" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Keluhan *</Label>
                <textarea value={manualForm.complaint} onChange={(e) => setManualForm((f) => ({ ...f, complaint: e.target.value }))} rows={4} placeholder="Keluhan customer..." className="mt-1 w-full rounded-lg bg-[#131314] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/20 resize-none" />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Catatan Admin</Label>
                <textarea value={manualForm.admin_notes} onChange={(e) => setManualForm((f) => ({ ...f, admin_notes: e.target.value }))} rows={2} placeholder="Catatan internal..." className="mt-1 w-full rounded-lg bg-[#131314] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/20 resize-none" />
              </div>
              <Button onClick={handleManualSubmit} disabled={manualSaving} className="w-full">
                {manualSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Klaim Manual"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
