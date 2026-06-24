"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateJobDoNumber, updateJobStatus, deleteJob } from "./action";

// 👇 Replace these with your own status values, in whatever order you want them to appear
const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"];

export interface JobRowData {
  id: string;
  jobName: string;
  qty: number;
  uom: string;
  customer: string;
  date: string; // ISO string
  poNumber: string;
  leadTime: number | null;
  materialStatus: string | null;
  status: string;
  doNumber: string | null;
  remark: string | null;
}

export function JobTrackerTable({ jobs }: { jobs: JobRowData[] }) {
  const incompleteCount = jobs.filter((j) => !j.doNumber).length;

  return (
    <div>
      {/* Screen-only header + controls, hidden when printing */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Job Progress Tracker
          </h1>
          <p className="text-sm text-macos-secondary mt-0.5">
            {incompleteCount} job{incompleteCount !== 1 ? "s" : ""} waiting on
            DO number
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/jobtracker/new"
            className="px-4 py-2 bg-macos-popover border border-macos-separator text-macos-primary text-sm font-medium rounded-md hover:border-macos-blue/50 transition cursor-pointer"
          >
            + Add New Job
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-macos-blue text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer shadow-md"
          >
            Print Incomplete Tasks
          </button>
        </div>
      </div>

      {/* Print-only header, hidden on screen */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">Incomplete Jobs</h1>
        <p className="text-sm text-gray-600">
          Printed {new Date().toLocaleDateString()}
        </p>
      </div>

      <table className="w-full text-sm border-collapse print:text-xs">
        <thead>
          <tr className="border-b border-macos-separator print:border-black text-left">
            <th className="py-2 pr-3">Job Name</th>
            <th className="py-2 pr-3">Customer</th>
            <th className="py-2 pr-3">PO Number</th>
            <th className="py-2 pr-3">Qty</th>
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Lead Time</th>
            <th className="py-2 pr-3">Material Status</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">DO Number</th>
            <th className="py-2 pr-3 print:hidden">Remark</th>
            <th className="py-2 pr-3 print:hidden"></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobRow({ job }: { job: JobRowData }) {
  const [doNumber, setDoNumber] = useState(job.doNumber ?? "");
  const [isDoPending, startDoTransition] = useTransition();

  const [status, setStatus] = useState(job.status);
  const [isStatusPending, startStatusTransition] = useTransition();

  const [isDeletePending, startDeleteTransition] = useTransition();

  const isComplete = Boolean(job.doNumber);

  function handleDoBlur() {
    if (doNumber === (job.doNumber ?? "")) return;
    startDoTransition(() => {
      updateJobDoNumber(job.id, doNumber);
    });
  }

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    startStatusTransition(() => {
      updateJobStatus(job.id, newStatus);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${job.jobName}"? This can't be undone.`)) return;
    startDeleteTransition(() => {
      deleteJob(job.id);
    });
  }

  return (
    // print:hidden on the row itself -> completed jobs vanish entirely when printing
    <tr
      className={`border-b border-macos-separator/50 print:border-gray-300 ${
        isComplete ? "print:hidden" : ""
      }`}
    >
      <td className="py-2 pr-3">{job.jobName}</td>
      <td className="py-2 pr-3">{job.customer}</td>
      <td className="py-2 pr-3">{job.poNumber}</td>
      <td className="py-2 pr-3">
        {job.qty} {job.uom}
      </td>
      <td className="py-2 pr-3">{new Date(job.date).toLocaleDateString()}</td>
      <td className="py-2 pr-3">
        {job.leadTime ? `${job.leadTime} days` : "-"}
      </td>
      <td className="py-2 pr-3">{job.materialStatus ?? "-"}</td>
      <td className="py-2 pr-3">
        <span className="print:hidden">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isStatusPending}
            className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-macos-blue ${
              isComplete
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </span>
        <span
          className={`hidden print:inline px-2 py-0.5 rounded-full text-xs font-medium print:bg-transparent print:px-0 ${
            isComplete
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {job.status}
        </span>
      </td>
      <td className="py-2 pr-3">
        {/* Editable input on screen, plain text when printing */}
        <span className="print:hidden">
          <input
            value={doNumber}
            onChange={(e) => setDoNumber(e.target.value)}
            onBlur={handleDoBlur}
            placeholder="Input DO number..."
            disabled={isDoPending}
            className="w-32 px-2 py-1 text-sm bg-macos-popover border border-macos-separator rounded-md focus:outline-none focus:border-macos-blue"
          />
        </span>
        <span className="hidden print:inline">{job.doNumber ?? "-"}</span>
      </td>
      <td className="py-2 pr-3 print:hidden">{job.remark ?? "-"}</td>
      <td className="py-2 pr-3 print:hidden">
        <button
          onClick={handleDelete}
          disabled={isDeletePending}
          title="Delete job"
          className="text-macos-red hover:bg-macos-red/10 rounded-md px-2 py-1 text-xs font-medium transition cursor-pointer disabled:opacity-50"
        >
          {isDeletePending ? "..." : "Delete"}
        </button>
      </td>
    </tr>
  );
}
