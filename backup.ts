import { exec } from "child_process";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("Error: DATABASE_URL tidak ditemukan di file .env");
    process.exit(1);
}

// ========================================================
// PERBAIKAN: Hapus parameter query khusus Prisma (?schema=...)
// ========================================================
const parsedUrl = new URL(dbUrl);
parsedUrl.search = ""; // Ini akan menghapus semua query parameter (?schema=public, dll)
const cleanDbUrl = parsedUrl.toString();
// ========================================================

const timestamp = Date.now();
const outputFilename = `backup-${timestamp}.dump`;
const outputPath = path.join(process.cwd(), outputFilename);

console.log("Starting database backup...");

// Gunakan cleanDbUrl yang sudah dibersihkan
exec(
    `pg_dump --dbname="${cleanDbUrl}" -F c -f "${outputPath}"`,
    (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup failed: ${error.message}`);
            process.exit(1);
        }

        if (stderr) {
            console.log(`Status: ${stderr}`);
        }

        console.log(`Backup completed successfully! Saved to ${outputPath}`);
    },
);
