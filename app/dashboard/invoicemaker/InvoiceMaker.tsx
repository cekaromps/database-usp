"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createInvoiceWithItemsAction } from "@/app/actions/record";

interface ItemRow {
    id: number;
    description: string;
    qty: number;
    amountIdr: number;
    materials: string[]; // ← was: material: string
    processes: string[];
    unit: "pcs" | "unit" | "set";
}

const CUSTOMER_CODES: Record<string, string> = {
    "PT OSI": "01",
    "PT ALCOTRAINDO BATAM": "06",
    "PT NOK FREDEUNBERG BATAM": "024",
    "PT AMTEK RE-ENGINEERING": "029",
    "PT CLADTEK": "034",
    "PT RAAJRATNA": "036",
    "PT ALTECO CHEMICAL": "043",
    "PT DYNACAST INDONESIA": "078",
    "PT INDO KREASI GRAFIKA": "092",
    "CV. CILINTON BARAT": "093",
    "PT BROADFAR INDONESIA": "098",
    "PT PECM INDONESIA": "096",
    "PT LABROY": "103",
    "PT WAHANA TIRTA MILENIA": "106",
    "PT. BATAM NIAGA": "107",
    "PT TSI SMART PRODUCTS": "108",
    "PT. BLUE OCEAN LABS": "109",
    "PT. BEC": "110",
};

const AVAILABLE_PROCESSES = [
    "Machining",
    "Milling",
    "Turning",
    "Grinding",
    "CNC",
    "EDM",
    "Wire Cut",
    "Hardening",
    "Plating",
    "Polish",
    "Chrome",
    "Blackening",
    "Fabricate",
    "Re-wending",
    "Overhaul",
];

const AVAILABLE_MATERIAL = [
    "STD PART",
    "MILD STEEL",
    "SKD 11/XW 41",
    "SKD 11/XW 41 (JAPAN)",
    "SKD 61",
    "DF2",
    "SUJ 11",
    "STAVAX",
    "NAK 80",
    "440C",
    "Polyurethane (PU) ",
    "Steel Carbon",
    "AISI 4140",
    "S50C / S45C",
    "ALUMINIUM",
    "BRASS",
    "COPPER",
    "ORANGE BAKELITE",
    "BLACK BAKELITE",
    "WHITE DERLIN",
    "BLACK DERLIN",
    "STAINLESS STEEL",
    "GALVANIS",
    "TEFLON",
    "PVC",
];

