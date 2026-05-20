"use client"

import { useState, useTransition, useRef } from "react"
import { uploadExcelAction } from "@/app/actions/record"

export default function ExcelUploadForm() {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [fileName, setFileName] = useState<string>("")
  
  const formRef = useRef<HTMLFormElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name)
      setStatus(null)
    }
  }

  const handleFormAction = async (formData: FormData) => {
    setStatus(null)

    startTransition(async () => {
      const errorMsg = await uploadExcelAction(formData)

      if (errorMsg) {
        setStatus({ type: "error", message: errorMsg })
      } else {
        setStatus({ type: "success", message: "Data Excel berhasil diimport ke database!" })
        setFileName("")
        
        if (formRef.current) {
          formRef.current.reset()
        }
      }
    })
  }

  return (
    <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-macos-primary">Bulk Upload</h3>
        <p className="text-xs text-macos-secondary mb-4 leading-relaxed">
            Upload file .xlsx
          <br />
          <span className="font-mono bg-macos-tertiary px-1 py-0.5 rounded inline-block mt-1 text-macos-primary">
            Customer, Description, Quotation No, No. PO, Delivery Date, No. DO, No. Invoice, Remark, Amount IDR
          </span>
        </p>
      </div>

      {status && (
        <div className={`mb-4 p-3 rounded-lg text-xs font-medium border ${
          status.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-macos-red/10 border-macos-red/30 text-macos-red"
        }`}>
          {status.type === "success" ? "✓ " : "✕ "}
          {status.message}
        </div>
      )}

      {/* 🌟 Menggunakan kombinasi ref dan action bawaan Next.js Client Component */}
      <form ref={formRef} action={handleFormAction} className="space-y-4">
        <div className="border-2 border-dashed border-macos-separator rounded-lg p-4 text-center hover:border-macos-blue transition relative group">
          <input 
            type="file" 
            name="excelFile" 
            accept=".xlsx, .xls" 
            required 
            onChange={handleFileChange}
            disabled={isPending}
            className="w-full h-full opacity-0 absolute inset-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <p className="text-sm text-macos-secondary group-hover:text-macos-blue transition truncate px-2">
            {fileName || "Click or drag Excel sheet here"}
          </p>
        </div>
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-2 bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md text-sm font-medium hover:bg-opacity-80 transition cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Processing..." : "Upload and Parse Excel"}
        </button>
      </form>
    </div>
  )
}
