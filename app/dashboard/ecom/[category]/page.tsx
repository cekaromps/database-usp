"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCategoryLabel } from "@/lib/ecomCategories";
import {
  IoChevronDown,
  IoChevronForward,
  IoFolderOutline,
  IoFolderOpenOutline,
  IoSearchOutline,
  IoCloseCircle,
  IoArrowBack,
} from "react-icons/io5";

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

const UNSPECIFIED_KEY = "__unspecified__";

export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const router = useRouter();
  const categoryKey = decodeURIComponent(params.category);

  const [items, setItems] = useState<EcomItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

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

  // Only items in this category
  const categoryItems = useMemo(() => {
    if (!items) return null;
    return items.filter((item) =>
      categoryKey === "__uncategorized__"
        ? !item.category
        : item.category === categoryKey,
    );
  }, [items, categoryKey]);

  // Filter by search within this category
  const filteredItems = useMemo(() => {
    if (!categoryItems) return categoryItems;
    const q = search.trim().toLowerCase();
    if (!q) return categoryItems;
    return categoryItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        (item.subCategory ?? "").toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q)
      );
    });
  }, [categoryItems, search]);

  // Group by subCategory
  const groupedBySub = useMemo(() => {
    if (!filteredItems) return null;
    const map = new Map<string, EcomItem[]>();
    for (const item of filteredItems) {
      const key = item.subCategory ?? UNSPECIFIED_KEY;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === UNSPECIFIED_KEY) return 1;
      if (b[0] === UNSPECIFIED_KEY) return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [filteredItems]);

  // Open all folders by default
  useEffect(() => {
    if (categoryItems && openFolders.size === 0) {
      const keys = new Set(
        categoryItems.map((i) => i.subCategory ?? UNSPECIFIED_KEY),
      );
      setOpenFolders(keys);
    }
  }, [categoryItems, openFolders.size]);

  // Auto-expand matching folders during search
  useEffect(() => {
    if (search.trim() && groupedBySub) {
      setOpenFolders(new Set(groupedBySub.map(([key]) => key)));
    }
  }, [search, groupedBySub]);

  const toggleFolder = (key: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ecom/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed (${res.status})`);
      }
      setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    } catch (err: any) {
      setLoadError(err.message ?? "Gagal menghapus item.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);

  const categoryLabel =
    categoryKey === "__uncategorized__"
      ? "Uncategorized"
      : getCategoryLabel(categoryKey);

  const totalResults = filteredItems?.length ?? 0;

  return (
    <div className="min-h-screen bg-macos-base">
      <div className="flex items-center gap-3 px-6 py-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 rounded-md hover:bg-macos-tertiary transition cursor-pointer"
          aria-label="Back"
        >
          <IoArrowBack size={18} className="text-macos-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-macos-primary">
            {categoryLabel}
          </h1>
          <p className="text-sm text-macos-secondary mt-0.5">
            Sub-kategori dalam {categoryLabel}
          </p>
        </div>
      </div>

      <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-macos-separator pb-2 mb-4 gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-macos-primary">
            Sub-Categories
          </h3>
          <span className="text-xs text-macos-secondary font-mono">
            {totalResults} item{totalResults === 1 ? "" : "s"}
          </span>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-sm mb-4">
          <IoSearchOutline
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-macos-secondary"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, sub-kategori, ukuran..."
            className="w-full pl-8 pr-7 py-1.5 rounded-md bg-macos-tertiary border border-macos-separator text-xs text-macos-primary placeholder:text-macos-secondary/70 focus:outline-none focus:border-macos-blue transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-macos-secondary hover:text-macos-primary cursor-pointer"
              aria-label="Clear search"
            >
              <IoCloseCircle size={15} />
            </button>
          )}
        </div>

        {loadError && (
          <p className="text-sm text-macos-red mb-3">Error: {loadError}</p>
        )}

        {!items && !loadError && (
          <p className="text-sm text-macos-secondary">Loading items...</p>
        )}

        {categoryItems && categoryItems.length === 0 && (
          <p className="text-sm text-macos-secondary">
            Belum ada item di kategori ini.
          </p>
        )}

        {categoryItems &&
          categoryItems.length > 0 &&
          groupedBySub &&
          groupedBySub.length === 0 && (
            <p className="text-sm text-macos-secondary">
              Tidak ada item yang cocok dengan pencarian "{search}".
            </p>
          )}

        {groupedBySub && groupedBySub.length > 0 && (
          <div className="space-y-2">
            {groupedBySub.map(([subKey, subItems]) => {
              const isOpen = openFolders.has(subKey);
              const label = subKey === UNSPECIFIED_KEY ? "Unspecified" : subKey;

              return (
                <div
                  key={subKey}
                  className="border border-macos-separator/50 rounded-lg overflow-hidden"
                >
                  {/* Folder header */}
                  <button
                    type="button"
                    onClick={() => toggleFolder(subKey)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-macos-tertiary/60 hover:bg-macos-tertiary transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <IoChevronDown
                          size={12}
                          className="text-macos-secondary"
                        />
                      ) : (
                        <IoChevronForward
                          size={12}
                          className="text-macos-secondary"
                        />
                      )}
                      {isOpen ? (
                        <IoFolderOpenOutline
                          size={16}
                          className="text-macos-blue"
                        />
                      ) : (
                        <IoFolderOutline
                          size={16}
                          className="text-macos-blue"
                        />
                      )}
                      <span className="font-semibold text-[13px] text-macos-primary">
                        {label}
                      </span>
                    </div>
                    <span className="text-[11px] text-macos-secondary font-mono px-1.5 py-0.5 bg-macos-separator/30 rounded-full">
                      {subItems.length}
                    </span>
                  </button>

                  {/* Folder contents */}
                  {isOpen && (
                    <div className="p-3 border-t border-macos-separator/40">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                        {subItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-macos-base/30 border border-macos-separator/40 rounded-lg p-2 flex gap-2 animate-scale-up"
                          >
                            <div className="w-14 h-14 flex-shrink-0 bg-macos-tertiary rounded-md overflow-hidden flex items-center justify-center">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-macos-secondary text-[8px] text-center px-1">
                                  No image
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-semibold text-macos-primary text-[12px] truncate leading-tight">
                                {item.name}
                              </p>
                              <p className="text-macos-blue font-mono font-bold text-[11px]">
                                IDR {formatIDR(item.price)}
                              </p>

                              <div className="flex flex-wrap gap-1 text-[9px] text-macos-secondary font-mono">
                                <span className="px-1.5 py-0.5 bg-macos-separator/30 rounded-full">
                                  {item.size}
                                </span>
                                {item.diameter != null && (
                                  <span className="px-1.5 py-0.5 bg-macos-separator/30 rounded-full">
                                    ⌀{item.diameter}mm
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 bg-macos-separator/30 rounded-full">
                                  Qty {item.quantity}
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={deletingId === item.id}
                                onClick={() => handleDelete(item.id)}
                                className="w-full mt-0.5 py-1 border border-macos-red/20 text-macos-red bg-macos-red/5 rounded-md text-[10px] hover:bg-macos-red hover:text-white transition cursor-pointer font-semibold disabled:opacity-50"
                              >
                                {deletingId === item.id ? "..." : "✕ Delete"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
