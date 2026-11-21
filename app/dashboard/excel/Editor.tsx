"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "@univerjs/preset-sheets-core/lib/index.css";

type UniverAPI = import("@univerjs/presets").FUniver;
type Univer = import("@univerjs/presets").Univer;
type WorkbookData = import("@univerjs/presets").IWorkbookData;

async function loadConverter() {
  const mod: any = await import("@mertdeveci55/univer-import-export");
  return (mod.LuckyExcel ?? mod.default?.LuckyExcel ?? mod.default) as {
    transformExcelToUniver: (
      file: File,
      ok: (data: WorkbookData) => void,
      fail: (err: Error) => void,
    ) => Promise<void>;
    transformCsvToUniver: (
      file: File,
      ok: (data: WorkbookData) => void,
      fail: (err: Error) => void,
    ) => void;
    transformUniverToExcel: (p: {
      snapshot: unknown;
      fileName?: string;
      success?: () => void;
      error?: (err: Error) => void;
    }) => Promise<void>;
  };
}

export default function ExcelEditor({ driveFile }: { driveFile: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<UniverAPI | null>(null);
  const univerRef = useRef<Univer | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef<string | null>(null);
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("workbook.xlsx");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [
        { createUniver, LocaleType, merge },
        { UniverSheetsCorePreset },
        idID,
      ] = await Promise.all([
        import("@univerjs/presets"),
        import("@univerjs/preset-sheets-core"),
        import("@univerjs/preset-sheets-core/locales/id-ID"),
      ]);
      if (cancelled || !containerRef.current) return;

      const { univer, univerAPI } = createUniver({
        locale: LocaleType.ID_ID,
        locales: { [LocaleType.ID_ID]: merge({}, idID.default) },
        presets: [UniverSheetsCorePreset({ container: containerRef.current })],
      });

      univerAPI.createWorkbook({ name: "Workbook1" });
      univerRef.current = univer;
      apiRef.current = univerAPI;
      setReady(true);
    })().catch((e) => {
      console.error(e);
      setMessage("Editor gagal dimuat. Lihat console untuk detail.");
    });

    return () => {
      cancelled = true;
      univerRef.current?.dispose();
      univerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  const openFile = useCallback(async (file: File) => {
    const api = apiRef.current;
    if (!api) return;
    setBusy(true);
    setMessage("");
    try {
      const converter = await loadConverter();
      const isCsv = /\.csv$/i.test(file.name);
      const data = await new Promise<WorkbookData>((resolve, reject) => {
        if (isCsv) converter.transformCsvToUniver(file, resolve, reject);
        else converter.transformExcelToUniver(file, resolve, reject);
      });

      const current = api.getActiveWorkbook();
      if (current) api.disposeUnit(current.getId());
      api.createWorkbook(data);
      setFileName(file.name.replace(/\.(xls|csv)$/i, ".xlsx"));
    } catch (err) {
      console.error(err);
      setMessage(
        "File tidak bisa dibaca. Gunakan file .xlsx, .xls, atau .csv yang valid.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !driveFile || loadedRef.current === driveFile) return;
    loadedRef.current = driveFile; // prevents double-load in React strict mode

    (async () => {
      setBusy(true);
      setMessage("");
      try {
        const res = await fetch(
          `/api/drive/file?filePath=${encodeURIComponent(driveFile)}`,
        );
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        const name = driveFile.split("/").pop() || "workbook.xlsx";
        await openFile(new File([blob], name)); // openFile handles .csv/.xls detection
      } catch (err) {
        console.error(err);
        setMessage("Gagal mengambil file dari drive.");
        setBusy(false);
      }
    })();
  }, [ready, driveFile, openFile]);

  const download = useCallback(async () => {
    const workbook = apiRef.current?.getActiveWorkbook();
    if (!workbook) return;
    setBusy(true);
    setMessage("");
    try {
      const converter = await loadConverter();
      await converter.transformUniverToExcel({
        snapshot: workbook.save(),
        fileName: fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`,
        error: (err) => {
          console.error(err);
          setMessage("Gagal mengekspor file Excel.");
        },
      });
    } finally {
      setBusy(false);
    }
  }, [fileName]);

  const btn =
    "px-3 py-1.5 text-sm rounded-md border border-macos-separator bg-macos-popover hover:border-macos-blue/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="h-screen flex flex-col bg-macos-base text-macos-primary font-sans antialiased">
      <header className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-macos-separator">
        {driveFile && (
          <button className={btn} onClick={() => router.back()}>
            ← Kembali
          </button>
        )}
        <h1 className="text-xl font-bold tracking-tight mr-2">Excel Editor</h1>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) openFile(f);
            e.target.value = "";
          }}
        />
        <button
          className={btn}
          disabled={!ready || busy}
          onClick={() => fileRef.current?.click()}
        >
          Buka file
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded-md bg-macos-blue text-white font-medium hover:bg-opacity-80 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!ready || busy}
          onClick={download}
        >
          Unduh .xlsx
        </button>
        <span className="text-sm text-macos-secondary">{fileName}</span>
        {!ready && !message && (
          <span className="text-sm text-macos-secondary">Memuat editor…</span>
        )}
        {busy && (
          <span className="text-sm text-macos-secondary">Memproses…</span>
        )}
        {message && <span className="text-sm text-macos-red">{message}</span>}
      </header>

      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
