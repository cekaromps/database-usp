import { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import FolderBrowser from "../../_components/FolderBrowser";
import SoaSyncPanel from "./SoaSyncPanel";
import { SOA_DRIVE_ROOT } from "@/lib/soa-files";

export const metadata: Metadata = { title: "SOA" };
export const dynamic = "force-dynamic";

// One folder per company inside Finance/SOA, each holding that company's monthly SOA files.
export default async function Page() {
  const session = await requireUser();
  return (
    <>
      <FolderBrowser
        root={SOA_DRIVE_ROOT}
        username={session.username}
        role={session.role}
        backHref="/dashboard/finance"
        backLabel="← Finance"
      />
      <SoaSyncPanel />
    </>
  );
}
