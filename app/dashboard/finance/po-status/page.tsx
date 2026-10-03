import { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import FolderBrowser from "../../_components/FolderBrowser";

export const metadata: Metadata = { title: "Job Despact" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireUser();
  return (
    <FolderBrowser
      root="Finance/PO-Status"
      username={session.username}
      role={session.role}
      backHref="/dashboard/finance"
      backLabel="← Finance"
    />
  );
}
