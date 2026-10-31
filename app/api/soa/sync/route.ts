import { checkSection } from "@/lib/rbac";
import { syncPeriodToDrive } from "@/lib/soa-sync";
import { isValidPeriod } from "@/lib/soa-core";

export const dynamic = "force-dynamic";

// POST { period: "2026-02", refresh?: boolean } -> writes every company's SOA into Finance/SOA/<company>/
export async function POST(req: Request) {
  const session = await checkSection("finance");
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (!isValidPeriod(body?.period)) return Response.json({ error: "Pilih bulan yang valid." }, { status: 400 });

  try {
    const result = await syncPeriodToDrive(body.period, {
      refresh: body.refresh === true,
      createdBy: session.username,
    });
    if (result.written + result.skipped === 0) {
      return Response.json({ error: "Tidak ada item yang di-close pada bulan ini." }, { status: 404 });
    }
    return Response.json({ success: true, ...result });
  } catch (e) {
    console.error("[soa-sync]", e);
    return Response.json({ error: "Gagal menyimpan SOA ke folder." }, { status: 500 });
  }
}
