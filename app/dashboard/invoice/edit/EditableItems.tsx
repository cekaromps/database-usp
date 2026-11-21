"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export interface EditableItem {
  id: string;
  description: string;
  qty: number;
  amountIdr: number;
}

export default function EditableItems({
  initialItems,
}: {
  initialItems: EditableItem[];
}) {
  const [items, setItems] = useState<EditableItem[]>(initialItems);

  const removeItem = (id: string, label: number) => {
    if (items.length <= 1) return;
    if (!confirm(`Remove ITEM #${label} from this invoice?`)) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="border border-macos-separator rounded-xl p-4 bg-macos-tertiary/20"
        >
          {/* hidden id item */}
          <input type="hidden" name={`items[${index}].id`} value={item.id} />

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-macos-blue">
              ITEM #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeItem(item.id, index + 1)}
              disabled={items.length <= 1}
              title={
                items.length <= 1
                  ? "An invoice needs at least one item"
                  : "Remove this item"
              }
              className="flex items-center gap-1 text-xs font-medium text-macos-red hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1.5 text-macos-secondary">
                Description
              </label>
              <textarea
                name={`items[${index}].description`}
                defaultValue={item.description}
                rows={4}
                suppressHydrationWarning
                className="w-full bg-macos-tertiary border border-macos-separator rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5 text-macos-secondary">
                Qty
              </label>
              <input
                type="number"
                name={`items[${index}].qty`}
                defaultValue={item.qty}
                className="w-full bg-macos-tertiary border border-macos-separator rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5 text-macos-secondary">
                Amount IDR
              </label>
              <input
                type="number"
                step="any"
                name={`items[${index}].amountIdr`}
                defaultValue={item.amountIdr}
                className="w-full bg-macos-tertiary border border-macos-separator rounded-md p-2"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}