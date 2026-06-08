import { prisma } from "@/lib/prisma";

const AccountType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE'
} as const;

const initialAccounts = [
  { code: '101', name: 'Kas Utama', type: AccountType.ASSET, description: 'Kas tunai operasional perusahaan' },
  { code: '102', name: 'Piutang Usaha', type: AccountType.ASSET, description: 'Tagihan kepada pelanggan atas jasa/barang' },
  { code: '103', name: 'Wesel Tagih', type: AccountType.ASSET, description: 'Wesel yang diterima dari pelanggan' },
  { code: '104', name: 'Persediaan barang dagang', type: AccountType.ASSET, description: 'Persediaan barang dagang' },
  { code: '105', name: 'Perlengkapan toko', type: AccountType.ASSET, description: 'Perlengkapan yang digunakan di toko' },
  { code: '106', name: 'Perlengkapan kantor', type: AccountType.ASSET, description: 'Laptop, PC, dan peripheral' },
  { code: '107', name: 'Asuransi dibayar di muka', type: AccountType.ASSET, description: 'Asuransi yang dibayar di muka' },
  { code: '108', name: 'Beban dibayar di muka', type: AccountType.ASSET, description: 'Beban yang dibayar di muka' },

  { code: '201', name: 'Utang Usaha', type: AccountType.LIABILITY, description: 'Kewajiban kepada supplier atau vendor' },
  { code: '202', name: 'Wesel bayar', type: AccountType.LIABILITY, description: 'Wesel yang dikeluarkan kepada supplier atau vendor' },
  { code: '203', name: 'Beban yang masih harus dibayar', type: AccountType.LIABILITY, description: 'Beban yang masih harus dibayar' },
  { code: '204', name: 'Utang Sewa', type: AccountType.LIABILITY, description: 'Kewajiban sewa tempat atau perlengkapan' },
  { code: '204', name: 'Utang Pajak', type: AccountType.LIABILITY, description: 'Kewajiban pajak yang masih harus dibayar' },
  { code: '204', name: 'Utang Gaji dan Upah', type: AccountType.LIABILITY, description: 'Kewajiban gaji dan upah yang masih harus dibayar' },
  { code: '204', name: 'Utang Muka Penjualan', type: AccountType.LIABILITY, description: 'Kewajiban muka penjualan yang masih harus dibayar' },

  { code: '301', name: 'Ekuitas Pemilik', type: AccountType.EQUITY, description: 'Setoran modal awal pemilik perusahaan' },
  { code: '302', name: 'Prive / Penarikan Pemilik', type: AccountType.EQUITY, description: 'Penarikan dana untuk keperluan pribadi pemilik' },

  { code: '401', name: 'Pendapatan Usaha', type: AccountType.REVENUE, description: 'Omset dari operasional bisnis inti' },

  { code: '501', name: 'Beban Gaji Karyawan', type: AccountType.EXPENSE, description: 'Gaji pokok, bonus, dan tunjangan tim' },
  { code: '504', name: 'Beban Asuransi', type: AccountType.EXPENSE, description: 'Biaya Asuransi' },
  { code: '505', name: 'Beban Perlengkapan', type: AccountType.EXPENSE, description: 'Biaya utilitas bulanan kantor' },
]

async function main() {
  console.log('Memulai proses seeding')

  for (const account of initialAccounts) {
    await prisma.chartOfAccount.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    })
  }

  console.log(`✅ Sukses memasukkan ${initialAccounts.length} akun master!`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })