import {
  IoPeopleOutline,
  IoStatsChartOutline,
  IoCubeOutline,
  IoSettingsOutline,
  IoConstruct,
} from "react-icons/io5";
import { MenuItem } from "./MenuCard";

export const menuItems: MenuItem[] = [
  {
    href: "/dashboard/HRD",
    icon: <IoPeopleOutline className="w-8 h-8 text-macos-primary" />,
    title: "HRD",
    description: "Manajemen karyawan, absensi, cuti, dan gaji.",
  },
  {
    href: "/dashboard/finance",
    icon: <IoStatsChartOutline className="w-8 h-8 text-macos-primary" />,
    title: "Finance",
    description: "Invoice, Quotation, dll.",
  },
  {
    href: "/dashboard/production",
    icon: <IoCubeOutline className="w-8 h-8 text-macos-primary" />,
    title: "Production",
    description: "Orders and Travels",
  },
  {
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
  description: "Kelola akun, role (superadmin/admin/user), dan status aktif.",
};
