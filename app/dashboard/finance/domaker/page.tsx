import { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import FolderBrowser from "../../_components/FolderBrowser";

export const metadata: Metadata = { title: "Daftar DO Customer" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireUser();
  return (
    <FolderBrowser
      root="Finance/Do-Maker"
      username={session.username}
      role={session.role}
      backHref="/dashboard/Finance"
      backLabel="← Finance"
    />
  );
}
