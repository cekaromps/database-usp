"use main";
"use client";

import React from "react";
import * as XLSX from "xlsx";
import { AccountType } from "@prisma/client";

// Struktur data akun yang dikirim dari server
interface Account {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: AccountType;
}

interface ExportCOAButtonProps {
    groupedAccounts: Record<AccountType, Account[]>;
}

export default function ExportCOAButton({
    groupedAccounts,
}: ExportCOAButtonProps) {
    const handleExport = () => {
        // 1. Ratakan data dari yang berbentuk object groups menjadi satu array flat brayy
        const allAccounts: Account[] = [];
        const accountTypes: AccountType[] = [
            "ASSET",
            "LIABILITY",
            "EQUITY",
            "REVENUE",
            "EXPENSE",
        ];

        accountTypes.forEach((type) => {
            if (groupedAccounts[type]) {
                allAccounts.push(...groupedAccounts[type]);
            }
        });

        if (allAccounts.length === 0) {
            alert("Waduh brayy, data COA kosong, gak ada yang bisa di-export!");
            return;
        }

        // 2. Format struktur kolom Excel-nya sesuai permintaanmu
        const rows = allAccounts.map((acc) => ({
            "Kode Akun": acc.code,
            "Nama Rekening": acc.name,
            Kategori: acc.type,
            Deskripsi: acc.description || "-",
        }));

        // 3. Proses build spreadsheet via library 'xlsx'
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Master COA");

        // 4. Auto-width adjustment biar kolom gak tabrakan atau kepotong teksnya
        worksheet["!cols"] = [
            { wch: 15 }, // Lebar Kode Akun
            { wch: 30 }, // Lebar Nama Rekening
            { wch: 15 }, // Lebar Kategori
            { wch: 50 }, // Lebar Deskripsi
        ];

        // 5. Trigger auto-download file .xlsx di browser komputer kamu
        XLSX.writeFile(workbook, "Master_COA_UPS_Export.xlsx");
    };

    return (
        <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-xs transition shadow-sm flex items-center gap-1.5"
        >
            <span>📊</span> Export Excel (.xlsx)
        </button>
    );
}
