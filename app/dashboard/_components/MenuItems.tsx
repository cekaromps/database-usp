import {
  IoPeopleOutline,
  IoStatsChartOutline,
  IoCubeOutline,
  IoSettingsOutline,
  IoConstruct,
} from "react-icons/io5";
import { MenuItem } from "./MenuCard";
import type { AssignableSectionKey } from "@/lib/section-routing";

export type SectionMenuItem = MenuItem & { section: AssignableSectionKey };

export const menuItems: SectionMenuItem[] = [
  {
    section: "HRD",
    href: "/dashboard/HRD",
    icon: <IoPeopleOutline className="w-8 h-8 text-macos-primary" />,
    title: "HRD",
    description: "Manajemen karyawan, absensi, cuti, dan gaji.",
  },
  {
    section: "finance",
    href: "/dashboard/finance",
    icon: <IoStatsChartOutline className="w-8 h-8 text-macos-primary" />,
    title: "Finance",
    description: "Invoice, Quotation, dll.",
  },
  {
    section: "production",
    href: "/dashboard/production",
    icon: <IoCubeOutline className="w-8 h-8 text-macos-primary" />,
    title: "Production",
    description: "Orders and Travels",
  },
  {
    section: "design",
    href: "/dashboard/design",
    icon: <IoConstruct className="w-8 h-8 text-macos-primary" />,
    title: "Design & Draft",
    description: "Design and Draft Folder",
  },
];

export const adminMenuItem: MenuItem = {
  href: "/dashboard/admin/users",
  icon: <IoSettingsOutline className="w-8 h-8 text-macos-primary" />,
  title: "Manajemen User",
  description: "Kelola akun, tipe akun (akses section), dan status aktif.",
};
