import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { createJob } from "../action";

export const metadata: Metadata = {
  title: "New Job",
};

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Add New Job</h1>
        <Link
          href="/dashboard/jobtracker"
          className="text-sm text-macos-blue hover:underline"
        >
          ← Back to Tracker
        </Link>
      </div>

      <form
        action={createJob}
        className="max-w-2xl bg-macos-popover border border-macos-separator rounded-2xl p-6 shadow-xl space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Job Name" name="jobName" required />
          <Field label="Customer" name="customer" required />

          <Field label="Qty" name="qty" type="number" step="0.01" required />
          <Field
            label="UOM"
            name="uom"
            placeholder="e.g. pcs, kg, m"
            required
          />

          <Field label="Date" name="date" type="date" required />
          <Field label="PO Number" name="poNumber" required />

          <Field label="Lead Time (days)" name="leadTime" type="number" />
          <Field
            label="Material Status"
            name="materialStatus"
            placeholder="e.g. Ready, On Order"
          />

          <Field label="Status" name="status" placeholder="Pending" />
        </div>

        <div>
          <label className="block text-sm font-medium text-macos-secondary mb-1">
            Remark
          </label>
          <textarea
            name="remark"
            rows={3}
            className="w-full px-3 py-2 text-sm bg-macos-base border border-macos-separator rounded-md focus:outline-none focus:border-macos-blue"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-macos-blue text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer shadow-md"
        >
          Save Job
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-macos-secondary mb-1">
        {label}
        {required && <span className="text-macos-red"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full px-3 py-2 text-sm bg-macos-base border border-macos-separator rounded-md focus:outline-none focus:border-macos-blue"
      />
    </div>
  );
}
