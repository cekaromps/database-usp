"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface EcomItem {
  id: string;
  name: string;
  price: number;
  size: string;
  diameter: number | null;
  quantity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  name: "",
  price: "",
  size: "",
  diameter: "",
  quantity: "1",
};

export function EcomManager() {
  const [items, setItems] = useState<EcomItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleFieldChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
              className="h-16 w-16 object-cover rounded-md border border-macos-separator"
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

      {/* ITEMS LIST */}
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
                <p className="text-macos-blue font-mono font-bold text-sm">
                  IDR {formatIDR(item.price)}
                </p>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-macos-secondary font-mono">
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

                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item.id)}
                  className="w-full mt-1 py-1.5 border border-macos-red/20 text-macos-red bg-macos-red/5 rounded-md text-xs hover:bg-macos-red hover:text-white transition cursor-pointer font-semibold disabled:opacity-50"
                >
                  {deletingId === item.id ? "Menghapus..." : "✕ Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
