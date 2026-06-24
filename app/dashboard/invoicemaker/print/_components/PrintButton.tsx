"use client";

export default function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition shadow-md cursor-pointer select-none"
        >
            🖨️ Cetak / Simpan sebagai PDF Resmi
        </button>
    );
}
