"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { createInvoiceWithItemsAction } from "@/app/actions/record"

interface ItemRow {
  id: number
  description: string
  qty: number // 👈 Tambah properti qty
  amountIdr: number
}

const CUSTOMER_CODES: Record<string, string> = {
  "PT OSI": "01",
  "PT ALCOTRAINDO BATAM": "06",
  "PT NOK FREDEUNBERG BATAM": "024",
  "PT AMTEK RE-ENGINEERING": "029",
  "PT CLADTEK": "034",
  "PT RAAJRATNA": "036",
  "PT ALTECO CHEMICAL": "043",
  "PT DYNACAST": "078",
  "PT INDO KREASI GRAFIKA": "092",
  "CV. CILINTON BARAT": "093",
  "PT BROADFAR INDONESIA": "098",
  "PT PECM INDONESIA": "096",
  "PT LABROY": "103",
  "PT WAHANA TIRTA MILENIA": "106",
  "PT. BATAM NIAGA": "107",
  "PT TSI SMART PRODUCTS": "108",
  "PT. BLUE OCEAN LABS": "109",
  "PT. BEC": "110"
}

export default function InvoiceForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [customerName, setCustomerName] = useState("")
  const [quotationNumber, setQuotationNumber] = useState("Q000-2605-001")
  
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // 🌟 Tambahkan default nilai qty: 1 pada inisialisasi state awal
  const [items, setItems] = useState<ItemRow[]>([
    { id: Date.now(), description: "", qty: 1, amountIdr: 0 }
  ])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const datePrefix = `${yy}${mm}` 

    const cleanInput = customerName.toUpperCase().trim()

    if (cleanInput.length > 0) {
      const filtered = Object.keys(CUSTOMER_CODES).filter(name =>
        name.toUpperCase().includes(cleanInput)
      )
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }

    let companyCode = "000"
    for (const [name, code] of Object.entries(CUSTOMER_CODES)) {
      if (cleanInput === name.toUpperCase()) {
        companyCode = code.padStart(3, "0")
        break
      }
    }

    setQuotationNumber(`Q${companyCode}-${datePrefix}-001`)
  }, [customerName])

  const handleSelectSuggestion = (name: string) => {
    setCustomerName(name)
    setShowSuggestions(false)
  }

  // 🌟 Update fungsi tambah baris agar menyertakan qty: 1 bawaan
  const addItemRow = () => {
    setItems([...items, { id: Date.now(), description: "", qty: 1, amountIdr: 0 }])
  }

  const removeItemRow = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  // 🌟 Modifikasi fungsi update field agar bisa menangani pembacaan data apa saja (string / number)
  const updateItemField = (id: number, field: keyof ItemRow, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formElement = e.currentTarget
    const formData = new FormData(formElement)
    
    // Validasi item list sebelum simpan data
    const invalidAmount = items.some(item => item.amountIdr <= 0)
    const invalidQty = items.some(item => item.qty <= 0)
    
    if (invalidAmount || invalidQty) {
      setError("Semua nominal Qty dan Amount IDR harus diisi lebih dari 0!")
      return
    }

    formData.append("itemsJson", JSON.stringify(items))

    startTransition(async () => {
      const errorMsg = await createInvoiceWithItemsAction(formData)
      if (errorMsg) {
        setError(errorMsg)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-sm font-medium">
          ✕ {error}
        </div>
      )}

      {/* GENERAL DATA */}
      <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4">
        <h3 className="text-lg font-semibold text-macos-primary border-b border-macos-separator pb-2 mb-2">General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div ref={autocompleteRef} className="relative">
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">Customer Name *</label>
            <input 
              name="customer" 
              type="text" 
              required 
              autoComplete="off"
              value={customerName}
              disabled={isPending} 
              placeholder="Ketik nama perusahaan, cth: ALCO..."
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setCustomerName(e.target.value)
                setShowSuggestions(true)
              }}
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition" 
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-macos-popover border border-macos-separator rounded-lg shadow-2xl z-50 py-1 divide-y divide-macos-separator/40 animate-scale-up">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectSuggestion(name)}
                    className="w-full text-left px-3 py-2 text-xs text-macos-primary hover:bg-macos-blue hover:text-white transition cursor-pointer font-medium"
                  >
                    🏢 {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">Quotation Number (Auto-Generated) *</label>
            <input 
              name="quotationNumber" 
              type="text" 
              required 
              readOnly 
              value={quotationNumber}
              className="w-full bg-macos-separator/30 border border-macos-separator text-macos-secondary font-mono rounded-md p-2 text-sm select-none cursor-not-allowed font-semibold opacity-70" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">No. PO *</label>
            <input name="noPo" type="text" required disabled={isPending} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">Delivery Date *</label>
            <input name="dateDelivery" type="date" required disabled={isPending} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition scheme-dark" />
          </div>
          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">No. DO</label>
            <input name="noDo" type="text" disabled={isPending} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">No. Invoice *</label>
            <input name="noInv" type="text" required disabled={isPending} className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition" />
          </div>
        </div>
      </div>

      {/* ITEMS DYNAMIC SECTION WITH QTY */}
      <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-macos-separator pb-2 mb-2">
          <h3 className="text-lg font-semibold text-macos-primary">Invoice Items List</h3>
          <button type="button" onClick={addItemRow} disabled={isPending} className="px-3 py-1.5 bg-macos-blue/10 border border-macos-blue/30 text-macos-blue rounded-md text-xs font-semibold hover:bg-macos-blue hover:text-white transition cursor-pointer">
            ＋ Add Item Description
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-end gap-4 bg-macos-base/30 p-4 border border-macos-separator/40 rounded-xl">
              {/* Kolom Deskripsi */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-macos-secondary mb-1.5">Item Description #{index + 1} *</label>
                <input type="text" required value={item.description} disabled={isPending} onChange={(e) => updateItemField(item.id, "description", e.target.value)} placeholder="e.g. EJECTOR FLANGE MATERIAL : MILD STEEL" className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition" />
              </div>
              
              {/* 🆕 KOLOM QUANTITY (QTY) */}
              <div className="w-full sm:w-24">
                <label className="block text-xs font-medium text-macos-secondary mb-1.5">Qty *</label>
                <input 
                  type="number" 
                  min="1"
                  required 
                  value={item.qty} 
                  disabled={isPending} 
                  onChange={(e) => updateItemField(item.id, "qty", parseInt(e.target.value, 10) || 1)} 
                  placeholder="1" 
                  className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition" 
                />
              </div>

              {/* Kolom Harga */}
              <div className="w-full sm:w-44">
                <label className="block text-xs font-medium text-macos-secondary mb-1.5">Amount IDR *</label>
                <input type="number" step="any" required value={item.amountIdr || ""} disabled={isPending} onChange={(e) => updateItemField(item.id, "amountIdr", parseFloat(e.target.value) || 0)} placeholder="3963900" className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition" />
              </div>

              {/* Tombol Hapus Baris */}
              {items.length > 1 && (
                <button type="button" onClick={() => removeItemRow(item.id)} disabled={isPending} className="w-full sm:w-auto p-2 mb-0.5 border border-macos-red/20 text-macos-red bg-macos-red/5 rounded-md text-xs hover:bg-macos-red hover:text-white transition cursor-pointer flex justify-center">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* REMARK AND SAVE BUTTON */}
      <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4">
        <div>
          <label className="block text-xs font-medium text-macos-secondary mb-1.5">Global Remark (Catatan Tambahan)</label>
          <input name="remark" type="text" disabled={isPending} placeholder="Prices are valid 1 month after offer is sent" className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition" />
        </div>
        <div className="pt-2">
          <button type="submit" disabled={isPending} className="w-full py-2.5 bg-macos-blue text-white rounded-md font-semibold text-sm hover:bg-opacity-90 active:scale-[0.99] transition cursor-pointer shadow-lg disabled:opacity-50">
            {isPending ? "Saving Records..." : "Save Invoice and All Items"}
          </button>
        </div>
      </div>
    </form>
  )
}
