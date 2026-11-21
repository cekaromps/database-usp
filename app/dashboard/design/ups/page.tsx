import { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import FolderBrowser from "../../_components/FolderBrowser";

export const metadata: Metadata = { title: "UPS Design and Draft" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireUser();
  return (
    <FolderBrowser
      root="Design/UPS/"
      username={session.username}
      role={session.role}
      backHref="/dashboard"
      backLabel="← Dashboard"
    />
  );
}
