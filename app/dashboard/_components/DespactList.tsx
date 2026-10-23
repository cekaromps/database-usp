"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import {
  STATUS_LABELS,
  STATUS_VALUES,
  PRODUCTION_NEXT,
  FINANCE_NEXT,
  type DespactStatus,
} from "@/lib/despact-status";
import Link from "next/link"
import {
  productionUpdateStatusAction,
  financeCloseItemAction,
} from "@/app/actions/despact-status";
import { addDespactItemCommentAction } from "@/app/actions/despact-comment";
import type { DespactRow } from "@/lib/despact-queries";

const BADGE: Record<DespactStatus, string> = {
  ON_PROCESS: "bg-macos-blue/10 text-macos-blue border-macos-blue/30",
  READY_DELIVERY: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  DELIVERY: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  CLOSE: "bg-green-500/10 text-green-600 border-green-500/30",
};

const DOT: Record<DespactStatus, string> = {
  ON_PROCESS: "bg-macos-blue",
  READY_DELIVERY: "bg-yellow-400",
  DELIVERY: "bg-purple-400",
  CLOSE: "bg-green-500",
};

const ADD_DESPACT_HREF = "/dashboard/finance/job-despact";
const FINANCE_HOME_HREF = "/dashboard/finance";
const PRODUCTION_HOME_HREF = "/dashboard/production";

