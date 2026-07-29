"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getCategoryLabel } from "@/lib/ecomCategories";

interface EcomItem {
  id: string;
  name: string;
  price: number;
  size: string;
  diameter: number | null;
  quantity: number;
  imageUrl: string | null;
  category: string | null;
  subCategory: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ItemList() {
  const [items, setItems] = useState<EcomItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/ecom", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
      const data: EcomItem[] = await res.json();
      setItems(data);
    } catch (err: any) {
      setLoadError(err.message ?? "Failed to load items");
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <>
      <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl">
        <h3 className="text-lg font-semibold text-macos-primary border-b border-macos-separator pb-2 mb-4">
          Item Catalog
        </h3>

        {loadError && (
          <p className="text-sm text-macos-red mb-3">Error: {loadError}</p>
        )}

        {!items && !loadError && (
          <p className="text-sm text-macos-secondary">Loading items...</p>
        )}

        {items && items.length === 0 && (
          <p className="text-sm text-macos-secondary">
            Belum ada item. Tambahkan item pertama lewat form di atas.
          </p>
        )}

        {items && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-macos-base/30 border border-macos-separator/40 rounded-xl p-4 space-y-2 animate-scale-up"
              >
                <div className="w-full aspect-square bg-macos-tertiary rounded-lg overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-macos-secondary text-xs">
                      No image
                    </span>
                  )}
                </div>

                <p className="font-semibold text-macos-primary text-sm truncate">
                  {item.name}
                </p>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-macos-secondary font-mono">
                  {item.category && (
                    <span className="px-2 py-0.5 bg-macos-blue/10 text-macos-blue rounded-full">
                      {getCategoryLabel(item.category)}
                      {item.subCategory ? ` · ${item.subCategory}` : ""}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-macos-separator/30 rounded-full">
                    Size: {item.size}
                  </span>
                  {item.diameter != null && (
                    <span className="px-2 py-0.5 bg-macos-separator/30 rounded-full">
                      ⌀ {item.diameter}mm
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-macos-separator/30 rounded-full">
                    Qty: {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
