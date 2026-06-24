"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createJob(formData: FormData) {
  const jobName = formData.get("jobName") as string;
  const qty = formData.get("qty") as string;
  const uom = formData.get("uom") as string;
  const customer = formData.get("customer") as string;
  const date = formData.get("date") as string;
  const poNumber = formData.get("poNumber") as string;
  const leadTime = formData.get("leadTime") as string;
  const materialStatus = formData.get("materialStatus") as string;
  const status = formData.get("status") as string;
  const remark = formData.get("remark") as string;

  // Required fields per the schema (everything else is optional)
  if (!jobName || !qty || !uom || !customer || !date || !poNumber) {
    throw new Error(
      "Please fill in Job Name, Qty, UOM, Customer, Date, and PO Number.",
    );
  }

  await prisma.job.create({
    data: {
      jobName,
      qty: Number(qty),
      uom,
      customer,
      date: new Date(date),
      poNumber,
      leadTime: leadTime ? Number(leadTime) : null,
      materialStatus: materialStatus || null,
      status: status || "Pending",
      remark: remark || null,
    },
  });

  revalidatePath("/dashboard/jobtracker");
  redirect("/dashboard/jobtracker");
}

export async function updateJobDoNumber(jobId: string, doNumber: string) {
  const trimmed = doNumber.trim();

  await prisma.job.update({
    where: { id: jobId },
    data: { doNumber: trimmed === "" ? null : trimmed },
  });

  revalidatePath("/dashboard/jobtracker");
}

export async function updateJobStatus(jobId: string, status: string) {
  const trimmed = status.trim();

  await prisma.job.update({
    where: { id: jobId },
    data: { status: trimmed === "" ? "Pending" : trimmed },
  });

  revalidatePath("/dashboard/jobtracker");
}

export async function deleteJob(jobId: string) {
  await prisma.job.delete({ where: { id: jobId } });
  revalidatePath("/dashboard/jobtracker");
}
