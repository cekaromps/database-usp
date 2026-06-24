"use client";

import { useState } from "react";
import AddAccountModal from "./AddAccountModal";

export default function AddAccountButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow transition"
            >
                + Tambah Akun
            </button>

            {/* Modal yang otomatis nongol ketika state isOpen bernilai true */}
            <AddAccountModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
