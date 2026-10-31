import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { checkSection } from "@/lib/rbac";
import { getStatement, customerIdsForPeriod } from "@/lib/soa";
import { buildSoaWorkbook } from "@/lib/soa-xlsx";
import { isValidPeriod, statementFileName } from "@/lib/soa-core";

export const dynamic = "force-dynamic";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function loadLogo(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "ups.png"));
  } catch {
    return null;
  }
}

// GET /api/soa?period=2026-02&customerId=5            -> one .xlsx
// GET /api/soa?period=2026-02&customerId=all          -> .zip with one .xlsx per company
// add &refresh=1 to rebuild from current data instead of the saved copy
export async function GET(req: Request) {
  const session = await checkSection("finance");
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const q = new URL(req.url).searchParams;
  const period = q.get("period");
  const customer = q.get("customerId");
  const refresh = q.get("refresh") === "1";

  if (!isValidPeriod(period)) return Response.json({ error: "Pilih bulan yang valid." }, { status: 400 });
  if (!customer) return Response.json({ error: "Pilih perusahaan." }, { status: 400 });

  const logo = loadLogo();
  const createdBy = session.username;

  if (customer === "all") {
    const ids = await customerIdsForPeriod(period);
    const zip = new JSZip();
    for (const id of ids) {
      const s = await getStatement(id, period, { refresh });
      if (!s) continue;
      zip.file(statementFileName(s), await buildSoaWorkbook(s, { createdBy, logo }));
    }
    if (Object.keys(zip.files).length === 0) {
      return Response.json({ error: "Tidak ada SOA untuk bulan ini." }, { status: 404 });
    }
    const buf = await zip.generateAsync({ type: "uint8array" });
    return new Response(buf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="SOA-${period}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const customerId = Number(customer);
  if (!Number.isInteger(customerId)) return Response.json({ error: "Perusahaan tidak valid." }, { status: 400 });

  const s = await getStatement(customerId, period, { refresh });
  if (!s) {
    return Response.json(
      { error: "Tidak ada item yang di-close untuk perusahaan ini di bulan tersebut." },
      { status: 404 },
    );
  }
  const buf = await buildSoaWorkbook(s, { createdBy, logo });
  const name = statementFileName(s);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "no-store",
    },
  });
}
