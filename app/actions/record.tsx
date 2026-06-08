"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"
import { redirect } from "next/navigation"

export async function uploadExcelAction(formData: FormData) {
  const file = formData.get("excelFile") as File
  
  if (!file || file.size === 0) {
    return { success: false, message: "No file uploaded", inserted: 0, skipped: [] }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
    
    const firstSheetName = workbook.SheetNames && workbook.SheetNames.length > 0 
      ? workbook.SheetNames[0] 
      : null

    if (!firstSheetName) {
      return { success: false, message: "Gagal mendeteksi nama Sheet di dalam file Excel.", inserted: 0, skipped: [] }
    }

    const worksheet = workbook.Sheets[firstSheetName]
    
    // 🌟 REVOLUSI UTAMA: Paksa membaca Excel menjadi Array murni (header: 1)
    // Cara ini membuat data dibaca sebagai susunan koordinat: row[0] = Kolom A, row[1] = Kolom B, dst.
    // 100% kebal dari kesalahan ejaan nama header atau baris judul perusahaan yang merusak format!
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][]

    if (rawRows.length === 0) {
      return { success: false, message: "Berkas Excel yang diunggah terbaca hampa atau kosong.", inserted: 0, skipped: [] }
    }

    let currentCustomer = ""
    let currentQuotation = ""
    let currentNoPo = ""
    let currentDeliveryDate: Date | null = null
    let currentNoDo = ""
    let currentNoInv = ""

    const recordsToInsert = []
    const skippedRowsReport: Array<{ rowNumber: number; customer: string; desc: string; reason: string }> = []

    // Mulai membaca dari baris ke-2 (Indeks 1) untuk melewati baris header nama kolom di Excel
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i]
      const excelRowNumber = i + 1 // Baris riil di aplikasi Excel Anda

      // Jika baris hampa atau kurang dari 2 kolom, lewati saja
      if (!row || row.length < 2) continue;

      // 🌟 PEMETAAN POSISI KOLOM MURNI BERDASARKAN INDEKS MATRIKS SPREADSHEET (ANTI-MISMATCH):
      // row[0] = Kolom A (Customer)
      // row[1] = Kolom B (Description of Goods)
      // row[2] = Kolom C (Quotation No)
      // row[3] = Kolom D (No. PO)
      // row[4] = Kolom E (Delivery Date)
      // row[5] = Kolom F (No. DO)
      // row[6] = Kolom G (No. Invoice)
      // row[7] = Kolom H (Amount IDR)
      // row[8] = Kolom I (Remark)
      
      const excelCustomer = row[0]
      const excelDesc = row[1]
      const excelQuotation = row[2]
      const excelNoPo = row[3]
      const excelDate = row[4]
      const excelNoDo = row[5]
      const excelNoInv = row[6]
      const excelAmount = row[7]
      const excelRemark = row[8]

      // Logika Forward Fill untuk Merged Cells (Mengunci sisa baris kosong di bawahnya)
      if (excelCustomer && String(excelCustomer).trim() !== "") currentCustomer = String(excelCustomer).trim()
      if (excelQuotation && String(excelQuotation).trim() !== "") currentQuotation = String(excelQuotation).trim()
      if (excelNoPo && String(excelNoPo).trim() !== "") currentNoPo = String(excelNoPo).trim()
      if (excelNoDo && String(excelNoDo).trim() !== "") currentNoDo = String(excelNoDo).trim()
      if (excelNoInv && String(excelNoInv).trim() !== "") currentNoInv = String(excelNoInv).trim()
      
      if (excelDate && String(excelDate).trim() !== "") {
        if (excelDate instanceof Date) {
          currentDeliveryDate = excelDate
        } else {
          const parsed = Date.parse(String(excelDate))
          if (!isNaN(parsed)) currentDeliveryDate = new Date(parsed)
        }
      }

      // Bersihkan teks mata uang rupiah
      let rawAmount = String(excelAmount || "0")
      rawAmount = rawAmount.replace(/Rp/g, "").replace(/\./g, "").replace(/,/g, "").trim()
      const parsedAmount = parseFloat(rawAmount) || 0
      const cleanDesc = String(excelDesc || "").trim()

      // DETEKSI FILTER PENYARINGAN BARIS
      
      // Kasus A: Baris hampa kosong murni di Excel
      if (cleanDesc === "" && parsedAmount === 0 && !excelCustomer) {
        continue 
      }

      // Kasus B: Baris total ringkasan bawah Excel
      if (cleanDesc.toLowerCase().includes("total") || cleanDesc === "GRAND TOTAL" || cleanDesc.toLowerCase().includes("jumlah")) {
        skippedRowsReport.push({
          rowNumber: excelRowNumber,
          customer: currentCustomer || "-",
          desc: cleanDesc,
          reason: "Baris Ringkasan Total (Summary Line) dilewati otomatis"
        })
        continue
      }

      // Kasus C: Baris data rusak / Parameter Utama Hilang (Pemicu Error Prisma)
      if (!currentCustomer || currentCustomer === "UNKNOWN" || !currentNoInv) {
        skippedRowsReport.push({
          rowNumber: excelRowNumber,
          customer: currentCustomer || "Kosong",
          desc: cleanDesc || "Tanpa Deskripsi",
          reason: "Kolom Customer Name atau Nomor Invoice hampa/tidak terdeteksi"
        })
        continue
      }

      if (!currentCustomer || currentCustomer === "UNKNOWN" || !currentNoInv) {
        skippedRowsReport.push({
          rowNumber: excelRowNumber,
          customer: currentCustomer || "Kosong",
          desc: cleanDesc || "Tanpa Deskripsi",
          reason: "Kolom Customer Name atau Nomor Invoice hampa/tidak terdeteksi"
        })
        continue
      }

      // 🌟 🆕 SEKSI BARU: DUPLICATE CHECK ANTI-GAGAL BERBASIS DATABASE REAL-TIME
      // Memeriksa apakah baris item ini sudah pernah sukses terunggah sebelumnya
      const isDuplicateInDB = await prisma.invoiceRecord.findFirst({
        where: {
          noInv: currentNoInv,
          noPo: currentNoPo,
          description: cleanDesc
        }
      })

      if (isDuplicateInDB) {
        skippedRowsReport.push({
          rowNumber: excelRowNumber,
          customer: currentCustomer,
          desc: cleanDesc,
          reason: "Data sudah pernah di-upload sebelumnya (Terdeteksi Duplikat)"
        })
        continue // 🚀 Langsung lewati (skip) baris ini agar tidak ganda di database!
      }

      recordsToInsert.push({
        customer: currentCustomer,
        description: cleanDesc || "-",
        quotationNumber: currentQuotation || "-",
        noPo: currentNoPo || "-",
        dateDelivery: currentDeliveryDate || new Date(),
        noDo: currentNoDo || "-",
        noInv: currentNoInv || "-",
        amountIdr: parsedAmount,
        remark: excelRemark && String(excelRemark).trim() !== "" ? String(excelRemark).trim() : "-",
      })
    }

    if (recordsToInsert.length === 0) {
      return { success: false, message: "Tidak ada baris data valid yang bisa diimport. Pastikan urutan Kolom A sampai I sesuai format.", inserted: 0, skipped: skippedRowsReport }
    }

    // Jalankan transaksi masal murni ke database
    await prisma.$transaction(
      recordsToInsert.map((item) =>
        prisma.invoiceRecord.create({
          data: item as any,
        })
      )
    )

    revalidatePath("/dashboard/datapodo")
    return { success: true, message: "Bulk import Excel berhasil!", inserted: recordsToInsert.length, skipped: skippedRowsReport }

  } catch (error) {
    console.error("Excel Parsing Error:", error)
    return { success: false, message: "Gagal memproses berkas Excel karena error internal database.", inserted: 0, skipped: [] }
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
        address
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

const CUSTOMER_DATA: Record<string, { code: string; address: string }> = {
  "PT OSI": { code: "001", address: "Cammo Industrial Park Blok B2 No. 3A Batam Center Batam - Indonesia" },
  "PT ALCOTRAINDO BATAM": { code: "006", address: "Citra Buana III Lot 40 C, Batam Center  Indonesia 29400" },
  "PT NOK FREDEUNBERG BATAM": { code: "024", address: "Jln. Rambutan Lot 501/501A , 502/502A Batamindo Industrial Park Mukakuning, Batam 29433" },
  "PT AMTEK RE-ENGINEERING": { code: "029", address: "Jln. Letjen Soeprapto, Cammo Industrial Park Block E No. 1 Batam Center 29432" },
  "PT CLADTEK": { code: "034", address: "Jln Tenggiri - Batu Ampar" },
  "PT RAAJRATNA": { code: "036", address: "Tunas Industrial Estate Block 8D & 8E Batam - Indonesia " },
  "PT ALTECO CHEMICAL": { code: "043", address: "Jl. Angsana Lot 286 & 287 BIP Muka Kuning Batam - Indonesia" },
  "PT DYNACAST INDONESIA": { code: "078", address: "Jalan Rambutan, Lot 517, Batamindo Industrial Park Mukakuning , Batam - Indonesia" },
  "PT INDO KREASI GRAFIKA": { code: "092", address: "Tunas Industrial Estate, Lot 1 - H, Belian " },
  "CV. CILINTON BARAT": { code: "093", address: "Komplek Legenda Gemilang A No. 8 Batam - Indonesia" },
  "PT BROADFAR INDONESIA": { code: "098", address: "Kawasan Industri tunas Kabil Batam Kepri - Indonesia" },
  "PT PECM INDONESIA": { code: "096", address: "Tanjung Uncang, Batam" },
  "PT LABROY": { code: "103", address: "Jalan Patimura RT.001/RW.001, Telaga Punggur, Kelurahan Kabil, Kecamatan Nongsa Batam Kepualauan Riau - Indonesia" },
  "PT WAHANA TIRTA MILENIA": { code: "106", address: "Jl. Hang Kesturi IV No. 29 Batu Besar, Nongsa Batam Kepulauan Riau 29466" },
  "PT. BATAM NIAGA": { code: "107", address: "Komp. Citra Buana Industrial Park I Jl. Yos Sudarso Blok A No 6 Kp. Pelita  Kec. Lubuk Baja Kota Batam Kepulauan Riau 29432 Indonesia " },
  "PT TSI SMART PRODUCTS": { code: "108", address: "Panbil Industrial estate block E lot 6 - 9 Kota Batam     Kepulauan Riau 29443" },
  "PT. BLUE OCEAN LABS": { code: "109", address: "Kompleks Sarana Industri Point Blok D No 7 & 8 Kepulauan Riau 29422 Indonesia " },
  "PT. BEC": { code: "110", address: "Komp. Sarana Industrial Point Blok E No. 05 Batam Center, Pulau Batam 29432" },
  "PT. INDO KREASI GRAFIKA": { code: "092", address: "Tunas Industrial Estate, Lot 1 - H, Belian "},
  "PT. KANGLY BATAM": { code: "062", address: "Kawasan Industri Tunas 2 Block 1C, Batam Center"},
  "INSTITUT TEKNOLOGI BATAM": { code: "098", address: "The Vitka City Complex, Tiban, Jl. Gajah Mada,Kota Batam, Kepulauan Riau"}
};

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
  const discount = parseFloat(formData.get("discount") as string) || 0;
  
  const rawRemark = formData.get("remark") as string
  const remark = rawRemark && rawRemark.trim() !== "" ? rawRemark.trim() : "Prices are valid 1 month after offer is sent"

  const itemsJson = formData.get("itemsJson") as string
  if (!itemsJson) return "No items added"

  const items = JSON.parse(itemsJson) as Array<{ description: string; qty: number; amountIdr: number; processes: string[], material: string; }>

  // Validasi kolom-kolom wajib baru
  if (!customer || !attn || !term || !validity || !leadTime || !fromUser || !handphone || !quotationNumber || !dateDeliveryStr || !noInv || items.length === 0) {
    return "Missing required fields"
  }

  // 🌟 LOGIKA AUTO-FILL ALAMAT SEBELUM INSERT DATABASE
  const cleanInput = customer.toUpperCase().trim();
  let detectedAddress = "-"; // Default fallback aman jika tidak cocok

  for (const [name, data] of Object.entries(CUSTOMER_DATA)) {
    if (cleanInput === name.toUpperCase()) {
      detectedAddress = data.address; // Alamat otomatis ditarik dari list data di atas
      break;
    }
  }

    try {
    const recordsToInsert = items.map((item) => {
      // Gabungkan array proses kerja menjadi satu teks teks string dipisah koma (cth: "Grinding, Milling")
      const processString = item.processes && item.processes.length > 0 
        ? item.processes.join(", ") 
        : "-"

      return {
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
        processes: processString,
        address: detectedAddress,
        material: item.material || "-",
        discount: discount,
      }
    })


    await prisma.$transaction(
      recordsToInsert.map((record) =>
        prisma.invoice.create({
          data: record as any,
        })
      )
    )
  } catch (error) {
    console.error("Create Invoice Error:", error)
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

