import { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import FolderBrowser from "../_components/FolderBrowser";

export const metadata: Metadata = {
  title: "Production",
  description: "UPS Dashboard - Production Drive",
};

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const session = await requireUser();
  return (
    <FolderBrowser
      root="Production"
      username={session.username}
      role={session.role}
    />
  );
}