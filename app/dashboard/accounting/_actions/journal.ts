'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type JournalLineInput = {
    accountId: string;
    debit: number;
    credit: number;
}

export async function createJournalEntry(formData: {
    description: string;
    reference?: string;
    date: Date;
    lines: JournalLineInput[];
}) {
    // DEBIT = KREDIT
    const totalDebit    = formData.lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit   = formData.lines.reduce((sum, line) => sum + Number(line.credit), 0);
    

    if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
        return { success: false, error: "Total debit dan kredit harus sama."};
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.journalEntry.create({
                data: {
                    description: formData.description,
                    reference: formData.reference,
                    date: formData.date,
                    status: 'POSTED',
                    lines: {
                        create: formData.lines.map((line) => ({
                            accountId: line.accountId,
                            debit: line.debit,
                            credit: line.credit,
                        }))
                    }
                }
            })
        })
        revalidatePath("/dashboard/accounting/journal");
        return { scuccess: true };
    } catch (error) {
        console.error("Error creating journal entry:", error);
        return { success: false, error: "Terjadi kesalahan saat membuat jurnal entry." };
    }
}

export async function getJournalEntries() {
  return await prisma.journalEntry.findMany({
    include: {
      lines: {
        include: {
          account: true,
        },
        orderBy: {
          debit: 'desc', 
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });
}