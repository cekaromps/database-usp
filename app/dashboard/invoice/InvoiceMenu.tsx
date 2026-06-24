"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteInvoiceButton from "./DeleteInvoiceButton";

export default function InvoiceMenu({ invoice, handleDeleteInvoice }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative pl-8 pt-2 inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-macos-tertiary rounded-md text-macos-secondary hover:text-macos-primary font-bold transition text-md leading-none select-none cursor-pointer focus:outline-none"
      >
        •••
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-2 top-full mt-1 block w-44 bg-macos-popover border border-macos-separator rounded-lg shadow-2xl z-50 py-1 overflow-hidden text-left">
            <Link
              href={`/dashboard/invoice/edit?noInv=${invoice.noInv}`}
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 text-xs text-macos-primary hover:bg-macos-blue hover:text-white transition flex items-center gap-2 font-medium"
            >
              ✏️ Edit Invoice Info
            </Link>
            <Link
              href={`/dashboard/invoicemaker/print?noInv=${invoice.noInv}`}
              className="w-full px-4 py-2 text-xs text-macos-primary hover:bg-macos-blue hover:text-white transition flex items-center gap-2"
            >
              📄 View / Print PDF
            </Link>

            <div className="border-t border-macos-separator/50 my-1"></div>

            {/* 🌟 SEKARANG JADI SUPER BERSIH & AMAN MENGGUNAKAN KOMPONEN BARU KITA */}
            <DeleteInvoiceButton
              noInv={invoice.noInv}
              deleteAction={handleDeleteInvoice}
            />
          </div>
        </>
      )}
    </div>
  );
}
