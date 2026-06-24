"use client";

import { useState } from "react";
import { truncateJournals } from "../../_actions/journal"; // Sesuaikan path action lo brayy

export default function ResetJournalButton() {
    const [isWiping, setIsWiping] = useState(false);

    const handleReset = async () => {
        // Konfirmasi Lapis 1
        const tanya1 = confirm("⚠️ PERINGATAN Keras");
        if (!tanya1) return;

        // Konfirmasi Lapis 2 biar anti-salah-klik
        const tanya2 = confirm(
            "Beneran di-wipe bersih nih brayy? Data lama gak akan bisa balik lagi loh!",
        );
        if (!tanya2) return;

        setIsWiping(true);
        const res = await truncateJournals();
        setIsWiping(false);

        if (res.success) {
            alert(
                "Sip, database jurnal udah kosong melompong! Silakan import ulang brayy.",
            );
            window.location.reload(); // Refresh halaman biar data layar sinkron bersih
        } else {
            alert("Error: " + res.error);
        }
    };

    return (
        <button
            type="button"
            onClick={handleReset}
            disabled={isWiping}
            className="px-3.5 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-semibold rounded-lg text-xs transition border border-red-500/20 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
            <span>🗑️</span>{" "}
            {isWiping ? "Mengosongkan..." : "Dump / Reset Semua Jurnal"}
        </button>
    );
}
