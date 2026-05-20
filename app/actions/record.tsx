"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"

import { Prisma } from "@prisma/client" // 👈 Pastikan import Prisma ini ada di paling atas

export async function uploadExcelAction(formData: FormData) {
  const file = formData.get("excelFile") as File
  
  if (!file || file.size === 0) {
    return "No file uploaded"
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // cellDates: true menjamin pengenalan format waktu secara langsung dari Excel
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
    const firstSheetName = workbook.SheetNames
    const worksheet = workbook.Sheets[firstSheetName]
    
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[]

    if (rawRows.length === 0) {
      return "The uploaded Excel sheet is empty"
    }

    let currentCustomer = ""
    let currentQuotation = ""
    let currentNoPo = ""
    let currentDeliveryDate: Date | null = null
    let currentNoDo = ""
    let currentNoInv = ""

    const recordsToInsert = []

    for (const row of rawRows) {
      // Logika Forward Fill: Duplikasi otomatis sel gabungan (merged cells)
      if (row["Customer"]) currentCustomer = String(row["Customer"]).trim()
      if (row["Quotation No"]) currentQuotation = String(row["Quotation No"]).trim()
      if (row["No. PO"]) currentNoPo = String(row["No. PO"]).trim()
      if (row["No. DO"]) currentNoDo = String(row["No. DO"]).trim()
      if (row["No. Invoice"]) currentNoInv = String(row["No. Invoice"]).trim()
      
      if (row["Delivery Date"]) {
        const rawDate = row["Delivery Date"]
        if (rawDate instanceof Date) {
          currentDeliveryDate = rawDate
        } else {
          const parsed = Date.parse(String(rawDate))
          if (!isNaN(parsed)) {
            currentDeliveryDate = new Date(parsed)
          }
        }
      }

      // Bersihkan teks "Rp" atau titik ribuan pada nominal angka
      let rawAmount = String(row["Amount IDR"] || "0")
      rawAmount = rawAmount.replace(/Rp/g, "").replace(/\./g, "").replace(/,/g, "").trim()
      const parsedAmount = parseFloat(rawAmount) || 0

      // Lewati baris kosong jika deskripsi dan nominal tidak terisi
      if (!row["Description"] && parsedAmount === 0) {
        continue
      }

      // 🌟 PERBAIKAN UTAMA: Gunakan undefined jika kolom Remark di Excel kosong atau tidak diisi
      // Prisma mewajibkan nilai 'undefined' untuk memberi tahu database agar mengosongkan kolom opsional
      const remarkValue = row["Remark"] && String(row["Remark"]).trim() !== "" 
        ? String(row["Remark"]).trim() 
        : undefined

      recordsToInsert.push({
        customer: currentCustomer || "UNKNOWN",
        description: String(row["Description"] || "-").trim(),
        quotationNumber: currentQuotation || "-",
        noPo: currentNoPo || "-",
        dateDelivery: currentDeliveryDate || new Date(),
        noDo: currentNoDo || "-",
        noInv: currentNoInv || "-",
        amountIdr: parsedAmount,
        remark: remarkValue, // 👈 Aman dari interupsi 'must not be null'
      })
    }

    if (recordsToInsert.length === 0) {
      return "No valid rows found to import"
    }

    // Eksekusi transaksi massal di dalam blok sekuensial yang aman
    await prisma.$transaction(
      recordsToInsert.map((item) =>
        prisma.invoiceRecord.create({
          data: item,
        })
      )
    )

    revalidatePath("/dashboard/datapodo")
    return null 
  } catch (error) {
    console.error("Excel Parsing Error:", error)
    return "Failed to parse or save your Excel data rows"
  }
}


export async function createRecordAction(formData: FormData) {
  const customer = formData.get("customer") as string
  const description = formData.get("description") as string
  const quotationNumber = formData.get("quotationNumber") as string
  const noPo = formData.get("noPo") as string
  const dateDeliveryStr = formData.get("dateDelivery") as string
  const noDo = formData.get("noDo") as string
  const noInv = formData.get("noInv") as string
  const amountIdrStr = formData.get("amountIdr") as string
  const rawRemark = formData.get("remark") as string
  const remark = rawRemark && rawRemark.trim() !== "" ? rawRemark.trim() : null

  if (!customer || !quotationNumber || !noPo || !dateDeliveryStr || !noInv || !amountIdrStr) {
    return "Missing required fields"
  }

  try {
    await prisma.invoiceRecord.create({
      data: {
        customer,
        description,
        quotationNumber,
        noPo,
        dateDelivery: new Date(dateDeliveryStr),
        noDo,
        noInv,
        amountIdr: parseFloat(amountIdrStr),
        remark,
      },
    })
  } catch (error) {
    console.error(error)
    return "Failed to save record to database"
  }

  // Refresh dashboard data instantly without reloading page
  revalidatePath("/dashboard/datapodopodo")
}

export async function deleteRecordAction(id: string) {
  try {
    await prisma.invoiceRecord.delete({
      where: { id },
    })
  } catch (error) {
    console.error("Failed to delete record:", error)
    return "Failed to delete record"
  }

  // Refresh data tabel secara real-time setelah data dihapus
  revalidatePath("/dashboard/datapodo")
}