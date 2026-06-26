"use client";

import { useState, useEffect, useCallback } from "react";

interface PoTaskItem {
  id: string;
  poTaskId: string;
  stage: string;
  name: string;
  quantity: number;
  unit: string;
  isCompleted: boolean;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PoTask {
  id: string;
  poNumber: string;
  description: string;
  currentStage: string;
  isCompleted: boolean;
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export function PoTaskTrackerTable() {
  const [tasks, setTasks] = useState<PoTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [itemsByTask, setItemsByTask] = useState<Record<string, PoTaskItem[]>>(
    {},
  );
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({});
  const [itemsError, setItemsError] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/poTask");
        if (!res.ok) throw new Error(`Failed to load PO tasks (${res.status})`);
        const data: PoTask[] = await res.json();
        if (!cancelled) setTasks(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Failed to load PO tasks");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExpand = useCallback(
    (taskId: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.has(taskId) ? next.delete(taskId) : next.add(taskId);
        return next;
      });

      if (!itemsByTask[taskId] && !itemsLoading[taskId]) {
        setItemsLoading((prev) => ({ ...prev, [taskId]: true }));
        fetch(`/api/poTask/${taskId}/items`)
          .then((res) => {
            if (!res.ok)
              throw new Error(`Failed to load items (${res.status})`);
            return res.json();
          })
          .then((data: PoTaskItem[]) => {
            setItemsByTask((prev) => ({ ...prev, [taskId]: data }));
          })
          .catch((err: any) => {
            setItemsError((prev) => ({
              ...prev,
              [taskId]: err.message ?? "Failed to load items",
            }));
          })
          .finally(() => {
            setItemsLoading((prev) => ({ ...prev, [taskId]: false }));
          });
      }
    },
    [itemsByTask, itemsLoading],
  );

  if (error) {
    return (
      <div className="p-4 text-sm text-macos-red">
        Error loading PO tasks: {error}
      </div>
    );
  }

  if (!tasks) {
    return (
      <div className="p-4 text-sm text-macos-secondary">
        Loading PO tasks...
      </div>
    );
  }

  const incompleteCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PO Task Tracker</h1>
          <p className="text-sm text-macos-secondary mt-0.5">
            {incompleteCount} task{incompleteCount !== 1 ? "s" : ""} in progress
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-macos-blue text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer shadow-md"
        >
          Print Incomplete Tasks
        </button>
      </div>

      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">Incomplete PO Tasks</h1>
        <p className="text-sm text-gray-600">
          Printed {new Date().toLocaleDateString()}
        </p>
      </div>

      <table className="w-full text-sm border-collapse print:text-xs">
        <thead>
          <tr className="border-b border-macos-separator print:border-black text-left">
            <th className="py-2 pr-3 print:hidden"></th>
            <th className="py-2 pr-3">PO Number</th>
            <th className="py-2 pr-3">Description</th>
            <th className="py-2 pr-3">Stage</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Est. Delivery</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <PoTaskRow
              key={task.id}
              task={task}
              expanded={expandedIds.has(task.id)}
              onToggle={() => toggleExpand(task.id)}
              items={itemsByTask[task.id]}
              itemsLoading={!!itemsLoading[task.id]}
              itemsError={itemsError[task.id]}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PoTaskRow({
  task,
  expanded,
  onToggle,
  items,
  itemsLoading,
  itemsError,
}: {
  task: PoTask;
  expanded: boolean;
  onToggle: () => void;
  items?: PoTaskItem[];
  itemsLoading: boolean;
  itemsError?: string;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-macos-separator/50 print:border-gray-300 cursor-pointer hover:bg-macos-popover/50 ${
          task.isCompleted ? "print:hidden" : ""
        }`}
      >
        <td className="py-2 pr-3 print:hidden text-macos-secondary">
          {expanded ? "▾" : "▸"}
        </td>
        <td className="py-2 pr-3 font-medium">{task.poNumber}</td>
        <td className="py-2 pr-3">{task.description}</td>
        <td className="py-2 pr-3">{task.currentStage}</td>
        <td className="py-2 pr-3">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium print:bg-transparent print:px-0 ${
              task.isCompleted
                ? "bg-green-100 text-green-700"
                : task.isOverdue
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            {task.isCompleted
              ? "Completed"
              : task.isOverdue
                ? "Overdue"
                : "In Progress"}
          </span>
        </td>
        <td className="py-2 pr-3">
          {new Date(task.estimatedDelivery).toLocaleDateString()}
        </td>
      </tr>
      {expanded && (
        <tr className="print:hidden">
          <td colSpan={6} className="bg-macos-popover/30 px-6 py-3">
            {itemsLoading && (
              <p className="text-xs text-macos-secondary">Loading items...</p>
            )}
            {itemsError && (
              <p className="text-xs text-macos-red">Error: {itemsError}</p>
            )}
            {items && items.length === 0 && (
              <p className="text-xs text-macos-secondary">
                No items for this task.
              </p>
            )}
            {items && items.length > 0 && (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left text-macos-secondary">
                    <th className="py-1 pr-3">Stage</th>
                    <th className="py-1 pr-3">Name</th>
                    <th className="py-1 pr-3">Qty</th>
                    <th className="py-1 pr-3">Unit</th>
                    <th className="py-1 pr-3">Status</th>
                    <th className="py-1 pr-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {items
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-macos-separator/30"
                      >
                        <td className="py-1 pr-3">{item.stage}</td>
                        <td className="py-1 pr-3">{item.name}</td>
                        <td className="py-1 pr-3">{item.quantity}</td>
                        <td className="py-1 pr-3">{item.unit}</td>
                        <td className="py-1 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.isCompleted
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.isCompleted ? "Done" : "Pending"}
                          </span>
                        </td>
                        <td className="py-1 pr-3">{item.notes ?? "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
