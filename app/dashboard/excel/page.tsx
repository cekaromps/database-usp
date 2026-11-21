import { requireDrivePath } from "@/lib/rbac";
import { Metadata } from "next";
import ExcelEditor from "./Editor";

export const metadata: Metadata = { title: "Excel Editor" };
export const dynamic = "force-dynamic";

export default async function ExcelPage({searchParams}: {searchParams: {file: string}}) {
  const { file } = await searchParams;
  await requireDrivePath(file);
  return <ExcelEditor driveFile={file} />;
}
