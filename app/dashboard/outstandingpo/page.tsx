import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { PoTaskTrackerTable } from "./job-tracker-table";

export const metadata: Metadata = {
  title: "Job Progress Tracker",
};

export const dynamic = "force-dynamic";

export default async function OutstandingPO() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/signin");
  }

  // Decimal / Date from Prisma aren't safely passable to a Client Component,
  // so convert to plain number / ISO string first.

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased print:p-0 print:bg-white print:text-black">
      <PoTaskTrackerTable />
    </div>
  );
}
