import { requireUser } from "@/lib/rbac";
import { Metadata } from "next";
import ExcelEditor from "./Editor";

export const metadata: Metadata = { title: "Excel Editor" };
export const dynamic = "force-dynamic";

export default async function ExcelPage({searchParams}: {searchParams: {file: string}}) {
  await requireUser();
  const { file } = await searchParams;
  return <ExcelEditor driveFile={file} />;
}
