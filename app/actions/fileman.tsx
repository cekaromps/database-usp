"use server";

import { revalidatePath } from "next/cache";
import { ItemType } from "@prisma/client";

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