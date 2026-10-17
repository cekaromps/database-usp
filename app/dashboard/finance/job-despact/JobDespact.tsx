"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { STATUS_LABELS, STATUS_VALUES, type DespactStatus } from "@/lib/despact-status";
import { createDespactAction } from "@/app/actions/record";

interface ItemRow {
  id: number;
  description: string;
  qty: number;
  amountIdr: number;
  unit: "pcs" | "unit" | "set";
  status: DespactStatus;
}

interface Customer {
  id: number;
  code: string;
  name: string;
  address: string;
}

export default function DespactForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerCode, setNewCustomerCode] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [poDate, setPoDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [customerFormError, setCustomerFormError] = useState<string | null>(
    null,
  );
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [items, setItems] = useState<ItemRow[]>([
    {
      id: Date.now(),
      description: "",
      qty: 1,
      amountIdr: 0,
      unit: "pcs",
      status: "ON_PROCESS",
    },
  ]);

  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers || []))
      .catch((err) => {
        console.error("Failed to load customers:", err);
        setCustomers([]);
      });
  }, []);

  const getDatePrefix = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${yy}${mm}`;
  };

  const applyCustomerSelection = (name: string, code: string) => {
    setCustomerName(name);
    setShowSuggestions(false);
  };

  const handleInputChange = (value: string) => {
    setCustomerName(value);
    setShowSuggestions(true);

    const cleanInput = value.toUpperCase().trim();

    if (cleanInput.length > 0) {
      const filtered = customers
        .filter((c) => c.name.toUpperCase().includes(cleanInput))
        .map((c) => c.name);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (name: string) => {
    const matched = customers.find(
      (c) => c.name.toUpperCase() === name.toUpperCase(),
    );
    applyCustomerSelection(name, matched?.code ?? "000");
  };

  const handleCreateCustomer = async () => {
    setCustomerFormError(null);

    const code = newCustomerCode.trim().toUpperCase();
    const name = newCustomerName.trim();
    const address = newCustomerAddress.trim();

    if (!code || !name || !address) {
      setCustomerFormError("Code, Name, dan Address wajib diisi semua.");
      return;
    }

    setIsSavingCustomer(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, address }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCustomerFormError(data.error || "Gagal menyimpan customer baru.");
        return;
      }

      const created: Customer = data.customer;
      setCustomers((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );

      applyCustomerSelection(created.name, created.code);

      setNewCustomerCode("");
      setNewCustomerName("");
      setNewCustomerAddress("");
      setShowCustomerModal(false);
    } catch (err) {
      console.error("Failed to create customer:", err);
      setCustomerFormError(
        "Terjadi kesalahan jaringan saat menyimpan customer.",
      );
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        description: "",
        qty: 1,
        amountIdr: 0,
        unit: "pcs",
        status: "ON_PROCESS",
      },
    ]);
  };

  const removeItemRow = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItemField = (
    id: number,
    field: keyof ItemRow,
    value: string | number | string[],
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const invalidAmount = items.some((item) => item.amountIdr <= 0);
    const invalidQty = items.some((item) => item.qty <= 0);

    if (invalidAmount || invalidQty) {
      setError("Semua nominal Qty dan Amount IDR harus diisi lebih dari 0!");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("itemsJson", JSON.stringify(items));

    startTransition(async () => {
      const errorMsg = await createDespactAction(formData);
      if (errorMsg) {
        setError(errorMsg);
      }
    });
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.amountIdr * item.qty,
    0,
  );
  const grandTotal = subtotal;

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          (e.target as HTMLElement).getAttribute("type") !== "submit" &&
          (e.target as HTMLElement).tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-6"
    >
      {error && (
        <div className="p-3 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-sm font-medium">
          ✕ {error}
        </div>
      )}

      <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4">
        <h3 className="text-lg font-semibold text-macos-primary border-b border-macos-separator pb-2 mb-2">
          General Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* INPUT CUSTOMER NAME DENGAN AUTOCOMPLETE */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-macos-secondary">
                To (Customer Name) *
              </label>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setCustomerFormError(null);
                  setShowCustomerModal(true);
                }}
                className="text-[11px] font-semibold text-macos-blue hover:underline cursor-pointer"
              >
                ＋ Customer Baru
              </button>
            </div>

            <div ref={autocompleteRef} className="relative">
              <input
                name="customer"
                type="text"
                required
                autoComplete="off"
                value={customerName}
                disabled={isPending}
                placeholder="Ketik nama perusahaan, cth: ALCO..."
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-macos-popover border border-macos-separator rounded-lg shadow-2xl z-50 py-1 divide-y divide-macos-separator/40 animate-scale-up">
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSelectSuggestion(name)}
                      className="w-full text-left px-3 py-2 text-xs text-macos-primary hover:bg-macos-blue hover:text-white transition cursor-pointer font-medium border-none bg-transparent"
                    >
                      🏢 {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Registration Number
            </label>
            <input
              name="registrationNumber"
              type="text"
              required
              className="w-full bg-macos-separator/30 border border-macos-separator text-macos-primary font-mono rounded-md p-2 text-sm select-none font-semibold opacity-70"
            />
          </div>

          {/* ATTN */}
          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Attn *
            </label>
            <input
              name="attn"
              type="text"
              required
              disabled={isPending}
              placeholder="Mr. Dollvy Suhendra"
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Short Description
            </label>
            <input
              name="shortDescription"
              type="text"
              disabled={isPending}
              placeholder="-"
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              PO Date *
            </label>
            <input
              name="poDate"
              type="date"
              required
              disabled={isPending}
              value={poDate}
              max={dueDate || undefined}
              onChange={(e)=> setPoDate(e.target.value)}
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">
              Due Date *
            </label>
            <input
              name="dueDate"
              type="date"
              required
              disabled={isPending}
              value={dueDate}
              min={poDate || undefined}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition scheme-dark"
            />
          </div>
        </div>
      </div>

      <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-macos-separator pb-2 mb-2">
          <h3 className="text-lg font-semibold text-macos-primary">
            Job Despact Items
          </h3>
          <button
            type="button"
            onClick={addItemRow}
            disabled={isPending}
            className="px-3 py-1.5 bg-macos-blue/10 border border-macos-blue/30 text-macos-blue rounded-md text-xs font-semibold hover:bg-macos-blue hover:text-white transition cursor-pointer"
          >
            ＋ Add Item Description
          </button>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => {
            return (
              <div
                key={item.id}
                className="bg-macos-base/30 p-5 border border-macos-separator/40 rounded-xl space-y-4 animate-scale-up"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  <div className="sm:col-span-6 w-full">
                    <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                      Item Description #{index + 1} *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      disabled={isPending}
                      suppressHydrationWarning
                      onChange={(e) =>
                        updateItemField(item.id, "description", e.target.value)
                      }
                      placeholder="e.g. EJECTOR FLANGE MATERIAL : MILD STEEL"
                      className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
                    />
                  </div>

                  {/* Kolom Jumlah Qty */}
                  <div className="sm:col-span-2 w-full">
                    <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                      Qty *
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.qty}
                        disabled={isPending}
                        onChange={(e) =>
                          updateItemField(
                            item.id,
                            "qty",
                            parseInt(e.target.value, 10) || 1,
                          )
                        }
                        className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition text-center font-semibold"
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          const cycle = {
                            pcs: "unit",
                            unit: "set",
                            set: "pcs",
                          };
                          updateItemField(
                            item.id,
                            "unit",
                            cycle[item.unit ?? "pcs"],
                          );
                        }}
                        className="px-2.5 py-1 border border-macos-separator rounded-md text-xs font-bold text-macos-blue bg-macos-blue/10 hover:bg-macos-blue hover:text-white transition whitespace-nowrap cursor-pointer"
                      >
                        {item.unit ?? "pcs"}
                      </button>
                    </div>

                  </div>
                  {/* Status per item */}
                  <div className="sm:col-span-3 w-full">
                    <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                      Status *
                    </label>
                    <div className="relative">
                      <select
                        required
                        disabled={isPending}
                        value={item.status}
                        onChange={(e) =>
                          updateItemField(item.id, "status", e.target.value as DespactStatus)
                        }
                        className="w-full appearance-none bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 pr-8 text-sm focus:outline-none focus:border-macos-blue transition cursor-pointer scheme-dark disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {STATUS_VALUES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-macos-secondary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Kolom Harga Nominal */}
                  <div className="sm:col-span-3 w-full">
                    <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                      Amount IDR *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={item.amountIdr || ""}
                      disabled={isPending}
                      onChange={(e) =>
                        updateItemField(
                          item.id,
                          "amountIdr",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="3963900"
                      className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition font-mono"
                    />
                  </div>

                  {/* Tombol Hapus Baris Item Tunggal */}
                  <div className="sm:col-span-1 w-full flex justify-end">
                    {items.length > 1 ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => removeItemRow(item.id)}
                        className="w-full py-2 border border-macos-red/20 text-macos-red bg-macos-red/5 rounded-md text-xs hover:bg-macos-red hover:text-white transition cursor-pointer flex items-center justify-center font-bold"
                        title="Hapus baris item ini"
                      >
                        ✕
                      </button>
                    ) : (
                      <div className="w-9 h-9" />
                    )}
                  </div>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItemRow(item.id)}
                    disabled={isPending}
                    className="w-full sm:w-auto p-2 mb-0.5 border border-macos-red/20 text-macos-red bg-macos-red/5 rounded-md text-xs hover:bg-macos-red hover:text-white transition cursor-pointer flex justify-center"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4">
        <div className="bg-macos-base/30 border border-macos-separator/40 rounded-xl p-4 space-y-2 text-sm font-mono">
          <div className="flex justify-between text-macos-secondary">
            <span>Subtotal</span>
            <span>IDR {formatIDR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-macos-primary font-bold border-t border-macos-separator pt-2">
            <span>Grand Total</span>
            <span>IDR {formatIDR(grandTotal)}</span>
          </div>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-macos-blue text-white rounded-md font-semibold text-sm hover:bg-opacity-90 active:scale-[0.99] transition cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isPending ? "Saving Records..." : "Save Quotation and All Items"}
          </button>
        </div>
      </div>

      {showCustomerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-macos-popover border border-macos-separator rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-macos-separator pb-2">
              <h3 className="text-base font-semibold text-macos-primary">
                Tambah Customer Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                disabled={isSavingCustomer}
                className="text-macos-secondary hover:text-macos-red transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {customerFormError && (
              <div className="p-2.5 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-xs font-medium">
                ✕ {customerFormError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                Code (maks. 3 karakter) *
              </label>
              <input
                type="text"
                maxLength={3}
                value={newCustomerCode}
                disabled={isSavingCustomer}
                onChange={(e) =>
                  setNewCustomerCode(e.target.value.toUpperCase())
                }
                placeholder="cth: 111"
                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                Nama Customer *
              </label>
              <input
                type="text"
                value={newCustomerName}
                disabled={isSavingCustomer}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="cth: PT CONTOH SUKSES"
                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                Address *
              </label>
              <textarea
                rows={3}
                value={newCustomerAddress}
                disabled={isSavingCustomer}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                placeholder="Alamat lengkap perusahaan"
                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                disabled={isSavingCustomer}
                className="flex-1 py-2 border border-macos-separator text-macos-secondary rounded-md text-sm font-semibold hover:bg-macos-tertiary transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                disabled={isSavingCustomer}
                className="flex-1 py-2 bg-macos-blue text-white rounded-md text-sm font-semibold hover:bg-opacity-90 transition cursor-pointer disabled:opacity-50"
              >
                {isSavingCustomer ? "Menyimpan..." : "Simpan Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
