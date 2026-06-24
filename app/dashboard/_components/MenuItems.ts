import { MenuItem } from "./MenuCard";

export const menuItems: MenuItem[] = [
  {
    href: "/dashboard/datapodo",
    icon: "📦",
    title: "Data PO & DO",
    description:
      "Pelacakan pesanan, input nota DO/invoice, import data dari berkas Excel.",
  },
  {
    href: "/dashboard/invoicemaker",
    icon: "📃",
    title: "Quotation Maker",
    description: "Buat quotation, data langsung tersimpan ke database",
  },
  {
    href: "/dashboard/invoice",
    icon: "📊",
    title: "Quotation Records List",
    description:
      "Lihat histori seluruh quotation multi-item, cari dokumen berdasarkan nama PT, serta cetak ulang lembar PDF.",
  },
  {
    href: "/dashboard/drive",
    icon: "📁",
    title: "File Database",
    description: "Database dalam bentuk file",
  },
  {
    href: "/dashboard/accounting",
    icon: "📊",
    title: "Accounting",
    description: "Laporan keuangan, neraca, laba rugi, dan analisis keuangan.",
  },
  {
    href: "/dashboard/outstandingpo",
    icon: "📊",
    title: "Outstanding PO",
    description: "PO dan yang belum selesai",
  },
  {
    icon: "👥",
    title: "HR",
    disabled: true,
  },
  {
    icon: "👥",
    title: "Manajemen User",
    description: "Manajemen akun",
    disabled: true,
  },
  {
    icon: "⚙️",
    title: "Aplikasi",
    description: "Pengaturan aplikasi",
    disabled: true,
  },
];
