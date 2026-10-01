import { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import FolderBrowser from "../../../_components/FolderBrowser";

export const metadata: Metadata = { title: "Customer Design and Draft" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireUser();
  return (
    <FolderBrowser
      root="Design/Customer/Draft/"
      username={session.username}
      role={session.role}
      backHref="/dashboard/design"
      backLabel="← Dashboard"
    />
  );
}
