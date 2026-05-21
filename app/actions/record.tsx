"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"
import { redirect } from "next/navigation"

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

      if (!row["Description"] && parsedAmount === 0) {
        continue
      }

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
        remark: remarkValue, 
      })
    }

    if (recordsToInsert.length === 0) {
      return "No valid rows found to import"
    }

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

export async function createInvoiceWithItemsAction(formData: FormData) {
  const customer = formData.get("customer") as string
  const attn = formData.get("attn") as string
  const cc = (formData.get("cc") as string)?.trim() || "-"
  const term = formData.get("term") as string
  const validity = formData.get("validity") as string
  const leadTime = formData.get("leadTime") as string
  const fromUser = formData.get("fromUser") as string
  const handphone = formData.get("handphone") as string
  const quotationNumber = formData.get("quotationNumber") as string
  const dateDeliveryStr = formData.get("dateDelivery") as string
  const noInv = formData.get("noInv") as string
  
  const rawRemark = formData.get("remark") as string
  const remark = rawRemark && rawRemark.trim() !== "" ? rawRemark.trim() : "Prices are valid 1 month after offer is sent"

  const itemsJson = formData.get("itemsJson") as string
  if (!itemsJson) return "No items added"

  const items = JSON.parse(itemsJson) as Array<{ description: string; qty: number; amountIdr: number }>

  // Validasi kolom-kolom wajib baru
  if (!customer || !attn || !term || !validity || !leadTime || !fromUser || !handphone || !quotationNumber || !dateDeliveryStr || !noInv || items.length === 0) {
    return "Missing required fields"
  }

  try {
    const recordsToInsert = items.map((item) => ({
      customer,
      attn,
      cc,
      term,
      validity,
      leadTime,
      fromUser,
      handphone,
      quotationNumber,
      dateDelivery: new Date(dateDeliveryStr),
      noInv,
      description: item.description || "-",
      qty: item.qty || 1,
      amountIdr: item.amountIdr,
      remark: remark,
    }))

    await prisma.$transaction(
      recordsToInsert.map((record) =>
        prisma.invoice.create({
          data: record as any,
        })
      )
    )
  } catch (error) {
    console.error(error)
    return "Failed to save records to the invoice database"
  }

  // Arahkan langsung ke halaman cetak PDF
  redirect(`/dashboard/invoicemaker/print?noInv=${noInv}`) 
}

export async function updateInvoiceAction(formData: FormData) {
  const noInv = formData.get("noInv") as string

  const customer = formData.get("customer") as string
  const attn = formData.get("attn") as string
  const cc = (formData.get("cc") as string)?.trim() || "-"
  const term = formData.get("term") as string
  const validity = formData.get("validity") as string
  const leadTime = formData.get("leadTime") as string
  const dateDeliveryStr = formData.get("dateDelivery") as string
  const fromUser = formData.get("fromUser") as string
  const handphone = formData.get("handphone") as string
  const remark = (formData.get("remark") as string)?.trim() || "-"

  if (
    !noInv ||
    !customer ||
    !attn ||
    !term ||
    !validity ||
    !leadTime ||
    !dateDeliveryStr ||
    !fromUser ||
    !handphone
  ) {
    return "Missing required fields"
  }

  try {
    // =========================
    // UPDATE HEADER INVOICE
    // =========================
    await prisma.invoice.updateMany({
      where: { noInv },

      data: {
        customer,
        attn,
        cc,
        term,
        validity,
        leadTime,
        fromUser,
        handphone,
        remark,
        noInv,
        dateDelivery: new Date(dateDeliveryStr),
      },
    })

    // =========================
    // PARSE ITEM DATA
    // =========================
    const itemKeys = [...formData.keys()].filter((key) =>
      key.startsWith("items[")
    )

    const groupedItems: any[] = []

    itemKeys.forEach((key) => {
      const match = key.match(/items\[(\d+)\]\.(.+)/)

      if (!match) return

      const index = Number(match[1])
      const field = match[2]

      if (!groupedItems[index]) {
        groupedItems[index] = {}
      }

      groupedItems[index][field] = formData.get(key)
    })

    // =========================
    // UPDATE PER ITEM
    // =========================
    for (const item of groupedItems) {
      await prisma.invoice.update({
        where: {
          id: item.id,
        },

        data: {
          description: item.description,
          qty: parseInt(item.qty || "1", 10),
          amountIdr: parseFloat(item.amountIdr || "0"),
        },
      })
    }
  } catch (error) {
    console.error("Update Invoice Error:", error)
    return "Failed to update invoice record"
  }

  revalidatePath("/dashboard/invoice")

  redirect("/dashboard/invoice")
}

export async function getNextSubItemNumber(customerName: string) {
  try {
    const now = new Date()
    
    // 🌟 RUMUS RANGE TANGGAL BULAN BERJALAN MURNI (Mei 2026)
    // Menghitung dari tanggal 1 jam 00:00 sampai akhir bulan jam 23:59
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Bersihkan nama dari imbuhan ekstra untuk akurasi pencarian di DB
    const cleanCustomer = customerName.replace("PT.", "").replace("PT", "").trim()

    // 🌟 COUNT KODE BARU: Jauh lebih elastis dan akurat
    const count = await prisma.invoice.count({
      where: {
        customer: {
          contains: cleanCustomer,
          mode: "insensitive" // Mengabaikan kapitalisasi huruf besar/kecil
        },
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      }
    })

    // Hitung nomor urut urutan dokumen berikutnya
    const nextSequence = count + 1
    
    // Mengubah angka biasa menjadi format 3 digit teks ("002", "003", dst)
    return String(nextSequence).padStart(3, "0")
  } catch (error) {
    console.error("Error counting sub-items:", error)
    return "001" // Fallback aman
  }
}

