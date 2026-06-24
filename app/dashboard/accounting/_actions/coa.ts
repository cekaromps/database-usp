'use server'

import { prisma } from "@/lib/prisma";
import { AccountType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getGroupedAccounts() {
  const accounts = await prisma.chartOfAccount.findMany({
    orderBy: {
      code: 'asc'
    }
  });

  const grouped: Record<AccountType, typeof accounts> = {
    ASSET: [],
    LIABILITY: [],
    EQUITY: [],
    REVENUE: [],
    EXPENSE: []
  };

  accounts.forEach(acc => {
    grouped[acc.type].push(acc);
  });

  return grouped;
}

export async function getAccountsForSelect() {
  return await prisma.chartOfAccount.findMany({
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: {
      code: 'asc'
    }
  });
}

export async function createAccount(data: {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
}) {
  try {
    const existing = await prisma.chartOfAccount.findUnique({
      where: { code: data.code }
    });

    if (existing) {
      return { success: false, error: `Kode akun [${data.code}] sudah digunakan oleh ${existing.name}.` };
    }

    await prisma.chartOfAccount.create({ data });
    
    revalidatePath('/dashboard/accounting/coa');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Gagal menambahkan akun baru." };
  }
}