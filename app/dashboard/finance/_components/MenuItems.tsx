import { MenuItem } from "./MenuCard";

export const menuItems: MenuItem[] = [
  {
    href: "/dashboard/kontrak",
    icon: "👥",
    title: "Surat Kontrak",
    description: "Kontrak",
  },
  {
    href: "/dashboard/finance",
    icon: "📊",
    title: "Finance",
    description: "Invoice, Quotation, dll.",
  },
  {
    href: "/dashboard/production",
    icon: "📦",
    title: "Production",
    description: "Orders and Travels",
  },
  //{
  //  href: "/dashboard/administration",
  //  icon: "⚙️",
  //  title: "Administration",
  //  description: "User administration",
  //},
  //{
  //  href: "/dashboard/invoicemaker",
  //  icon: "📃",
  //  title: "Quotation Maker",
  //  description: "Buat quotation, data langsung tersimpan ke database",
  //},
  //{
  //  href: "/dashboard/invoice",
  //  icon: "📊",
  //  title: "Quotation Records List",
  //  description:
  //    "Lihat histori seluruh quotation multi-item, cari dokumen berdasarkan nama PT, serta cetak ulang lembar PDF.",
  //},
  //{
  //  href: "/dashboard/drive",
  //  icon: "📁",
  //  title: "File Database",
  //  description: "Database dalam bentuk file",
  //},
  //{
  //  href: "/dashboard/accounting",
  //  icon: "📊",
  //  title: "Accounting",
  //  description: "Laporan keuangan, neraca, laba rugi, dan analisis keuangan.",
  //},
  //{
  //  href: "/dashboard/outstandingpo",
  //  icon: "📊",
  //  title: "Outstanding PO",
  //  description: "PO dan yang belum selesai",
  //},
  //{
  //  href: "/dashboard/ecom",
  //  icon: "👜",
  //  title: "Ecommerce",
  //  description: "List item ecommerce",
  //},
  //{
  //  icon: "👥",
  //  title: "HR",
  //  disabled: true,
  //},
  //{
  //  icon: "👥",
  //  title: "Manajemen User",
  //  description: "Manajemen akun",
  //  disabled: true,
  //},
];

// Only shown to ADMIN / SUPERADMIN — appended dynamically in dashboard/page.tsx
// based on the logged-in user's role, instead of being a static disabled tile.
export const adminMenuItem: MenuItem = {
  href: "/dashboard/admin/users",
  icon: "⚙️",
  title: "Manajemen User",
  description: "Kelola akun, role (superadmin/admin/user), dan status aktif.",
};