export default function InvoiceForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // State Input Metadata Utama
    const [customerName, setCustomerName] = useState("");
    const [quotationNumber, setQuotationNumber] = useState("Q000-2605-001");
    const [discount, setDiscount] = useState(0);

    // State khusus Autocomplete Customer
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    // State khusus Autocomplete Material (per baris item) — now tag-based
    const [materialOpenId, setMaterialOpenId] = useState<number | null>(null);
    const [materialInputs, setMaterialInputs] = useState<
        Record<number, string>
    >({});

    // State khusus Autocomplete + Tag Input Proses Manufaktur (per baris item)
    const [processOpenId, setProcessOpenId] = useState<number | null>(null);
    const [processInputs, setProcessInputs] = useState<Record<number, string>>(
        {},
    );

    const [items, setItems] = useState<ItemRow[]>([
        {
            id: Date.now(),
            description: "",
            qty: 1,
            amountIdr: 0,
            processes: [],
            materials: [], // ← was: material: ""
            unit: "pcs",
        },
    ]);

    // ====== HELPER: AUTOCOMPLETE MATERIAL (tag-based, bebas ketik) ======
    const getMaterialSuggestions = (itemId: number, value: string) => {
        const item = items.find((i) => i.id === itemId);
        const already = item ? item.materials.map((m) => m.toLowerCase()) : [];
        const pool = AVAILABLE_MATERIAL.filter(
            (m) => !already.includes(m.toLowerCase()),
        );
        const clean = value.toUpperCase().trim();
        if (!clean) return pool;
        return pool.filter((m) => m.toUpperCase().includes(clean));
    };

    const handleMaterialInputChange = (itemId: number, value: string) => {
        setMaterialInputs((prev) => ({ ...prev, [itemId]: value }));
        setMaterialOpenId(itemId);
    };

    const addMaterialTag = (itemId: number, rawValue: string) => {
        const trimmed = rawValue.trim();
        if (!trimmed) {
            setMaterialOpenId(null);
            return;
        }
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== itemId) return item;
                const exists = item.materials.some(
                    (m) => m.toLowerCase() === trimmed.toLowerCase(),
                );
                if (exists) return item;
                return { ...item, materials: [...item.materials, trimmed] };
            }),
        );
        setMaterialInputs((prev) => ({ ...prev, [itemId]: "" }));
        setMaterialOpenId(null);
    };

    const removeMaterialTag = (itemId: number, material: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? {
                          ...item,
                          materials: item.materials.filter(
                              (m) => m !== material,
                          ),
                      }
                    : item,
            ),
        );
    };

    // ====== HELPER: AUTOCOMPLETE + TAG PROSES (bebas ketik, tidak wajib dari list) ======
    const getProcessSuggestions = (itemId: number, value: string) => {
        const item = items.find((i) => i.id === itemId);
        const already = item ? item.processes.map((p) => p.toLowerCase()) : [];
        const pool = AVAILABLE_PROCESSES.filter(
            (p) => !already.includes(p.toLowerCase()),
        );
        const clean = value.toUpperCase().trim();
        if (!clean) return pool;
        return pool.filter((p) => p.toUpperCase().includes(clean));
    };

    const handleProcessInputChange = (itemId: number, value: string) => {
        setProcessInputs((prev) => ({ ...prev, [itemId]: value }));
        setProcessOpenId(itemId);
    };

    const addProcessTag = (itemId: number, rawValue: string) => {
        const trimmed = rawValue.trim();
        if (!trimmed) {
            setProcessOpenId(null);
            return;
        }
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== itemId) return item;
                const exists = item.processes.some(
                    (p) => p.toLowerCase() === trimmed.toLowerCase(),
                );
                if (exists) return item;
                return { ...item, processes: [...item.processes, trimmed] };
            }),
        );
        setProcessInputs((prev) => ({ ...prev, [itemId]: "" }));
        setProcessOpenId(null);
    };

    const removeProcessTag = (itemId: number, process: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? {
                          ...item,
                          processes: item.processes.filter(
                              (p) => p !== process,
                          ),
                      }
                    : item,
            ),
        );
    };

    // Menutup list rekomendasi otomatis jika mengklik area luar form
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                autocompleteRef.current &&
                !autocompleteRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getDatePrefix = () => {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        return `${yy}${mm}`;
    };

    const handleInputChange = (value: string) => {
        setCustomerName(value);
        setShowSuggestions(true);

        const cleanInput = value.toUpperCase().trim();

        if (cleanInput.length > 0) {
            const filtered = Object.keys(CUSTOMER_CODES).filter((name) =>
                name.toUpperCase().includes(cleanInput),
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }

        let companyCode = "000";
        for (const [name, code] of Object.entries(CUSTOMER_CODES)) {
            if (cleanInput === name.toUpperCase()) {
                companyCode = code.padStart(3, "0");
                break;
            }
        }
        setQuotationNumber(`Q${companyCode}-${getDatePrefix()}-001`);
    };

    const handleSelectSuggestion = (name: string) => {
        setCustomerName(name);
        setShowSuggestions(false);

        const cleanInput = name.toUpperCase().trim();
        let companyCode = "000";
        for (const [cName, code] of Object.entries(CUSTOMER_CODES)) {
            if (cleanInput === cName.toUpperCase()) {
                companyCode = code.padStart(3, "0");
                break;
            }
        }

        fetch(
            `/api/next-subitem?customer=${encodeURIComponent(name)}&t=${Date.now()}`,
        )
            .then((res) => res.json())
            .then((data) => {
                const dynamicSubItem = data.sequence || "001";
                setQuotationNumber(
                    `Q${companyCode}-${getDatePrefix()}-${dynamicSubItem}`,
                );
            })
            .catch(() => {
                setQuotationNumber(`Q${companyCode}-${getDatePrefix()}-001`);
            });
    };

    const addItemRow = () => {
        setItems([
            ...items,
            {
                id: Date.now(),
                description: "",
                qty: 1,
                amountIdr: 0,
                processes: [],
                materials: [],
                unit: "pcs",
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
            setError(
                "Semua nominal Qty dan Amount IDR harus diisi lebih dari 0!",
            );
            return;
        }

        const formData = new FormData(e.currentTarget);
        formData.append("itemsJson", JSON.stringify(items));
        formData.append("discount", String(discount));

        startTransition(async () => {
            const errorMsg = await createInvoiceWithItemsAction(formData);
            if (errorMsg) {
                setError(errorMsg);
            }
        });
    };

    const subtotal = items.reduce(
        (sum, item) => sum + item.amountIdr * item.qty,
        0,
    );
    const discountAmount = subtotal * (discount / 100);
    const grandTotal = subtotal - discountAmount;

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
                    (e.target as HTMLElement).getAttribute("type") !==
                        "submit" &&
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

            {/* MONITORING SYNC BAR */}
            <div className="text-[11px] font-mono bg-macos-tertiary border border-macos-separator p-2 rounded-md text-macos-secondary flex items-center justify-between">
                <span>Database Sync Monitor :</span>
                <span className="text-macos-blue font-bold">
                    {customerName
                        ? `Membaca riwayat "${customerName}"...`
                        : "Menunggu pilihan Customer..."}
                </span>
            </div>

            {/* GENERAL DATA */}
            <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4">
                <h3 className="text-lg font-semibold text-macos-primary border-b border-macos-separator pb-2 mb-2">
                    General Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* INPUT CUSTOMER NAME DENGAN AUTOCOMPLETE */}
                    <div ref={autocompleteRef} className="relative">
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            To (Customer Name) *
                        </label>
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
                                        onClick={() =>
                                            handleSelectSuggestion(name)
                                        }
                                        className="w-full text-left px-3 py-2 text-xs text-macos-primary hover:bg-macos-blue hover:text-white transition cursor-pointer font-medium border-none bg-transparent"
                                    >
                                        🏢 {name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            Quotation Number (Auto-Generated) *
                        </label>
                        <input
                            name="quotationNumber"
                            type="text"
                            required
                            readOnly
                            value={quotationNumber}
                            className="w-full bg-macos-separator/30 border border-macos-separator text-macos-secondary font-mono rounded-md p-2 text-sm select-none cursor-not-allowed font-semibold opacity-70"
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

                    {/* CC */}
                    <div>
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            CC
                        </label>
                        <input
                            name="cc"
                            type="text"
                            disabled={isPending}
                            placeholder="-"
                            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue"
                        />
                    </div>

                    {/* TERM */}
                    <div>
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            Term *
                        </label>
                        <input
                            name="term"
                            type="text"
                            required
                            disabled={isPending}
                            placeholder="30 Days"
                            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue"
                        />
                    </div>

                    {/* VALIDITY */}
                    <div>
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            Validity *
                        </label>
                        <input
                            name="validity"
                            type="text"
                            required
                            disabled={isPending}
                            placeholder="1 Week"
                            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue"
                        />
                    </div>

                    {/* LEAD TIME */}
                    <div>
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            Lead Time *
                        </label>
                        <input
                            name="leadTime"
                            type="text"
                            required
                            disabled={isPending}
                            placeholder="Besaide schedule"
                            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue"
                        />
                    </div>

                    {/* DATE */}
                    <div>
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            Date *
                        </label>
                        <input
                            name="dateDelivery"
                            type="date"
                            required
                            disabled={isPending}
                            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition scheme-dark"
                        />
                    </div>

                    {/* FROM */}
                    <div>
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            From *
                        </label>
                        <input
                            name="fromUser"
                            type="text"
                            required
                            disabled={isPending}
                            readOnly
                            defaultValue="Sitor H"
                            className="w-full bg-macos-separator/30 cursor-not-allowed opacity-70 border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue"
                        />
                    </div>

                    {/* HANDPHONE */}
                    <div>
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            Handphone *
                        </label>
                        <input
                            name="handphone"
                            type="text"
                            required
                            disabled={isPending}
                            readOnly
                            defaultValue="0821 7277 8530"
                            className="w-full bg-macos-separator/30 cursor-not-allowed opacity-70 border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue"
                        />
                    </div>

                    {/* NO INVOICE */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                            No. Quotation Pelacak Internal *
                        </label>
                        <input
                            name="noInv"
                            type="text"
                            required
                            disabled={isPending}
                            placeholder="cth: 0524"
                            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue font-semibold"
                        />
                    </div>
                </div>
            </div>

            {/* ITEMS DYNAMIC SECTION */}
            <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-macos-separator pb-2 mb-2">
                    <h3 className="text-lg font-semibold text-macos-primary">
                        Quotation Items List
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
                        const materialSearch = materialInputs[item.id] || "";
                        const materialSuggestions = getMaterialSuggestions(
                            item.id,
                            materialSearch,
                        );
                        const materialExactMatch = AVAILABLE_MATERIAL.some(
                            (m) =>
                                m.toLowerCase() ===
                                materialSearch.trim().toLowerCase(),
                        );

                        const processSearch = processInputs[item.id] || "";
                        const processSuggestions = getProcessSuggestions(
                            item.id,
                            processSearch,
                        );
                        const processExactMatch = AVAILABLE_PROCESSES.some(
                            (p) =>
                                p.toLowerCase() ===
                                processSearch.trim().toLowerCase(),
                        );

                        return (
                            <div
                                key={item.id}
                                className="bg-macos-base/30 p-5 border border-macos-separator/40 rounded-xl space-y-4 animate-scale-up"
                            >
                                {/* BARIS ATAS: Description + Qty + Amount */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                                    {/* Kolom Deskripsi Barang */}
                                    <div className="sm:col-span-6 w-full">
                                        <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                                            Item Description #{index + 1} *
                                        </label>
                                        <textarea
                                            required
                                            value={item.description}
                                            disabled={isPending}
                                            rows={3}
                                            suppressHydrationWarning
                                            onChange={(e) =>
                                                updateItemField(
                                                    item.id,
                                                    "description",
                                                    e.target.value,
                                                )
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
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 1,
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
                                                        cycle[
                                                            item.unit ?? "pcs"
                                                        ],
                                                    );
                                                }}
                                                className="px-2.5 py-1 border border-macos-separator rounded-md text-xs font-bold text-macos-blue bg-macos-blue/10 hover:bg-macos-blue hover:text-white transition whitespace-nowrap cursor-pointer"
                                            >
                                                {item.unit ?? "pcs"}
                                            </button>
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
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
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
                                                onClick={() =>
                                                    removeItemRow(item.id)
                                                }
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

                                {/* 🌟 MATERIAL — TAG INPUT + AUTOCOMPLETE (sama persis seperti Processes) */}
                                <div className="border-t border-macos-separator/30 pt-3.5 relative">
                                    <span className="block text-[11px] font-bold text-macos-secondary mb-2.5 uppercase tracking-wider">
                                        Material Tipe :
                                    </span>

                                    {/* Tag chip material yang sudah ditambahkan */}
                                    {item.materials.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2.5">
                                            {item.materials.map((mat) => (
                                                <span
                                                    key={mat}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-macos-green/10 border border-macos-green/30 text-macos-green text-xs font-semibold"
                                                >
                                                    {mat}
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() =>
                                                            removeMaterialTag(
                                                                item.id,
                                                                mat,
                                                            )
                                                        }
                                                        className="hover:text-macos-red transition cursor-pointer leading-none"
                                                        title={`Hapus ${mat}`}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        disabled={isPending}
                                        autoComplete="off"
                                        value={materialSearch}
                                        placeholder="Ketik material (cth: MILD STEEL) atau tulis material baru, lalu Enter..."
                                        onFocus={() =>
                                            setMaterialOpenId(item.id)
                                        }
                                        onChange={(e) =>
                                            handleMaterialInputChange(
                                                item.id,
                                                e.target.value,
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addMaterialTag(
                                                    item.id,
                                                    materialSearch,
                                                );
                                            }
                                        }}
                                        onBlur={() =>
                                            setMaterialOpenId((curr) =>
                                                curr === item.id ? null : curr,
                                            )
                                        }
                                        className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
                                    />

                                    {materialOpenId === item.id &&
                                        (materialSuggestions.length > 0 ||
                                            (materialSearch.trim() &&
                                                !materialExactMatch)) && (
                                            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-macos-popover border border-macos-separator rounded-lg shadow-2xl z-50 py-1 divide-y divide-macos-separator/40 animate-scale-up">
                                                {materialSuggestions.map(
                                                    (mat) => (
                                                        <button
                                                            key={mat}
                                                            type="button"
                                                            onMouseDown={(e) =>
                                                                e.preventDefault()
                                                            }
                                                            onClick={() =>
                                                                addMaterialTag(
                                                                    item.id,
                                                                    mat,
                                                                )
                                                            }
                                                            className="w-full text-left px-3 py-2 text-xs text-macos-primary hover:bg-macos-blue hover:text-white transition cursor-pointer font-medium border-none bg-transparent"
                                                        >
                                                            ⚙️ {mat}
                                                        </button>
                                                    ),
                                                )}
                                                {materialSearch.trim() &&
                                                    !materialExactMatch && (
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) =>
                                                                e.preventDefault()
                                                            }
                                                            onClick={() =>
                                                                addMaterialTag(
                                                                    item.id,
                                                                    materialSearch,
                                                                )
                                                            }
                                                            className="w-full text-left px-3 py-2 text-xs text-macos-blue hover:bg-macos-blue hover:text-white transition cursor-pointer font-bold border-none bg-transparent"
                                                        >
                                                            ＋ Tambah material
                                                            baru "
                                                            {materialSearch.trim()}
                                                            "
                                                        </button>
                                                    )}
                                            </div>
                                        )}
                                </div>

                                {/* 🌟 PROSES MANUFAKTUR — TAG INPUT + AUTOCOMPLETE */}
                                <div className="border-t border-macos-separator/30 pt-3.5 relative">
                                    <span className="block text-[11px] font-bold text-macos-secondary mb-2.5 uppercase tracking-wider">
                                        Required Machining Processes :
                                    </span>

                                    {item.processes.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2.5">
                                            {item.processes.map((process) => (
                                                <span
                                                    key={process}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-macos-blue/10 border border-macos-blue/30 text-macos-blue text-xs font-semibold"
                                                >
                                                    {process}
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() =>
                                                            removeProcessTag(
                                                                item.id,
                                                                process,
                                                            )
                                                        }
                                                        className="hover:text-macos-red transition cursor-pointer leading-none"
                                                        title={`Hapus ${process}`}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        disabled={isPending}
                                        autoComplete="off"
                                        value={processSearch}
                                        placeholder="Ketik proses (cth: Machining) atau tulis proses baru, lalu Enter..."
                                        onFocus={() =>
                                            setProcessOpenId(item.id)
                                        }
                                        onChange={(e) =>
                                            handleProcessInputChange(
                                                item.id,
                                                e.target.value,
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addProcessTag(
                                                    item.id,
                                                    processSearch,
                                                );
                                            }
                                        }}
                                        onBlur={() =>
                                            setProcessOpenId((curr) =>
                                                curr === item.id ? null : curr,
                                            )
                                        }
                                        className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
                                    />

                                    {processOpenId === item.id &&
                                        (processSuggestions.length > 0 ||
                                            (processSearch.trim() &&
                                                !processExactMatch)) && (
                                            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-macos-popover border border-macos-separator rounded-lg shadow-2xl z-50 py-1 divide-y divide-macos-separator/40 animate-scale-up">
                                                {processSuggestions.map(
                                                    (process) => (
                                                        <button
                                                            key={process}
                                                            type="button"
                                                            onMouseDown={(e) =>
                                                                e.preventDefault()
                                                            }
                                                            onClick={() =>
                                                                addProcessTag(
                                                                    item.id,
                                                                    process,
                                                                )
                                                            }
                                                            className="w-full text-left px-3 py-2 text-xs text-macos-primary hover:bg-macos-blue hover:text-white transition cursor-pointer font-medium border-none bg-transparent"
                                                        >
                                                            🔧 {process}
                                                        </button>
                                                    ),
                                                )}
                                                {processSearch.trim() &&
                                                    !processExactMatch && (
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) =>
                                                                e.preventDefault()
                                                            }
                                                            onClick={() =>
                                                                addProcessTag(
                                                                    item.id,
                                                                    processSearch,
                                                                )
                                                            }
                                                            className="w-full text-left px-3 py-2 text-xs text-macos-blue hover:bg-macos-blue hover:text-white transition cursor-pointer font-bold border-none bg-transparent"
                                                        >
                                                            ＋ Tambah proses
                                                            baru "
                                                            {processSearch.trim()}
                                                            "
                                                        </button>
                                                    )}
                                            </div>
                                        )}
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
                <div>
                    <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                        Discount
                    </label>
                    <input
                        name="discount"
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        disabled={isPending}
                        onChange={(e) =>
                            setDiscount(parseFloat(e.target.value) || 0)
                        }
                        placeholder="5..."
                        className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-macos-secondary mb-1.5">
                        Global Remark (Catatan Tambahan)
                    </label>
                    <input
                        name="remark"
                        type="text"
                        disabled={isPending}
                        placeholder="Prices are valid 1 month after offer is sent"
                        className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
                    />
                </div>
                <div className="bg-macos-base/30 border border-macos-separator/40 rounded-xl p-4 space-y-2 text-sm font-mono">
                    <div className="flex justify-between text-macos-secondary">
                        <span>Subtotal</span>
                        <span>IDR {formatIDR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-macos-red">
                        <span>Discount ({discount}%)</span>
                        <span>- IDR {formatIDR(discountAmount)}</span>
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
                        {isPending
                            ? "Saving Records..."
                            : "Save Quotation and All Items"}
                    </button>
                </div>
            </div>
        </form>
    );
}
