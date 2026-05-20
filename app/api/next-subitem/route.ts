import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customer = searchParams.get("customer") || "";

    if (!customer || customer.trim() === "") {
      return NextResponse.json({ sequence: "001" });
    }

    const CUSTOMER_CODES: Record<string, string> = {
      "PT OSI": "001",
      "PT ALCOTRAINDO BATAM": "006",
      "PT NOK FREDEUNBERG BATAM": "024",
      "PT AMTEK RE-ENGINEERING": "029",
      "PT CLADTEK": "034",
      "PT RAAJRATNA": "036",
      "PT ALTECO CHEMICAL": "043",
      "PT DYNACAST INDONESIA": "078",
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
    };

    const cleanInput = customer.toUpperCase().trim();
    let companyCode = "000";

    for (const [name, code] of Object.entries(CUSTOMER_CODES)) {
      if (cleanInput === name.toUpperCase()) {
        companyCode = code.padStart(3, "0");
        break;
      }
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const datePrefix = `${yy}${mm}`; 

    const targetPattern = `Q${companyCode}-${datePrefix}-`;

    // 🌟 REVOLUSI HITUNGAN: Ambil grup nomor invoice unik (Distinct noInv)
    // Ini menjamin 1 Invoice dengan 10 barang tetap dihitung sebagai 1 Dokumen Quotation!
    const uniqueInvoices = await prisma.invoice.groupBy({
      by: ["noInv"],
      where: {
        quotationNumber: {
          contains: targetPattern,
          mode: "insensitive"
        }
      }
    });

    // Urutan dokumen berikutnya adalah jumlah total invoice unik ditambah 1
    const nextSequence = String(uniqueInvoices.length + 1).padStart(3, "0");
    
    return NextResponse.json(
      { sequence: nextSequence },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ sequence: "001" });
  }
}
