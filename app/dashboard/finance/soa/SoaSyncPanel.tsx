"use client";

import { useState } from "react";

function lastMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SoaSyncPanel() {
  const [month, setMonth] = useState(lastMonth());
  const [refresh, setRefresh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/soa/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: month, refresh }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ ok: false, text: data?.error ?? "Gagal menyimpan SOA." });
        return;
      }
      setMsg({
        ok: true,
        text: `${data.written} file disimpan, ${data.skipped} sudah ada. Refresh halaman untuk melihat folder.`,
      });
    } catch {
      setMsg({ ok: false, text: "Terjadi kesalahan jaringan." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-macos-popover border border-macos-separator rounded-xl shadow-2xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-macos-primary">Upload SOA ke folder</h3>
      <input
        type="month"
        value={month}
        disabled={busy}
        onChange={(e) => setMonth(e.target.value)}
        className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue scheme-dark"
      />
      <label className="flex items-center gap-2 text-[11px] text-macos-secondary cursor-pointer">
        <input type="checkbox" checked={refresh} disabled={busy} onChange={(e) => setRefresh(e.target.checked)} />
        Buat ulang & timpa file yang sudah ada
      </label>
      {msg && (
        <p className={`text-xs font-medium ${msg.ok ? "text-green-600" : "text-macos-red"}`}>
          {msg.ok ? "✓" : "✕"} {msg.text}
        </p>
      )}
      <button
        type="button"
        onClick={run}
        disabled={busy || !month}
        className="w-full py-2 bg-macos-blue text-white rounded-md text-sm font-semibold hover:bg-opacity-90 transition cursor-pointer disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : "⬆ Upload semua perusahaan"}
      </button>
    </div>
  );
}
