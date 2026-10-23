import * as XLSX from "xlsx";
import { checkSection } from "@/lib/rbac";
import { getDespacts } from "@/lib/despact-queries";
import { STATUS_LABELS } from "@/lib/despact-status";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {

  const mode =
    new URL(req.url).searchParams.get("mode") === "finance" ? "finance" : "production";

  const session = await checkSection(mode);
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  // Prices are finance-only, same rule as the on-screen list
  const financeSession = await checkSection("finance");
  const includePrices = mode === "finance";

  const despacts = await getDespacts({ includePrices });
  const now = new Date();

  const itemRows = despacts.flatMap((d) => {
    const allClosed = d.items.length > 0 && d.items.every((i) => i.status === "CLOSE");
    const overdue = !allClosed && new Date(d.dueDate) < now;
    return d.items.map((i) => ({
      "Customer PO": d.registrationNumber,
      Customer: d.customerName,
      Attn: d.attn,
      Description: d.shortDescription,
      "PO Date": new Date(d.poDate),
      "Due Date": new Date(d.dueDate),
      Overdue: overdue ? "Yes" : "No",
      Item: i.description,
      Qty: i.qty,
      Unit: i.unit,
      ...(includePrices ? { "Amount IDR": i.amountIdr ?? 0 } : {}),
      Status: STATUS_LABELS[i.status],
      "Last Comment": i.comments.length ? i.comments[i.comments.length - 1].body : "",
    }));
  });

  const commentRows = despacts.flatMap((d) =>
    d.items.flatMap((i) =>
      i.comments.map((c) => ({
        "Registration No": d.registrationNumber,
        Customer: d.customerName,
        Item: i.description,
        Author: c.authorName,
        Date: new Date(c.createdAt),
        Comment: c.body,
      })),
    ),
  );

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(itemRows, { dateNF: "dd mmm yyyy" });
  ws1["!cols"] = [
    { wch: 18 }, { wch: 28 }, { wch: 16 }, { wch: 24 }, { wch: 13 }, { wch: 13 },
    { wch: 9 }, { wch: 34 }, { wch: 7 }, { wch: 7 },
    ...(includePrices ? [{ wch: 16 }] : []),
    { wch: 15 }, { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Despact");

  const ws2 = XLSX.utils.json_to_sheet(commentRows, { dateNF: "dd mmm yyyy hh:mm" });
    ws2["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 34 }, { wch: 16 }, { wch: 18 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Comments");

  const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx", cellDates: true });
  const date = now.toISOString().slice(0, 10);

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="despact-report-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
