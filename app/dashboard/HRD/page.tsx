import { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import FolderBrowser from "../_components/FolderBrowser";

export const metadata: Metadata = {
  title: "HRD",
  description: "UPS Dashboard - HRD Drive",
};

export const dynamic = "force-dynamic";

export default async function HRDPage() {
  const session = await requireUser();
  return (
    <FolderBrowser
      root="HRD"
      username={session.username}
      role={session.role}
    />
  );
}