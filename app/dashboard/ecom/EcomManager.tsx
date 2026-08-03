"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ECOM_CATEGORIES,
  getCategoryLabel,
  getSubOptions,
} from "@/lib/ecomCategories";
import {
  IoChevronForward,
  IoFolderOutline,
  IoSearchOutline,
  IoCloseCircle,
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

const emptyForm = {
  name: "",
  price: "",
  size: "",
  diameter: "",
  quantity: "1",
  category: "",
  subCategory: "",
};

const UNCATEGORIZED_KEY = "__uncategorized__";

export function EcomManager() {
  const [items, setItems] = useState<EcomItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // Filter by search first
  const filteredItems = useMemo(() => {
    if (!items) return items;
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const categoryLabel = item.category
        ? getCategoryLabel(item.category).toLowerCase()
        : "";
      return (
        item.name.toLowerCase().includes(q) ||
        categoryLabel.includes(q) ||
        (item.subCategory ?? "").toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  // Group filtered items by category — just for folder counts/labels now
  const groupedItems = useMemo(() => {
    if (!filteredItems) return null;
    const map = new Map<string, EcomItem[]>();
    for (const item of filteredItems) {
      const key = item.category ?? UNCATEGORIZED_KEY;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === UNCATEGORIZED_KEY) return 1;
      if (b[0] === UNCATEGORIZED_KEY) return -1;
      return getCategoryLabel(a[0]).localeCompare(getCategoryLabel(b[0]));
    });
  }, [filteredItems]);

  const handleFieldChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setForm((prev) => ({ ...prev, category: value, subCategory: "" }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const price = parseFloat(form.price);
    const quantity = parseInt(form.quantity, 10);

    if (!form.name.trim() || !form.size.trim()) {
      setSubmitError("Item dan Size wajib diisi.");
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setSubmitError("Price harus berupa angka yang valid.");
      return;
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      setSubmitError("Quantity harus berupa angka yang valid (minimal 1).");
      return;
    }

    const body = new FormData();
    body.append("name", form.name.trim());
    body.append("price", String(price));
    body.append("size", form.size.trim());
    body.append("quantity", String(quantity));
    if (form.diameter.trim() !== "")
      body.append("diameter", form.diameter.trim());
    if (form.category) body.append("category", form.category);
    if (form.category && form.subCategory)
      body.append("subCategory", form.subCategory);
    if (imageFile) body.append("image", imageFile);

    setSubmitting(true);
    try {
      const res = await fetch("/api/ecom", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`);

      setItems((prev) => (prev ? [data, ...prev] : [data]));
      resetForm();
    } catch (err: any) {
      setSubmitError(err.message ?? "Gagal menambahkan item.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalResults = filteredItems?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-macos-primary">
          Ecom Items
        </h1>
        <p className="text-sm text-macos-secondary mt-0.5">
          Kelola katalog item: harga, ukuran, diameter, quantity, dan foto.
        </p>
      </div>

      {/* ADD ITEM FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4"
      >
        <h3 className="text-lg font-semibold text-macos-primary border-b border-macos-separator pb-2 mb-2">
          Add Item
        </h3>

        {submitError && (
          <div className="p-3 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-sm font-medium">
            ✕ {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Item *
            </label>
            <input
              type="text"
              required
              disabled={submitting}
              value={form.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="e.g. Hex Bolt M12"
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Price (IDR) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              disabled={submitting}
              value={form.price}
              onChange={(e) => handleFieldChange("price", e.target.value)}
              placeholder="150000"
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Size *
            </label>
            <input
              type="text"
              required
              disabled={submitting}
              value={form.size}
              onChange={(e) => handleFieldChange("size", e.target.value)}
              placeholder="e.g. M12 x 50mm"
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Diameter (mm)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              disabled={submitting}
              value={form.diameter}
              onChange={(e) => handleFieldChange("diameter", e.target.value)}
              placeholder="12"
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              required
              disabled={submitting}
              value={form.quantity}
              onChange={(e) => handleFieldChange("quantity", e.target.value)}
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition text-center font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Category
            </label>
            <select
              disabled={submitting}
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
            >
              <option value="">— Pilih Category —</option>
              {ECOM_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Sub-Category
            </label>
            <select
              disabled={submitting || !form.category}
              value={form.subCategory}
              onChange={(e) => handleFieldChange("subCategory", e.target.value)}
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition disabled:opacity-50"
            >
              <option value="">
                {form.category
                  ? "— Pilih Sub-Category —"
                  : "Pilih Category dulu"}
              </option>
              {getSubOptions(form.category).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={submitting}
              onChange={handleImageChange}
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-1.5 text-sm file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-macos-blue/10 file:text-macos-blue file:text-xs file:font-semibold file:cursor-pointer cursor-pointer"
            />
          </div>
        </div>

        {imagePreview && (
          <div className="flex items-center gap-3">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-12 w-12 object-cover rounded-md border border-macos-separator"
            />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-xs text-macos-red hover:underline cursor-pointer"
            >
              Hapus foto
            </button>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-macos-blue text-white rounded-md font-semibold text-sm hover:bg-opacity-90 active:scale-[0.99] transition cursor-pointer shadow-lg disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "＋ Add Item"}
          </button>
        </div>
      </form>

      {/* CATEGORY FOLDERS — click to open category page */}
      <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-macos-separator pb-2 mb-4 gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-macos-primary">
            Item Catalog
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
            placeholder="Cari nama, kategori, ukuran..."
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

        {items && items.length === 0 && (
          <p className="text-sm text-macos-secondary">
            Belum ada item. Tambahkan item pertama lewat form di atas.
          </p>
        )}

        {items &&
          items.length > 0 &&
          groupedItems &&
          groupedItems.length === 0 && (
            <p className="text-sm text-macos-secondary">
              Tidak ada item yang cocok dengan pencarian "{search}".
            </p>
          )}

        {groupedItems && groupedItems.length > 0 && (
          <div className="space-y-2">
            {groupedItems.map(([categoryKey, categoryItems]) => {
              const label =
                categoryKey === UNCATEGORIZED_KEY
                  ? "Uncategorized"
                  : getCategoryLabel(categoryKey);

              return (
                <Link
                  key={categoryKey}
                  href={`/dashboard/ecom/${encodeURIComponent(categoryKey)}`}
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-macos-separator/50 rounded-lg bg-macos-tertiary/60 hover:bg-macos-tertiary transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <IoFolderOutline size={16} className="text-macos-blue" />
                    <span className="font-semibold text-[13px] text-macos-primary">
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-macos-secondary font-mono px-1.5 py-0.5 bg-macos-separator/30 rounded-full">
                      {categoryItems.length}
                    </span>
                    <IoChevronForward
                      size={14}
                      className="text-macos-secondary"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
