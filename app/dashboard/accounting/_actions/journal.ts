"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type JournalLineInput = {
    accountId: string;
    debit: number;
    credit: number;
};

export async function createJournalEntry(formData: {
    description: string;
    reference?: string;
    date: Date;
    qty?: number;
    uom?: string;
    job?: string;
    lines: JournalLineInput[];
}) {
    // DEBIT = KREDIT
    const totalDebit = formData.lines.reduce(
        (sum, line) => sum + Number(line.debit),
        0,
    );
    const totalCredit = formData.lines.reduce(
        (sum, line) => sum + Number(line.credit),
        0,
    );

    if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
        return { success: false, error: "Total debit dan kredit harus sama." };
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.journalEntry.create({
                data: {
                    description: formData.description,
                    reference: formData.reference,
                    date: formData.date,
                    qty: formData.qty || 0,
                    uom: formData.uom || "",
                    job: formData.job || "",
                    status: "POSTED",
                    lines: {
                        create: formData.lines.map((line) => ({
                            accountId: line.accountId,
                            debit: line.debit,
                            credit: line.credit,
                        })),
                    },
                },
            });
        });
        revalidatePath("/dashboard/accounting/journal");
        return { success: true };
    } catch (error) {
        console.error("Error creating journal entry:", error);
        return {
            success: false,
            error: "Terjadi kesalahan saat membuat jurnal entry.",
        };
    }
}

function parseExcelDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    const cleanStr = dateStr.trim();

    if (/^\d+$/.test(cleanStr)) {
        const excelSerial = parseInt(cleanStr, 10);

        const dateJs = new Date((excelSerial - 25569) * 86400 * 1000);

        dateJs.setHours(12, 0, 0, 0);
        return dateJs;
    }

    const monthMap: Record<string, number> = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        mei: 4,
        may: 4,
        jun: 5,
        jul: 6,
        ags: 7,
        aug: 7,
        sep: 8,
        okt: 9,
        oct: 9,
        nov: 10,
        des: 11,
        dec: 11,
    };

    const separator = cleanStr.includes("-")
        ? "-"
        : cleanStr.includes("/")
          ? "/"
          : " ";
    const parts = cleanStr.split(separator);

    if (parts.length === 3) {
        const part1 = parts[0].toLowerCase();
        const part2 = parts[1].toLowerCase();
        const part3 = parts[2];

        if (isNaN(Number(part2))) {
            const day = parseInt(part1, 10);
            const month = monthMap[part2] !== undefined ? monthMap[part2] : 0;
            let year = parseInt(part3, 10);
            if (part3.length === 2) year = 2000 + year;

            if (!isNaN(day) && !isNaN(year)) {
                return new Date(year, month, day, 12, 0, 0);
            }
        }

        if (part3.length === 4) {
            const day = parseInt(part1, 10);
            const month = parseInt(part2, 10) - 1;
            const year = parseInt(part3, 10);
            return new Date(year, month, day, 12, 0, 0);
        } else if (part1.length === 4) {
            const year = parseInt(part1, 10);
            const month = parseInt(part2, 10) - 1;
            const day = parseInt(part3, 10);
            return new Date(year, month, day, 12, 0, 0);
        }
    }

    const fallbackDate = new Date(cleanStr);
    return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;
}

export async function getJournalEntries() {
    return await prisma.journalEntry.findMany({
        include: {
            lines: {
                include: {
                    account: true,
                },
                orderBy: {
                    debit: "desc",
                },
            },
        },
        orderBy: {
            date: "desc",
        },
    });
}

export async function truncateJournals() {
    try {
        await prisma.$transaction([
            prisma.journalLine.deleteMany({}),
            prisma.journalEntry.deleteMany({}),
        ]);

        revalidatePath("/dashboard/accounting/journal");
        revalidatePath("/dashboard/accounting/journal/import");

        return { success: true };
    } catch (error) {
        console.error("Gagal mengosongkan data jurnal:", error);
        return {
            success: false,
            error: "Gagal membersihkan database, terjadi gangguan sistem brayy!",
        };
    }
}

export async function importPettyCashExcel(rows: any[]) {
    try {
        // 1. Ambil info COA Kas Kecil kamu dari database.
        // Pastikan kode '102' ini sesuai dengan kode akun Petty Cash di database kamu ya brayy!
        const coaList = await prisma.chartOfAccount.findMany();
        const akunPettyCash = coaList.find((acc) => acc.code === "109");

        if (!akunPettyCash) {
            return {
                success: false,
                error: "Akun Petty Cash dengan kode [102] belum dibuat di COA brayy.",
            };
        }

        // 2. Jalankan transaksi massal ke database
        await prisma.$transaction(async (tx) => {
            for (const row of rows) {
                const nominal = Number(row.jumlah) || 0;
                const akunLawanId = row.selectedAccountId; // ID Akun hasil pilihan dropdown dari user

                if (!akunLawanId) {
                    throw new Error(
                        `Transaksi [${row.keterangan}] gagal disimpan karena akun COA belum dipilih.`,
                    );
                }

                // 3. Tentukan posisi debit kredit berdasarkan jenis arus kasnya
                let linesData = [];
                if (row.type === "INCOME") {
                    linesData = [
                        {
                            accountId: akunPettyCash.id,
                            debit: nominal,
                            credit: 0,
                        }, // Petty cash bertambah di Debit
                        { accountId: akunLawanId, debit: 0, credit: nominal }, // Akun lawan di Kredit
                    ];
                } else {
                    linesData = [
                        { accountId: akunLawanId, debit: nominal, credit: 0 }, // Beban bertambah di Debit
                        {
                            accountId: akunPettyCash.id,
                            debit: 0,
                            credit: nominal,
                        }, // Petty cash berkurang di Kredit
                    ];
                }

                // 4. Insert ke table JournalEntry tingkat induk beserta lines-nya
                await tx.journalEntry.create({
                    data: {
                        date: parseExcelDate(row.tanggal),
                        reference: row.no_dokumen || "PETTY-CASH",
                        description: row.keterangan,
                        qty: Number(row.qty) || 0,
                        uom: row.uom || "",
                        job: row.job || "",
                        status: "POSTED",
                        lines: {
                            create: linesData,
                        },
                    },
                });
            }
        });

        revalidatePath("/dashboard/accounting/journal");
        return { success: true };
    } catch (error: any) {
        console.error("Error pas mass-import:", error);
        return {
            success: false,
            error: error.message || "Gagal menyimpan data jurnal massal.",
        };
    }
}
