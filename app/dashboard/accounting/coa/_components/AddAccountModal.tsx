"use client";

import { useState } from "react";
import { createAccount } from "../../_actions/coa";
import { AccountType } from "@prisma/client";

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddAccountModal({
    isOpen,
    onClose,
}: AddAccountModalProps) {
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<AccountType>("EXPENSE"); // Default ke beban
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !name) {
            alert("Kode dan Nama akun wajib diisi brayy!");
            return;
        }

        setIsSubmitting(true);
        // Masukkan data form ke Server Action kamu brayy
        const result = await createAccount({
            code,
            name,
            type,
        });
        setIsSubmitting(false);

        if (result.success) {
            alert("Mantap! Akun COA baru berhasil terdaftar.");
            // Reset Form
            setCode("");
            setName("");
            setDescription("");
            onClose(); // Tutup modal otomatis
        } else {
            alert("Gagal: " + result.error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md p-5 bg-macos-secondary text-macos-primary rounded-xl border border-macos-popover shadow-2xl space-y-4">
                {/* Header Modal */}
                <div className="flex justify-between items-center border-b border-macos-popover pb-2">
                    <h2 className="text-md font-bold tracking-tight">
                        Buat Rekening Baru (COA)
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-macos-primary text-xs font-semibold px-2 py-0.5 rounded bg-macos-tertiary"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Isi */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Tipe Akun */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-1">
                            Kategori Rekening
                        </label>
                        <select
                            value={type}
                            onChange={(e) =>
                                setType(e.target.value as AccountType)
                            }
                            className="w-full px-2.5 py-1.5 bg-macos-primary border border-macos-popover rounded-lg text-xs text-macos-primary focus:outline-none focus:border-blue-500"
                        >
                            <option value="ASSET">
                                ASSET (Kepala 1 - Kas, Bank, Kas Kecil)
                            </option>
                            <option value="LIABILITY">
                                LIABILITY (Kepala 2 - Utang)
                            </option>
                            <option value="EQUITY">
                                EQUITY (Kepala 3 - Modal)
                            </option>
                            <option value="REVENUE">
                                REVENUE (Kepala 4 - Pendapatan)
                            </option>
                            <option value="EXPENSE">
                                EXPENSE (Kepala 5 - Beban Operasional)
                            </option>
                        </select>
                    </div>

                    {/* Kode Rekening */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-1">
                            Kode Akun / Nomor
                        </label>
                        <input
                            type="text"
                            placeholder="Misal: 109 atau 501"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-macos-primary border border-macos-popover rounded-lg text-xs font-mono text-macos-primary focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Nama Rekening */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-1">
                            Nama Rekening / Akun
                        </label>
                        <input
                            type="text"
                            placeholder="Misal: Petty Cash 109 atau Beban Material"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-macos-primary border border-macos-popover rounded-lg text-xs text-macos-primary focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Deskripsi (Optional) */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-1">
                            Deskripsi Singkat (Opsional)
                        </label>
                        <textarea
                            placeholder="Catatan tambahan mengenai fungsi akun ini..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-2.5 py-1.5 bg-macos-primary border border-macos-popover rounded-lg text-xs text-macos-primary focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Tombol Footer */}
                    <div className="flex justify-end gap-2 pt-3 border-t border-macos-popover text-xs">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 bg-macos-tertiary hover:opacity-80 rounded-md font-medium transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-md transition shadow"
                        >
                            {isSubmitting ? "Menyimpan..." : "Simpan Rekening"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
