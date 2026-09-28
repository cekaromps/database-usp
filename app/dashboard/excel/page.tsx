import { requireUser } from "@/lib/rbac";
import { Metadata } from "next";
import ExcelEditor from "./Editor";

export const metadata: Metadata = { title: "Excel Editor" };
export const dynamic = "force-dynamic";

export default async function ExcelPage() {
  await requireUser();
  return <ExcelEditor />;
}
