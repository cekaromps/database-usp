"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getCategoryLabel } from "@/lib/ecomCategories";
import { IoCartOutline, IoSearchOutline, IoCloseCircle } from "react-icons/io5";

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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  const categories = useMemo(() => {
    if (!items) return [];
    const map = new Map<string, number>();
    items.forEach((item) => {
      if (!item.category) return;
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return items;
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const categoryLabel = item.category
        ? getCategoryLabel(item.category).toLowerCase()
        : "";
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        categoryLabel.includes(q) ||
        (item.subCategory ?? "").toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q);
      const matchesCategory =
        !activeCategory || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, activeCategory]);

  return (
    <div className="w-full bg-white text-[#1a1a1a] font-sans">
      <div className="w-full border-b border-[#c9ccd0] bg-[#f4f5f6] px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <IoSearchOutline
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, size..."
            className="w-full pl-9 pr-8 py-1.5 rounded-[3px] border border-[#a8adb4] text-[13px] text-[#1a1a1a] placeholder:text-[#8b8f96] focus:outline-none focus:border-[#005f9e] focus:ring-1 focus:ring-[#005f9e]/40 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b8f96] hover:text-[#1a1a1a]"
              aria-label="Clear search"
            >
              <IoCloseCircle size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[#005f9e] text-sm font-medium ml-auto cursor-pointer hover:underline">
          <IoCartOutline size={20} />
          <span>Cart</span>
        </div>
      </div>

      {loadError && (
        <p className="text-sm text-red-600 px-4 py-3">Error: {loadError}</p>
      )}
      {!items && !loadError && (
        <p className="text-sm text-[#6b7280] px-4 py-3">Loading items...</p>
      )}

      {items && items.length > 0 && (
        <div className="flex flex-col md:flex-row">
          {/* Sidebar filters */}
          <aside className="w-full md:w-56 md:border-r border-[#dfe1e4] bg-[#fafbfc] px-4 py-4 md:min-h-[400px]">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280] mb-2">
              Category
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full text-left text-[13px] px-2 py-1 rounded-[3px] ${
                    !activeCategory
                      ? "bg-[#005f9e]/10 text-[#005f9e] font-semibold"
                      : "text-[#374151] hover:bg-[#eef0f2]"
                  }`}
                >
                  All ({items.length})
                </button>
              </li>
              {categories.map(([cat, count]) => (
                <li key={cat}>
                  <button
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left text-[13px] px-2 py-1 rounded-[3px] flex justify-between ${
                      activeCategory === cat
                        ? "bg-[#005f9e]/10 text-[#005f9e] font-semibold"
                        : "text-[#374151] hover:bg-[#eef0f2]"
                    }`}
                  >
                    <span className="truncate">{getCategoryLabel(cat)}</span>
                    <span className="text-[#9ca3af]">{count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Results */}
          <div className="flex-1 px-4 py-4">
            <p className="text-[12px] text-[#6b7280] mb-3">
              {filteredItems?.length ?? 0} result
              {filteredItems?.length === 1 ? "" : "s"}
              {search ? ` for "${search}"` : ""}
            </p>

            {filteredItems && filteredItems.length === 0 && (
              <p className="text-sm text-[#6b7280]">No matching items.</p>
            )}

            {filteredItems && filteredItems.length > 0 && (
              <div className="border border-[#dfe1e4] rounded-[3px] overflow-hidden">
                <table className="w-full text-[13px] border-collapse table-fixed">
                  <colgroup>
                    <col className="w-16" />
                    <col className="w-[26%]" />
                    <col className="w-[22%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#f4f5f6] border-b border-[#dfe1e4] text-[11px] uppercase tracking-wide text-[#6b7280]">
                      <th className="px-3 py-2 text-left"></th>
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Size</th>
                      <th className="px-3 py-2 text-left">Diameter</th>
                      <th className="px-3 py-2 text-left">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-b border-[#eceef0] last:border-b-0 hover:bg-[#eef6fc] transition-colors ${
                          idx % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"
                        }`}
                      >
                        <td className="px-3 py-2">
                          <div className="w-10 h-10 bg-[#f4f5f6] border border-[#e5e7eb] rounded-[2px] overflow-hidden flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[8px] text-[#9ca3af]">
                                N/A
                              </span>
                            )}
                          </div>
                        </td>
                        <td className=" py-2 font-medium text-left text-[#005f9e] hover:underline cursor-pointer truncate">
                          {item.name}
                        </td>
                        <td className="text-left py-2 text-[#374151] truncate">
                          {item.category
                            ? getCategoryLabel(item.category)
                            : "—"}
                          {item.subCategory ? ` · ${item.subCategory}` : ""}
                        </td>
                        <td className="text-left px-2 py-2 text-[#374151] font-mono">
                          {item.size}
                        </td>
                        <td className="text-left py-2 px-6 text-[#374151] font-mono">
                          {item.diameter != null ? `${item.diameter}mm` : "—"}
                        </td>
                        <td className="text-left py-2 px-6 text-[#374151] font-mono">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {items && items.length === 0 && (
        <p className="text-sm text-[#6b7280] px-4 py-4">
          Belum ada item. Tambahkan item pertama lewat form di atas.
        </p>
      )}
    </div>
  );
}
