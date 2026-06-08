"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { ItemType } from "@/lib/generated/prisma/enums";

import {prisma} from "@/lib/prisma";

export async function getFolderContents(parentId: string | null) {
    try {
        const items = await prisma.item.findMany({
            where: {
                parentId: parentId,
            },
            orderBy: [
                {type : "asc"},
                {name : "asc"}
            ],
        });
        return { success: true, data : items};
    } catch (error) {
        console.error("Gagal mengambil data drive:", error)
        return { success: false, error : "Gagal memuat data",}
    }
}

export async function createNewFolder(folderName: string, parentId: string | null) {
  if (!folderName.trim()) {
    return { success: false, error: "Nama folder tidak boleh kosong." };
  }

  try {
    const newFolder = await prisma.item.create({
      data: {
        name: folderName.trim(),
        type: ItemType.FOLDER,
        parentId: parentId, // Folder dimasukkan ke dalam folder aktif saat ini
      },
    });

    revalidatePath("/drive");
    return { success: true, data: newFolder };
  } catch (error) {
    console.error("Gagal membuat folder:", error);
    return { success: false, error: "Gagal membuat folder baru." };
  }
}


export const fileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setIsLoadingPreview, setExcelDataPreview, saveFileToServer) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingPreview(true);
    const ext = file.name.split(".").pop()?.toLowerCase();

    // JIKA FILE EXCEL: Ekstrak ke JSON agar bisa di-preview di aplikasi
    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonConverted = XLSX.utils.sheet_to_json(worksheet);
          
          setExcelDataPreview(jsonConverted);

          await saveFileToServer(file.name, file.size, jsonConverted);
        } catch (err) {
          alert("Gagal membaca berkas Excel");
        } finally {
          setIsLoadingPreview(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } 
    // JIKA FILE NON-EXCEL (PDF, Word, Gambar, dll)
    else {
      try {
        // Menggunakan FileReader untuk mengubah file menjadi Base64 string agar bisa disimpan di kolom text database
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result;
          await saveFileToServer(file.name, file.size, { rawFile: base64String, isGeneric: true });
          setIsLoadingPreview(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        alert("Gagal memproses file mentah");
        setIsLoadingPreview(false);
      }
    }
  };

export const createFolder = async (
  e: React.FormEvent,
  folderNameInput: string,
  currentFolderId: string | null,
  setFolderNameInput: (value: string) => void,
  fetchItems: () => Promise<void> | void
) => {
  if (!folderNameInput.trim()) return;

  try {
    const res = await fetch("/api/fileman/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: folderNameInput.trim(),
        parentId: currentFolderId,
      }),
    });

    if (res.ok) {
      setFolderNameInput("");
      await fetchItems(); // Ditambahkan await jika fetchItems asynchronous
    }
  } catch (err) {
    console.error(err);
    alert("Gagal membuat folder"); // Typo "Gagel" juga sudah diperbaiki
  }
};