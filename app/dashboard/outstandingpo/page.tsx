import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { JobTrackerTable, JobRowData } from "./job-tracker-table";

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

  const jobs = await prisma.job.findMany({
    orderBy: { date: "asc" },
  });

  // Decimal / Date from Prisma aren't safely passable to a Client Component,
  // so convert to plain number / ISO string first.
  const jobRows: JobRowData[] = jobs.map((job) => ({
    id: job.id,
    jobName: job.jobName,
    qty: Number(job.qty),
    uom: job.uom,
    customer: job.customer,
    date: job.date.toISOString(),
    poNumber: job.poNumber,
    leadTime: job.leadTime,
    materialStatus: job.materialStatus,
    status: job.status,
    doNumber: job.doNumber,
    remark: job.remark,
  }));

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased print:p-0 print:bg-white print:text-black">
      <JobTrackerTable jobs={jobRows} />
    </div>
  );
}
