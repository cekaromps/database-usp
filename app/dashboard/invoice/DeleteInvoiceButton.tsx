"use client"; // 🌟 Ini wajib agar confirm() browser bisa jalan normal tanpa error

import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  noInv: string;
  // Kita lempar server action sebagai prop agar tetap dieksekusi aman di server
  deleteAction: (formData: FormData) => Promise<void>; 
}

export default function DeleteInvoiceButton({ noInv, deleteAction }: DeleteButtonProps) {
  const router = useRouter();

  const handleClientDelete = async () => {
    // 1. Munculkan konfirmasi native browser yang aman
    const kofirmasi = confirm(`Apakah Anda yakin ingin menghapus Invoice No: ${noInv} beserta seluruh item di dalamnya?`);
    
    if (kofirmasi) {
      // 2. Jika OK, buat FormData manual dan tembak ke Server Action
      const formData = new FormData();
      formData.append("noInv", noInv);
      
      await deleteAction(formData);
      
      // 3. Refresh halaman agar data tabel terupdate otomatis
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClientDelete}
      className="w-full px-4 py-2 text-xs text-left text-macos-red hover:bg-macos-red hover:text-white transition flex items-center gap-2 cursor-pointer font-medium border-none bg-transparent"
    >
      🗑️ Delete Invoice
    </button>
  );
}