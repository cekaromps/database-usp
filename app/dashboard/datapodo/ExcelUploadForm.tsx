"use client"

import { useState, useTransition } from "react"
import { uploadExcelAction } from "@/app/actions/record"

interface SkippedItem {
  rowNumber: number
  customer: string
  desc: string
  reason: string
}

interface UploadResult {
  success: boolean
  message: string
  inserted: number
  skipped: SkippedItem[]
}

export default function ExcelUploadForm() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setResult(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      // Menangkap laporan utuh dari sisi server action
      const report = await uploadExcelAction(formData) as any
      if (report) {
        setResult(report)
      }
    })
  }

  return (
    <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4 h-fit">
      <h3 className="text-lg font-semibold text-macos-primary">Bulk Import Spreadsheet</h3>
      <p className="text-xs text-macos-secondary leading-relaxed">
        Pilih file Excel pelacakan PO/DO panjang Anda untuk melakukan sinkronisasi massal ke database internal.
      </p>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border border-dashed border-macos-separator rounded-lg p-4 text-center bg-macos-base/20 hover:bg-macos-base/40 transition">
          <input 
            name="excelFile" 
            type="file" 
            accept=".xlsx, .xls" 
            required 
            disabled={isPending}
            className="text-xs text-macos-secondary file:mr-3 file:py-1 file:px-2.5 file:rounded file:border file:border-macos-separator file:bg-macos-tertiary file:text-macos-primary file:text-xs file:font-semibold hover:file:bg-macos-separator transition cursor-pointer"
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-2 bg-macos-blue text-white rounded-md font-semibold text-sm hover:bg-opacity-95 transition cursor-pointer shadow-md disabled:opacity-50"
        >
          {isPending ? "Processing Data..." : "Upload & Sync Spreadsheet"}
        </button>
      </form>

      {/* 🌟 BOX LAPORAN MONITORING HASIL UPLOAD (DITAMPILKAN DI BAWAH TOMBOL) */}
      {result && (
        <div className="space-y-3 pt-2 animate-fade-in text-xs">
          {/* Status Utama */}
          <div className={`p-3 rounded-lg border font-medium ${result.success ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-macos-red/10 border-macos-red/20 text-macos-red"}`}>
            {result.success ? "✓" : "✕"} {result.message}
            {result.inserted > 0 && <span className="block text-[11px] mt-1 text-macos-primary font-normal">Total {result.inserted} baris barang berhasil masuk ke database list.</span>}
          </div>

          {/* Daftar Baris Excel yang Gagal / Dilewati */}
          {result.skipped && result.skipped.length > 0 && (
            <div className="space-y-2">
              <span className="block font-bold text-macos-red text-[11px] uppercase tracking-wider">⚠️ Daftar Baris Excel yang Tidak Ter-upload:</span>
              <div className="max-h-48 overflow-y-auto border border-macos-separator rounded-lg divide-y divide-macos-separator/30 bg-macos-base/30 font-mono text-[10.5px]">
                {result.skipped.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex flex-col gap-0.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold bg-macos-tertiary px-1 rounded">Baris Ke-{item.rowNumber}</span>
                      <span className="text-macos-red italic font-sans">{item.reason}</span>
                    </div>
                    <p className="text-macos-secondary mt-1 truncate">Customer: <span className="text-macos-primary font-bold">{item.customer}</span></p>
                    <p className="text-macos-secondary truncate">Desc: <span className="text-macos-primary">{item.desc || "-"}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
