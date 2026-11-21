import ExcelJS from "exceljs";
import { periodLabel, PPH23_RATE, type SoaStatementData } from "@/lib/soa-core";

// Letterhead + signatories printed on every statement (taken from 098-UPS.SOA/II/2026).
export const SOA_COMPANY = {
  name: "PT. UTAMA PASOGIT SEJAHTERA",
  address: "Kompleks Mahkota Niaga Block B No. 5 Batam Centre, Batam 29341 Indonesia",
  contact: "Email : sales@utamapasogits.com    Telp. +62 778 749 5365",
  web: "www.utamapasogits.com",
  approvedBy: process.env.SOA_APPROVED_BY || "SITOR H",
};

const FONT = "Cambria";
const THIN: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

/** Excel stores dates as UTC serials; shift to Jakarta wall-clock first so 13-Feb stays 13-Feb. */
function sheetDate(iso: string | null): Date | null {
  if (!iso) return null;
  const j = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()));
}

export async function buildSoaWorkbook(
  s: SoaStatementData,
  opts: { createdBy: string; logo?: Buffer | null },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = SOA_COMPANY.name;
  const ws = wb.addWorksheet("SOA", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    views: [{ showGridLines: false }],
  });

  // A  B  C  D   E   F   G   H   I  J   K  L   M   N  O   P
  const widths = [5, 6, 6, 46, 15, 11, 14, 11, 7, 11, 7, 11, 15, 6, 17, 6];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  const LAST = 16;

  const put = (
    addr: string,
    value: ExcelJS.CellValue,
    o: {
      bold?: boolean;
      size?: number;
      align?: "left" | "center" | "right";
      v?: "top" | "middle" | "bottom";
      wrap?: boolean;
      underline?: boolean;
      numFmt?: string;
      border?: boolean;
    } = {},
  ) => {
    const c = ws.getCell(addr);
    c.value = value;
    c.font = { name: FONT, size: o.size ?? 9, bold: o.bold, underline: o.underline };
    c.alignment = {
      horizontal: o.align ?? "left",
      vertical: o.v ?? "middle",
      wrapText: o.wrap,
    };
    if (o.numFmt) c.numFmt = o.numFmt;
    if (o.border) c.border = THIN;
    return c;
  };

  // ---------- letterhead ----------
  ws.mergeCells("D1:P1");
  put("D1", SOA_COMPANY.name, { bold: true, size: 16, align: "center" });
  ws.mergeCells("D2:P2");
  put("D2", SOA_COMPANY.address, { size: 8, align: "center" });
  ws.mergeCells("D3:P3");
  put("D3", SOA_COMPANY.contact, { size: 8, align: "center" });
  ws.mergeCells("D4:P4");
  put("D4", SOA_COMPANY.web, { size: 8, align: "center" });
  for (let c = 1; c <= LAST; c++) ws.getCell(5, c).border = { bottom: { style: "thick" } };
  ws.getRow(5).height = 4;

  if (opts.logo) {
    const id = wb.addImage({ buffer: opts.logo as unknown as ExcelJS.Buffer, extension: "png" });
    ws.addImage(id, { tl: { col: 1.0, row: 0.1 }, ext: { width: 78, height: 78 } });
    for (let r = 1; r <= 4; r++) ws.getRow(r).height = 20;
  }

  ws.mergeCells("A7:P7");
  put("A7", "STATEMENT OF ACCOUNT", { bold: true, size: 11, align: "center", underline: true });
  ws.getRow(7).height = 20;

  // ---------- To / statement info ----------
  put("A9", "To :", { bold: true });
  ws.mergeCells("B9:J9");
  put("B9", s.customerName, { bold: true, size: 10 });
  ws.mergeCells("B10:J11");
  put("B10", s.customerAddress, { size: 9, wrap: true, v: "top" });

  ws.mergeCells("K9:M9");
  put("K9", "Statement Number", { bold: true });
  ws.mergeCells("N9:P9");
  put("N9", s.statementNumber, { bold: true });
  ws.mergeCells("K10:M10");
  put("K10", "Statement Periode", { bold: true });
  ws.mergeCells("N10:P10");
  put("N10", periodLabel(s.period), { bold: true });

  // ---------- table header (2 rows) ----------
  const H1 = 13;
  const H2 = 14;
  const hdr = { bold: true, align: "center" as const, border: true };
  for (const [col, text] of [
    ["A", "No"],
    ["B", "QTY"],
    ["C", "UOM"],
    ["D", "DESCRIPTIONS"],
  ] as const) {
    ws.mergeCells(`${col}${H1}:${col}${H2}`);
    put(`${col}${H1}`, text, hdr);
    ws.getCell(`${col}${H2}`).border = THIN;
  }
  for (const [from, to, text] of [
    ["E", "F", "QUOTE"],
    ["G", "H", "PO"],
    ["I", "J", "DO"],
    ["K", "L", "INV"],
    ["M", "N", "PRICE"],
    ["O", "P", "AMOUNT"],
  ] as const) {
    ws.mergeCells(`${from}${H1}:${to}${H1}`);
    put(`${from}${H1}`, text, hdr);
    ws.getCell(`${to}${H1}`).border = THIN;
  }
  ["No", "Date", "No", "Date", "No", "Date", "No", "Date", "IDR", "SGD", "IDR", "SGD"].forEach((t, i) =>
    put(`${String.fromCharCode(69 + i)}${H2}`, t, hdr),
  );

  // ---------- body ----------
  const MONEY = "#,##0.00";
  const DATE = "d-mmm-yy";
  let r = H2 + 1;
  for (const b of s.blocks) {
    b.lines.forEach((l, idx) => {
      const first = idx === 0;
      put(`A${r}`, first ? b.no : null, { align: "center", border: true });
      put(`B${r}`, l.qty, { align: "center", border: true });
      put(`C${r}`, l.unit, { align: "center", border: true });
      put(`D${r}`, l.description, { wrap: true, border: true });
      const refs: [string, ExcelJS.CellValue, string?][] = [
        ["E", first ? b.quoteNo : null],
        ["F", first ? sheetDate(b.quoteDate) : null, DATE],
        ["G", first ? b.poNo : null],
        ["H", first ? sheetDate(b.poDate) : null, DATE],
        ["I", first ? b.doNo : null],
        ["J", first ? sheetDate(b.doDate) : null, DATE],
        ["K", first ? b.invNo : null],
        ["L", first ? sheetDate(b.invDate) : null, DATE],
      ];
      for (const [col, v, fmt] of refs) {
        put(`${col}${r}`, v, { align: "center", border: true, numFmt: fmt });
      }
      put(`M${r}`, l.price, { align: "right", border: true, numFmt: MONEY });
      put(`N${r}`, null, { border: true });
      put(`O${r}`, l.amount, { align: "right", border: true, numFmt: MONEY });
      put(`P${r}`, null, { border: true });
      r++;
    });
    // thin spacer between POs, like the printed statements
    for (let c = 1; c <= LAST; c++) ws.getCell(r, c).border = THIN;
    ws.getRow(r).height = 6;
    r++;
  }

  // ---------- totals ----------
  const total = (row: number, label: string, value: number, o: { bold?: boolean; rp?: boolean } = {}) => {
    ws.mergeCells(`A${row}:N${row}`);
    put(`A${row}`, label, { bold: o.bold, align: "center", border: true });
    put(`O${row}`, value, {
      bold: o.bold,
      align: "right",
      border: true,
      numFmt: o.rp ? '"Rp" #,##0.00' : MONEY,
    });
    put(`P${row}`, null, { border: true });
    for (let c = 1; c <= 14; c++) ws.getCell(row, c).border = THIN;
  };
  total(r, "TOTAL AMOUNT", s.totalIdr);
  total(r + 1, `TAX PPH23 ${Math.round(PPH23_RATE * 100)}%`, s.pph23Idr);
  total(r + 2, "TOTAL AMOUNT", s.netIdr, { bold: true, rp: true });
  const lastTableRow = r + 2;

  // ---------- signatures ----------
  const sig = lastTableRow + 3;
  for (const [range, text] of [
    [`G${sig}:I${sig}`, "Created By,"],
    [`J${sig}:L${sig}`, "Approved By,"],
    [`M${sig}:O${sig}`, "Received By,"],
  ] as const) {
    ws.mergeCells(range);
    put(range.split(":")[0], text, { align: "center" });
  }
  const names = sig + 4;
  for (const [range, text] of [
    [`G${names}:I${names}`, opts.createdBy.toUpperCase()],
    [`J${names}:L${names}`, SOA_COMPANY.approvedBy.toUpperCase()],
    [`M${names}:O${names}`, "...................."],
  ] as const) {
    ws.mergeCells(range);
    put(range.split(":")[0], text, { align: "center", bold: true, underline: true });
  }

  ws.pageSetup.printArea = `A1:P${names + 1}`;

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}
