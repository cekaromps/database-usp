"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Folder, FileSpreadsheet, Search, FolderPlus, FileUp, Trash2, Maximize2, X, FolderUp } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

// Hubungkan dengan Server Actions global Anda (sesuaikan path impor jika berbeda)
import { logoutAction } from "@/app/actions/auth";

export default function ExcelFileManPage() {
  // --- STATE MANAGEMENT ---
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [folderNameInput, setFolderNameInput] = useState("");
  const [excelDataPreview, setExcelDataPreview] = useState<any[] | null>(null);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // --- REFS FOR FILE & FOLDER INPUTS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // --- 1. AMBIL DAFTAR DATA (FOLDER & FILE) DARI POSTGRES ---
  const fetchItems = async () => {
    try {
      const url = searchQuery 
        ? `/api/fileman?search=${encodeURIComponent(searchQuery)}`
        : `/api/fileman?folderId=${currentFolderId || ""}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Server Error (${res.status}):`, errorText);
        return;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server tidak mengembalikan JSON, melainkan:", contentType);
        return;
      }

      const resData = await res.json();
      if (resData.success) {
        setItems(resData.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentFolderId, searchQuery]);

  // --- 2. AKSI MEMBUAT FOLDER BARU ---
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
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
        fetchItems();
      }
    } catch (err) {
      alert("Gagal membuat folder");
    }
  };

  // --- 3. AKSI MENGHAPUS ITEM (FOLDER/FILE) ---
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus item ini?")) return;

    try {
      const res = await fetch(`/api/fileman?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      alert("Gagal menghapus item");
    }
  };

  // --- 4. AKSI UNGHAH & BACA FILE EXCEL TUNGGAL ---
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonConverted = XLSX.utils.sheet_to_json(worksheet);
        
        setExcelDataPreview(jsonConverted);
        setIsFullscreenPreview(true);

        const res = await fetch("/api/fileman/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            parentId: currentFolderId,
            contentData: jsonConverted, 
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server gagal menyimpan berkas: ${errorText}`);
        }

        await fetchItems();
        if (fileInputRef.current) fileInputRef.current.value = "";

      } catch (err) {
        console.error("Detail eror upload:", err);
        alert("Gagal membaca atau menyimpan file Excel ke server");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- 5. AKSI UNGHAH SATU FOLDER EXCEL SEKALIGUS ---
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  // 1. Saring hanya berkas Excel saja
  const excelFiles = Array.from(files).filter(
    (file) => file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
  );

  if (excelFiles.length === 0) {
    alert("Tidak ditemukan berkas Excel (.xlsx / .xls) di dalam folder yang dipilih.");
    return;
  }

  setIsLoadingPreview(true);
  let successCount = 0;
  let targetFolderId = currentFolderId; // Default memakai folder aktif saat ini

  try {
    // 2. Deteksi nama folder utama dari file pertama yang diunggah
    // Properti webkitRelativePath bentuknya seperti: "NamaFolderKamu/file_excel.xlsx"
    const firstFile = excelFiles[0];
    const relativePath = (firstFile as any).webkitRelativePath;

    if (relativePath && relativePath.includes("/")) {
      const rootFolderName = relativePath.split("/")[0]; // Mengambil "NamaFolderKamu"

      // 3. Buat folder tersebut di database secara otomatis
      const folderRes = await fetch("/api/fileman/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rootFolderName,
          parentId: currentFolderId, // Jika kamu sedang di dalam subfolder, dia akan bersarang di dalamnya
        }),
      });

      if (folderRes.ok) {
        const folderData = await folderRes.json();
        // Pastikan API folder kamu mengembalikan data folder yang baru dibuat beserta ID-nya
        // Contoh response ideal: { success: true, data: { id: "uuid-folder-baru", name: "..." } }
        if (folderData.success && folderData.data?.id) {
          targetFolderId = folderData.data.id; // Alihkan target simpan file ke ID folder baru ini!
        }
      } else {
        console.warn("Gagal membuat folder induk otomatis, file akan langsung ditaruh di direktori aktif.");
      }
    }

    // 4. Looping untuk membaca isi Excel dan menyimpannya ke dalam folder baru tadi
    for (const file of excelFiles) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonConverted = XLSX.utils.sheet_to_json(worksheet);

        const res = await fetch("/api/fileman/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            parentId: targetFolderId, // Masuk ke folder baru yang otomatis terbuat
            contentData: jsonConverted,
          }),
        });

        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error(`Gagal memproses berkas: ${file.name}`, err);
      }
    }

    alert(`Proses selesai! Folder berhasil dibuat, dan ${successCount} file Excel dimasukkan ke dalamnya.`);
  } catch (globalErr) {
    console.error("Gagal memproses unggah folder:", globalErr);
    alert("Terjadi kesalahan saat mengunggah folder.");
  } finally {
    setIsLoadingPreview(false);
    await fetchItems();
    if (folderInputRef.current) folderInputRef.current.value = "";
  }
};

  // --- 6. AMBIL DATA FILE DARI DATABASE UNTUK PREVIEW ---
  const handleOpenFilePreview = async (fileId: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/fileman/file?id=${fileId}`);
      if (!res.ok) throw new Error("Gagal mengambil data file dari server");
      
      const resData = await res.json();
      if (resData.success && resData.data.contentData) {
        setExcelDataPreview(resData.data.contentData);
        setIsFullscreenPreview(true);
      } else {
        alert("File ini tidak memiliki data konten preview.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memuat preview berkas");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      
      {/* INPUT FILE & FOLDER TERSEMBUNYI */}
      <input 
        type="file" 
        ref={fileInputRef}
        accept=".xlsx, .xls" 
        onChange={handleExcelUpload} 
        className="hidden" 
      />

      <input 
        type="file"
        ref={folderInputRef}
        onChange={handleFolderUpload}
        className="hidden"
        {...{
          webkitdirectory: "",
          directory: "",
          multiple: true
        } as any}
      />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center w-10 h-10 bg-macos-tertiary border border-macos-separator rounded-xl text-macos-secondary hover:text-macos-blue hover:border-macos-blue/30 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Excel FileMan</h1>
            <p className="text-sm text-macos-secondary mt-0.5">Sistem Berkas Global Terintegrasi</p>
          </div>
        </div>
        
        <form action={logoutAction}>
          <button type="submit" className="px-4 py-2 bg-macos-red text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer">
            Sign Out
          </button>
        </form>
      </div>

      {/* LAYOUT GRID UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* PANEL KIRI: MANAGEMENT ENTRI DATA */}
        <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl h-fit space-y-6">
          
          {/* Form Buat Folder */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-macos-primary flex items-center gap-2">
              <FolderPlus size={18} className="text-macos-blue" />
              Create New Folder
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-macos-secondary mb-1.5">Folder Name *</label>
                <input
                  type="text"
                  required
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  placeholder="e.g., Q4 Invoices"
                  className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-macos-blue text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition">
                Create Folder
              </button>
            </form>
          </div>

          {/* Form Unggah File & Folder Excel */}
          <div className="border-t border-macos-separator pt-4 space-y-3">
            <h3 className="text-lg font-semibold text-macos-primary flex items-center gap-2 mb-1">
              <FileUp size={18} className="text-emerald-500" />
              Upload Excel System
            </h3>
            
            {/* Tombol Unggah File */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 bg-macos-tertiary border border-macos-separator rounded-lg text-left cursor-pointer hover:border-macos-blue hover:bg-macos-blue/5 transition group"
            >
              <FileSpreadsheet size={20} className="text-emerald-500 shrink-0 group-hover:scale-105 transition" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-macos-primary">Upload File Satuan</span>
                <span className="text-[10px] text-macos-secondary">Pilih file berformat .xlsx / .xls</span>
              </div>
            </button>

            {/* Tombol Unggah Folder */}
            <button 
              onClick={() => folderInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 bg-macos-tertiary border border-macos-separator rounded-lg text-left cursor-pointer hover:border-macos-blue hover:bg-macos-blue/5 transition group"
            >
              <FolderUp size={20} className="text-amber-500 shrink-0 group-hover:scale-105 transition" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-macos-primary">Upload Satu Folder</span>
                <span className="text-[10px] text-macos-secondary">Impor seluruh isi berkas Excel sekaligus</span>
              </div>
            </button>
          </div>
        </div>

        {/* PANEL KANAN: BROWSER PENJELASAH FILE */}
        <div className="lg:col-span-2 bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl">
          
          {/* SEARCH & BREADCRUMB BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-macos-separator">
            <div className="flex items-center gap-2 text-sm text-macos-secondary font-medium">
              <button onClick={() => { setCurrentFolderId(null); setSearchQuery(""); }} className="hover:text-macos-blue transition">
                Root FileMan
              </button>
              {currentFolderId && (
                <>
                  <span className="text-macos-separator">/</span>
                  <button 
                    onClick={() => setCurrentFolderId(null)} 
                    className="text-xs bg-macos-tertiary border border-macos-separator px-2 py-0.5 rounded-md hover:text-macos-blue transition"
                  >
                    ← Back to Root
                  </button>
                </>
              )}
            </div>

            {/* Input Filter Pencarian */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-macos-secondary" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files/folders..." 
                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary pl-9 pr-4 py-1.5 rounded-md text-sm focus:outline-none focus:border-macos-blue transition"
              />
            </div>
          </div>

          {/* LOADING INDIKATOR */}
          {isLoadingPreview && (
            <div className="p-3 mb-4 text-xs text-center bg-macos-blue/10 text-macos-blue border border-macos-blue/20 rounded-lg animate-pulse">
              Memproses sinkronisasi data spreadsheet dengan server database...
            </div>
          )}

          {/* TABEL DAFTAR DATA */}
          {items.length === 0 ? (
            <div className="text-center py-16 text-macos-secondary border border-dashed border-macos-separator rounded-lg">
              No files or folders found here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-macos-separator text-xs font-semibold text-macos-secondary uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Size</th>
                    <th className="py-3 px-4 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-macos-separator/30 text-sm">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-macos-tertiary/40 transition">
                      
                      {/* Kolom Nama Berkas */}
                      <td className="py-3 px-4">
                        {item.type === "FOLDER" ? (
                          <button
                            onClick={() => {
                              setCurrentFolderId(item.id);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-2.5 text-macos-primary hover:text-macos-blue transition text-left"
                          >
                            <Folder size={18} className="text-amber-500 shrink-0" />
                            <span className="truncate max-w-[180px] sm:max-w-xs">{item.name}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenFilePreview(item.id)}
                            title="Klik untuk membuka pratinjau halaman penuh berkas ini"
                            className="flex items-center gap-2.5 text-macos-primary hover:text-emerald-500 transition text-left w-full group"
                          >
                            <FileSpreadsheet size={18} className="text-emerald-500 group-hover:scale-110 transition shrink-0" />
                            <span className="truncate max-w-[180px] sm:max-w-xs group-hover:underline">
                              {item.name}
                            </span>
                          </button>
                        )}
                      </td>

                      {/* Kolom Tipe */}
                      <td className="py-3 px-4">
                        <span 
                          className={`px-2 py-0.5 rounded-md text-xs font-mono ${
                            item.type === "FOLDER" 
                              ? "bg-amber-500/10 text-amber-500" 
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* Kolom Ukuran */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-macos-secondary">
                        {item.size ? `${(item.size / 1024).toFixed(1)} KB` : "—"}
                      </td>

                      {/* Kolom Aksi */}
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-macos-secondary hover:text-macos-red rounded-md hover:bg-macos-tertiary transition active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- MINI PREVIEW --- */}
      {excelDataPreview && excelDataPreview.length > 0 && !isFullscreenPreview && (
        <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-macos-separator">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-emerald-500" />
              <h3 className="text-lg font-semibold text-macos-primary">Excel Preview</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreenPreview(true)}
                className="flex items-center gap-1 text-xs text-macos-blue hover:bg-macos-blue/10 px-2.5 py-1 rounded border border-macos-blue/20 transition"
              >
                <Maximize2 size={14} /> Full Page
              </button>
              <button
                onClick={() => setExcelDataPreview(null)}
                className="text-xs text-macos-secondary hover:text-macos-red px-2 py-1 rounded bg-macos-tertiary border border-macos-separator transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DETAILED FULL PAGE PREVIEW MODAL --- */}
      {excelDataPreview && excelDataPreview.length > 0 && isFullscreenPreview && (
        <div className="fixed inset-0 bg-macos-base/95 backdrop-blur-md z-50 flex flex-col p-6 md:p-10 animate-in fade-in zoom-in-95 duration-150">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-macos-separator">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-macos-primary tracking-tight">Full-Screen Document Viewer</h2>
                <p className="text-xs text-macos-secondary mt-0.5">Total terdeteksi: <span className="font-mono text-macos-primary font-bold">{excelDataPreview.length}</span> baris data</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFullscreenPreview(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-macos-tertiary border border-macos-separator rounded-lg text-sm font-medium text-macos-primary hover:border-macos-blue/40 hover:text-macos-blue transition active:scale-95 shadow-sm"
              >
                Kembali ke FileMan
              </button>
              <button
                onClick={() => {
                  setExcelDataPreview(null);
                  setIsFullscreenPreview(false);
                }}
                className="p-2 bg-macos-red/10 text-macos-red hover:bg-macos-red hover:text-white rounded-lg transition active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-macos-separator rounded-xl bg-macos-popover shadow-2xl">
            <table className="w-full text-left text-sm border-collapse min-w-max">
              <thead>
                <tr className="bg-macos-tertiary sticky top-0 z-10 border-b border-macos-separator text-macos-secondary font-mono text-xs">
                  <th className="p-3 border-r border-macos-separator/50 bg-macos-tertiary text-center w-12">#</th>
                  {Object.keys(excelDataPreview[0]).map((key) => (
                    <th key={key} className="p-3 border-r border-macos-separator/50 last:border-0 font-bold uppercase tracking-wider bg-macos-tertiary">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-macos-separator/30">
                {excelDataPreview.map((row, index) => (
                  <tr key={index} className="hover:bg-macos-blue/5 transition-colors group">
                    <td className="p-3 text-center border-r border-macos-separator/30 font-mono text-xs text-macos-secondary bg-macos-tertiary/10 group-hover:bg-macos-blue/5">
                      {index + 1}
                    </td>
                    {Object.values(row).map((val: any, idx) => (
                      <td key={idx} className="p-3 text-macos-primary border-r border-macos-separator/30 last:border-0 max-w-[250px] truncate font-sans">
                        {val?.toString() || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-right text-xs text-macos-secondary font-mono">
            Mode: Fullscreen Sandbox Viewer v1.0 • SheetJS Engine
          </div>
        </div>
      )}

    </div>
  );
}