const fmtIDR = (v: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type Filter = "ALL" | DespactStatus;

function CommentSection({
  itemId,
  comments,
  canWrite,
}: {
  itemId: number;
  comments: DespactRow["items"][number]["comments"];
  canWrite: boolean;
}) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!text.trim()) return;
    setErr(null);
    startTransition(async () => {
      const msg = await addDespactItemCommentAction(itemId, text);
      if (msg) setErr(msg);
      else setText("");
    });
  };

  return (
    <div className="space-y-3">
      {comments.length === 0 && (
        <p className="text-xs text-macos-secondary">No comments yet.</p>
      )}

      {comments.length > 0 && (
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <li
              key={c.id}
              className="bg-macos-popover border border-macos-separator rounded-lg px-3 py-2"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold text-macos-primary">
                  {c.authorName}
                </span>
                <span className="text-[11px] text-macos-secondary whitespace-nowrap">
                  {fmtDateTime(c.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm text-macos-primary whitespace-pre-wrap break-words">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
            maxLength={1000}
            rows={2}
            placeholder="Write a comment for finance..."
            className="w-full bg-macos-popover border border-macos-separator text-macos-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-macos-blue transition resize-y"
          />
          {err && <p className="text-xs text-macos-red">✕ {err}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={pending || !text.trim()}
              className="px-3 py-1.5 bg-macos-blue text-white rounded-md text-xs font-semibold hover:bg-opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Sending..." : "Add Comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default function DespactList({
  despacts,
  mode,
}: {
  despacts: DespactRow[];
  mode: "production" | "finance";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
    const [openComments, setOpenComments] = useState<Set<number>>(new Set());

  const toggleComments = (itemId: number) =>
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

  const showPrice = mode === "finance";

  const run = (fn: () => Promise<string | void>) => {
    setError(null);
    startTransition(async () => {
      const msg = await fn();
      if (msg) setError(msg);
    });
  };

  const counts = useMemo(() => {
    const c: Record<DespactStatus, number> = {
      ON_PROCESS: 0,
      READY_DELIVERY: 0,
      DELIVERY: 0,
      CLOSE: 0,
    };
    despacts.forEach((d) => d.items.forEach((i) => c[i.status]++));
    return c;
  }, [despacts]);
  const totalItems = STATUS_VALUES.reduce((s, k) => s + counts[k], 0);

  const q = search.trim().toLowerCase();
  const visible = despacts
    .map((d) => ({
      ...d,
      shownItems:
        filter === "ALL" ? d.items : d.items.filter((i) => i.status === filter).
        slice()
        .sort(
          (a, b) => Number(a.status === "CLOSE") - Number(b.status === "CLOSE")
        ),
    }))
    .filter((d) => {
      if (d.shownItems.length === 0) return false;
      if (!q) return true;
      return (
        d.registrationNumber.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.items.some((i) => i.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const aClosed = a.items.length > 0 && a.items.every((i) => i.status === "CLOSE");
      const bClosed = b.items.length > 0 && b.items.every((i) => i.status === "CLOSE");
      return Number(aClosed) - Number(bClosed);
    });

  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
      active
        ? "bg-macos-blue text-white border-macos-blue"
        : "bg-macos-popover text-macos-secondary border-macos-separator hover:text-macos-primary"
    }`;

  return (
    <div className="space-y-5">
        {mode === "finance" && (
      <div>
        <Link
          href={FINANCE_HOME_HREF}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-macos-separator bg-macos-popover text-macos-secondary rounded-md text-xs font-semibold hover:text-macos-primary hover:border-macos-blue transition"
        >
          ← Back to Finance
        </Link>
      </div>
    )}

        {mode === "production" && (
      <div>
        <Link
          href={PRODUCTION_HOME_HREF}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-macos-separator bg-macos-popover text-macos-secondary rounded-md text-xs font-semibold hover:text-macos-primary hover:border-macos-blue transition"
        >
          ← Back to production
        </Link>
      </div>
    )}
      {/* Toolbar */}
      <div className="space-y-3">
  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search registration no, customer, or item..."
      className="w-full bg-macos-popover border border-macos-separator text-macos-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-macos-blue transition"
    />

    <a
      href="/api/despact/report"
      download
      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-macos-separator bg-macos-popover text-macos-primary rounded-lg text-sm font-semibold hover:border-macos-blue hover:text-macos-blue transition whitespace-nowrap shadow-sm"
    >
      ⬇ Excel Report
    </a>

    {mode === "finance" && (
      <Link
        href={ADD_DESPACT_HREF}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-macos-blue text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 active:scale-[0.99] transition whitespace-nowrap shadow-sm"
      >
        ＋ Add Despact
      </Link>
    )}
  </div>


        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={chip(filter === "ALL")}
          >
            All
            <span className="opacity-70">{totalItems}</span>
          </button>
          {STATUS_VALUES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(filter === s ? "ALL" : s)}
              className={chip(filter === s)}
            >
              <span className={`h-2 w-2 rounded-full ${DOT[s]}`} />
              {STATUS_LABELS[s]}
              <span className="opacity-70">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-sm font-medium">
          ✕ {error}
        </div>
      )}

      {visible.length === 0 && (
        <div className="py-16 text-center text-sm text-macos-secondary bg-macos-popover border border-macos-separator rounded-xl">
          No despact records found.
        </div>
      )}

      {/* Despact cards */}
      {visible.map((d) => {
        const closed = d.items.filter((i) => i.status === "CLOSE").length;
        const total = d.items.length;
        const allClosed = closed === total;
        const overdue = !allClosed && new Date(d.dueDate) < new Date();
        const pct = total ? Math.round((closed / total) * 100) : 0;

        return (
          <section
            key={d.id}
            className="bg-macos-popover border border-macos-separator rounded-xl shadow-sm overflow-hidden"
          >
            {/* Header */}
            <header className="px-5 py-4 border-b border-macos-separator flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-mono text-base font-semibold text-macos-primary">
                    {d.registrationNumber}
                  </h2>
                  {allClosed && (
                    <span className="px-2 py-0.5 rounded-full border text-[11px] font-semibold bg-green-500/10 text-green-600 border-green-500/30">
                      Completed
                    </span>
                  )}
                  {overdue && (
                    <span className="px-2 py-0.5 rounded-full border text-[11px] font-semibold bg-macos-red/10 text-macos-red border-macos-red/30">
                      Overdue
                    </span>
                  )}
                </div>
                <p className="text-sm text-macos-primary font-medium truncate">
                  {d.customerName}
                </p>
                <p className="text-xs text-macos-secondary">
                  Attn: {d.attn}
                  {d.shortDescription && d.shortDescription !== "-" && (
                    <> · {d.shortDescription}</>
                  )}
                </p>
              </div>

              <dl
                className={`grid gap-x-6 gap-y-1 text-xs md:text-right shrink-0 ${
                  showPrice ? "grid-cols-3" : "grid-cols-2"
                }`}
              >
                <div>
                  <dt className="text-macos-secondary">PO Date</dt>
                  <dd className="mt-0.5 text-macos-primary font-medium">
                    {fmtDate(d.poDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-macos-secondary">Due Date</dt>
                  <dd
                    className={`mt-0.5 font-medium ${
                      overdue ? "text-macos-red" : "text-macos-primary"
                    }`}
                  >
                    {fmtDate(d.dueDate)}
                  </dd>
                </div>
                {showPrice && d.totalIdr !== null && (
                  <div>
                    <dt className="text-macos-secondary">Total</dt>
                    <dd className="mt-0.5 font-mono font-semibold text-macos-primary">
                      {fmtIDR(d.totalIdr)}
                    </dd>
                  </div>
                )}
              </dl>
            </header>

            {/* Progress */}
            <div className="px-5 py-2.5 border-b border-macos-separator flex items-center gap-3 bg-macos-base">
              <div className="h-1.5 flex-1 rounded-full bg-macos-separator overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] text-macos-secondary whitespace-nowrap">
                {closed}/{total} closed
              </span>
            </div>

            {/* Items */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-24" />
                  {showPrice && <col className="w-36" />}
                  <col className="w-40" />
                  <col className="w-44" />
                </colgroup>
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-macos-secondary">
                    <th className="px-5 py-2.5 font-semibold">Item</th>
                    <th className="px-3 py-2.5 font-semibold text-center">
                      Qty
                    </th>
                    {showPrice && (
                      <th className="px-3 py-2.5 font-semibold text-right">
                        Amount IDR
                      </th>
                    )}
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-macos-separator">
                  {d.shownItems.map((item) => {
                    const nextProd = PRODUCTION_NEXT[item.status];
                    const canClose =
                      FINANCE_NEXT[item.status].includes("CLOSE");

                    return (
                      <Fragment key={item.id}>
                      <tr
                        className="text-macos-primary hover:bg-macos-base transition-colors"
                      >
                        <td className="px-5 py-3 align-middle break-words">
                          {item.description}
                          <button
                            type="button"
                            onClick={() => toggleComments(item.id)}
                            className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-macos-secondary hover:text-macos-blue transition cursor-pointer"
                          >
                            💬 Comments ({item.comments.length}){" "}
                            {openComments.has(item.id) ? "▲" : "▼"}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.qty}{" "}
                          <span className="text-macos-secondary text-xs">
                            {item.unit}
                          </span>
                        </td>
                        {showPrice && (
                          <td className="px-3 py-3 text-right font-mono whitespace-nowrap">
                            {item.amountIdr !== null
                              ? fmtIDR(item.amountIdr)
                              : "-"}
                          </td>
                        )}
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${BADGE[item.status]}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${DOT[item.status]}`}
                            />
                            {STATUS_LABELS[item.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {mode === "production" &&
                            nextProd.map((to) => (
                              <button
                                key={to}
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  run(() =>
                                    productionUpdateStatusAction(item.id, to),
                                  )
                                }
                                className="px-3 py-1.5 bg-macos-blue/10 border border-macos-blue/30 text-macos-blue rounded-md text-xs font-semibold hover:bg-macos-blue hover:text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                → {STATUS_LABELS[to]}
                              </button>
                            ))}

                          {mode === "finance" && canClose && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                run(() => financeCloseItemAction(item.id))
                              }
                              className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-600 rounded-md text-xs font-semibold hover:bg-green-500 hover:text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✓ Close
                            </button>
                          )}

                          {((mode === "production" && nextProd.length === 0) ||
                            (mode === "finance" && !canClose)) && (
                            <span className="text-macos-secondary text-xs">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                      {openComments.has(item.id) && (
                        <tr>
                          <td
                            colSpan={showPrice ? 5 : 4}
                            className="px-5 py-3 bg-macos-base"
                          >
                            <CommentSection
                              itemId={item.id}
                              comments={item.comments}
                              canWrite={mode === "production"}
                            />
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}