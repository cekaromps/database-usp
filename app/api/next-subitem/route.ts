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

const CUSTOMER_DATA: Record<string, { code: string; address: string }> = {
  "PT OSI": { 
    code: "001", 
    address: "" 
  },
  "PT ALCOTRAINDO BATAM": { 
    code: "006", 
    address: "" 
  },
  "PT NOK FREDEUNBERG BATAM": { 
    code: "024", 
    address: "" 
  },
  "PT AMTEK RE-ENGINEERING": { 
    code: "029", 
    address: "" 
  },
  "PT CLADTEK": { 
    code: "034", 
    address: "" 
  },
  "PT RAAJRATNA": { 
    code: "036", 
    address: "" 
  },
  "PT ALTECO CHEMICAL": { 
    code: "043", 
    address: "" 
  },
  "PT DYNACAST INDONESIA": { 
    code: "078", 
    address: "" 
  },
  "PT INDO KREASI GRAFIKA": { 
    code: "092", 
    address: "" 
  },
  "CV. CILINTON BARAT": { 
    code: "093", 
    address: "" 
  },
  "PT BROADFAR INDONESIA": { 
    code: "098", 
    address: "" 
  },
  "PT PECM INDONESIA": { 
    code: "096", 
    address: "" 
  },
  "PT LABROY": { 
    code: "103", 
    address: "" 
  },
  "PT WAHANA TIRTA MILENIA": { 
    code: "106", 
    address: "" 
  },
  "PT. BATAM NIAGA": { 
    code: "107", 
    address: "" 
  },
  "PT TSI SMART PRODUCTS": { 
    code: "108", 
    address: "" 
  },
  "PT. BLUE OCEAN LABS": { 
    code: "109", 
    address: "" 
  },
  "PT. BEC": { 
    code: "110", 
    address: "" 
  }
};

    const cleanInput = customer.toUpperCase().trim();
    let companyCode = "000";
    let customerAddress = "test";

    for (const [name, data] of Object.entries(CUSTOMER_DATA)) {
      if (cleanInput === name.toUpperCase()) {
        companyCode = data.code.padStart(3, "0");
        customerAddress = data.address;
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
      { sequence: nextSequence, address: customerAddress },
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
