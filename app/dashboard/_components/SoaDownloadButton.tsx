"use client";

import { useState } from "react";

type CustomerOption = { id: number; code: string; name: string };

function defaultMonth() {
  // last month, the one you normally send a statement for
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SoaDownloadButton({ customers }: { customers: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>("all");
  const [month, setMonth] = useState(defaultMonth());
  const [refresh, setRefresh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setError(null);
    if (!month) return setError("Pilih bulan terlebih dahulu.");
    setBusy(true);
    try {
      const qs = new URLSearchParams({ period: month, customerId });
      if (refresh) qs.set("refresh", "1");
      const res = await fetch(`/api/soa?${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Gagal membuat SOA.");
        return;
      }
      const disp = res.headers.get("Content-Disposition") ?? "";
      const star = /filename\*=UTF-8''([^;]+)/i.exec(disp);
      const plain = /filename="([^"]+)"/i.exec(disp);
      const filename = star ? decodeURIComponent(star[1]) : plain ? plain[1] : `SOA-${month}`;

      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-macos-separator bg-macos-popover text-macos-primary rounded-lg text-sm font-semibold hover:border-macos-blue hover:text-macos-blue transition whitespace-nowrap shadow-sm cursor-pointer"
      >
        📑 Download SOA
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-macos-popover border border-macos-separator rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-macos-separator pb-2">
              <h3 className="text-base font-semibold text-macos-primary">Statement of Account</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="text-macos-secondary hover:text-macos-red transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-xs font-medium">
                ✕ {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Perusahaan</label>
              <select
                value={customerId}
                disabled={busy}
                onChange={(e) => setCustomerId(e.target.value)}
                className={`${field} cursor-pointer scheme-dark`}
              >
                <option value="all">Semua perusahaan (ZIP)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">Bulan</label>
              <input
                type="month"
                value={month}
                disabled={busy}
                onChange={(e) => setMonth(e.target.value)}
                className={`${field} scheme-dark`}
              />
              <p className="mt-1 text-[11px] text-macos-secondary">
                Berisi item yang di-<b>Close</b> finance pada bulan tersebut.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-macos-secondary cursor-pointer">
              <input type="checkbox" checked={refresh} disabled={busy} onChange={(e) => setRefresh(e.target.checked)} />
              Buat ulang dari data terbaru (timpa SOA yang sudah tersimpan)
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 py-2 border border-macos-separator text-macos-secondary rounded-md text-sm font-semibold hover:bg-macos-tertiary transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={download}
                disabled={busy}
                className="flex-1 py-2 bg-macos-blue text-white rounded-md text-sm font-semibold hover:bg-opacity-90 transition cursor-pointer disabled:opacity-50"
              >
                {busy ? "Membuat..." : "⬇ Download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
