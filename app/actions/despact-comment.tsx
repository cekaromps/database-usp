"use server";

import { assertSection } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const MAX_LEN = 1000;

// Only production can write comments; finance just reads them.
export async function addDespactItemCommentAction(itemId: number, body: string) {
  const session = await assertSection("production");

  const text = (body ?? "").trim();
  if (!text) return "Komentar tidak boleh kosong.";
  if (text.length > MAX_LEN) return `Komentar maksimal ${MAX_LEN} karakter.`;

  const item = await prisma.despactItem.findUnique({
    where: { id: itemId },
    select: { id: true },
  });
  if (!item) return "Item tidak ditemukan.";

  await prisma.despactComment.create({
    data: {
      despactItemId: itemId,
      authorId: session.userId,
      authorName: session.username,
      body: text,
    },
  });

  revalidatePath("/dashboard/production/job-despact");
  revalidatePath("/dashboard/finance/job-despact-list");
}