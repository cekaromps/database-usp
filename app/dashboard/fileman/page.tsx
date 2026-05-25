"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Folder, FileSpreadsheet, Search, FolderPlus, 
  FileUp, Trash2, Maximize2, X, FolderUp, Download, 
  FileText, FileImage, FileCode, FileArchive, File 
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { createFolder, fileUpload } from "./helper";

import { logoutAction } from "@/app/actions/auth";

export default function GlobalFileManPage() {
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

  // --- HELPER: DETEKSI IKON & WARNA BERDASARKAN EKSTENSI ---
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "xlsx":
      case "xls":
      case "csv":
        return (
          <FileSpreadsheet size={18} className="text-emerald-500 shrink-0" />
        );
      case "pdf":
      case "doc":
      case "docx":
      case "txt":
        return <FileText size={18} className="text-blue-500 shrink-0" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <FileImage size={18} className="text-purple-500 shrink-0" />;
      case "zip":
      case "rar":
      case "7z":
        return <FileArchive size={18} className="text-amber-600 shrink-0" />;
      case "json":
      case "html":
      case "js":
      case "ts":
        return <FileCode size={18} className="text-orange-500 shrink-0" />;
      default:
        return <File size={18} className="text-gray-500 shrink-0" />;
    }
  };

  // --- 1. AMBIL DAFTAR DATA (FOLDER & FILE) ---
  const fetchItems = async () => {
    try {
      const url = searchQuery
        ? `/api/fileman?search=${encodeURIComponent(searchQuery)}`
        : `/api/fileman?folderId=${currentFolderId || ""}`;

      const res = await fetch(url);
      if (!res.ok) return;

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
    await createFolder(
      folderNameInput,
      currentFolderId,
      setFolderNameInput,
      fetchItems,
    );
  };

  // --- 3. AKSI MENGHAPUS ITEM ---
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

  // --- 4. AKSI UNGHAH FILE (MULTI FORMAT) ---

  const saveFileToServer = async (name: string, size: number, content: any) => {
    const res = await fetch("/api/fileman/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        size,
        parentId: currentFolderId,
        contentData: content,
      }),
    });
    if (res.ok) {
      await fetchItems();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    fileUpload(e, setIsLoadingPreview, setExcelDataPreview, saveFileToServer);
  };

  // Helper simpan ke database API

  // --- 5. AKSI UNGHAH MULTI-FILE DARI FOLDER ---
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoadingPreview(true);
    let successCount = 0;
    let targetFolderId = currentFolderId;

    try {
      const firstFile = files[0];
      const relativePath = (firstFile as any).webkitRelativePath;

      if (relativePath && relativePath.includes("/")) {
        const rootFolderName = relativePath.split("/")[0];
        const folderRes = await fetch("/api/fileman/folder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rootFolderName,
            parentId: currentFolderId,
          }),
        });

        if (folderRes.ok) {
          const folderData = await folderRes.json();
          if (folderData.success) targetFolderId = folderData.data.id;
        }
      }

      // Looping upload semua jenis file dalam folder
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (ext === "xlsx" || ext === "xls") {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: "array" });
          const jsonConverted = XLSX.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[0]],
          );

          const res = await fetch("/api/fileman/file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              parentId: targetFolderId,
              contentData: jsonConverted,
            }),
          });
          if (res.ok) successCount++;
        } else {
          // Konversi non-excel ke Base64 data url string
          const base64 = await new Promise((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result);
            r.readAsDataURL(file);
          });

          const res = await fetch("/api/fileman/file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              parentId: targetFolderId,
              contentData: { rawFile: base64, isGeneric: true },
            }),
          });
          if (res.ok) successCount++;
        }
      }
      alert(`Berhasil mengunggah folder: ${successCount} file diproses.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPreview(false);
      await fetchItems();
    }
  };

  // --- 6. PREVIEW FILE (KHUSUS EXCEL) ---
  const handleOpenFilePreview = async (fileId: string, fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      alert(
        "Pratinjau tabel saat ini hanya mendukung ekstensi .xlsx dan .xls. Untuk file lain silakan langsung klik tombol download.",
      );
      return;
    }

    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/fileman/file?id=${fileId}`);
      const resData = await res.json();
      if (resData.success && resData.data.contentData) {
        setExcelDataPreview(resData.data.contentData);
        setIsFullscreenPreview(true);
      }
    } catch (err) {
      alert("Gagal memuat pratinjau");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // --- 7. DOWNLOAD FILE ADAPTIF (EXCEL vs GENERIC FILE) ---
  const handleDownloadFile = async (fileId: string, fileName: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/fileman/file?id=${fileId}`);
      const resData = await res.json();

      if (resData.success && resData.data.contentData) {
        const payload = resData.data.contentData;

        // Jika data berupa file generik (Base64)
        if (payload.isGeneric && payload.rawFile) {
          const downloadLink = document.createElement("a");
          downloadLink.href = payload.rawFile;
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        // Jika data berupa struktur JSON spreadsheet (Excel asli)
        else {
          const worksheet = XLSX.utils.json_to_sheet(payload);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
          XLSX.writeFile(workbook, fileName);
        }
      }
    } catch (err) {
      alert("Gagal mengunduh berkas");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // --- 8. DOWNLOAD FOLDER JADI ZIP (MENDUKUNG SEMUA FORMAT) ---
  const handleDownloadFolder = async (folderId: string, folderName: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/fileman?folderId=${folderId}`);
      const resData = await res.json();

      if (!resData.success || !resData.data || resData.data.length === 0) {
        alert("Folder kosong.");
        return;
      }

      const zip = new JSZip();
      let hasFiles = false;

      for (const item of resData.data) {
        if (item.type === "FILE") {
          const fileRes = await fetch(`/api/fileman/file?id=${item.id}`);
          if (fileRes.ok) {
            const fileData = await fileRes.json();
            const payload = fileData.data.contentData;

            if (payload) {
              if (payload.isGeneric && payload.rawFile) {
                // Konversi Base64 string kembali ke bentuk Binary Blob untuk ZIP
                const base64Data = payload.rawFile.split(",")[1];
                zip.file(item.name, base64Data, { base64: true });
              } else {
                // Untuk data bertipe struktur tabel Excel
                const worksheet = XLSX.utils.json_to_sheet(payload);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
                const excelBuffer = XLSX.write(workbook, {
                  bookType: "xlsx",
                  type: "array",
                });
                zip.file(item.name, excelBuffer);
              }
              hasFiles = true;
            }
          }
        }
      }

      if (!hasFiles) {
        alert("Tidak ada berkas valid untuk di-ZIP.");
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `${folderName}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      alert("Gagal mengepak folder ZIP");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      {/* INPUT FILE & FOLDER (Accept diubah menjadi * agar menerima semua jenis file) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderUpload}
        className="hidden"
        {...({ webkitdirectory: "", directory: "", multiple: true } as any)}
      />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10 bg-macos-tertiary border border-macos-separator rounded-xl text-macos-secondary hover:text-macos-blue transition shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Global FileMan
            </h1>
            <p className="text-sm text-macos-secondary mt-0.5">
              Multi-format Cloud Drive Storage
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="px-4 py-2 bg-macos-red text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer"
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* LAYOUT GRID UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* PANEL KIRI */}
        <div className="bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl h-fit space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-macos-primary flex items-center gap-2">
              <FolderPlus size={18} className="text-macos-blue" />
              Create New Folder
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                required
                value={folderNameInput}
                onChange={(e) => setFolderNameInput(e.target.value)}
                placeholder="e.g., PDF Documents"
                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue transition"
              />
              <button
                type="submit"
                className="w-full py-2 bg-macos-blue text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition"
              >
                Create Folder
              </button>
            </form>
          </div>

          <div className="border-t border-macos-separator pt-4 space-y-3">
            <h3 className="text-lg font-semibold text-macos-primary flex items-center gap-2 mb-1">
              <FileUp size={18} className="text-blue-500" />
              Upload Central System
            </h3>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 bg-macos-tertiary border border-macos-separator rounded-lg text-left cursor-pointer hover:border-macos-blue hover:bg-macos-blue/5 transition group"
            >
              <FileUp
                size={20}
                className="text-blue-500 shrink-0 group-hover:scale-105 transition"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-macos-primary">
                  Upload Apapun (Any File)
                </span>
                <span className="text-[10px] text-macos-secondary">
                  Mendukung PDF, Word, Gambar, dll
                </span>
              </div>
            </button>

            <button
              onClick={() => folderInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 bg-macos-tertiary border border-macos-separator rounded-lg text-left cursor-pointer hover:border-macos-blue hover:bg-macos-blue/5 transition group"
            >
              <FolderUp
                size={20}
                className="text-amber-500 shrink-0 group-hover:scale-105 transition"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-macos-primary">
                  Upload Satu Folder
                </span>
                <span className="text-[10px] text-macos-secondary">
                  Impor seluruh struktur isi direktori
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* PANEL KANAN */}
        <div className="lg:col-span-2 bg-macos-popover border border-macos-separator p-6 rounded-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-macos-separator">
            <div className="flex items-center gap-2 text-sm text-macos-secondary font-medium">
              <button
                onClick={() => {
                  setCurrentFolderId(null);
                  setSearchQuery("");
                }}
                className="hover:text-macos-blue transition"
              >
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

            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-2.5 text-macos-secondary"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files/folders..."
                className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary pl-9 pr-4 py-1.5 rounded-md text-sm focus:outline-none focus:border-macos-blue transition"
              />
            </div>
          </div>

          {isLoadingPreview && (
            <div className="p-3 mb-4 text-xs text-center bg-macos-blue/10 text-macos-blue border border-macos-blue/20 rounded-lg animate-pulse">
              Sinkronisasi dan streaming enkripsi berkas dengan database cloud
              server...
            </div>
          )}

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
                    <th className="py-3 px-4 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-macos-separator/30 text-sm">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-macos-tertiary/40 transition"
                    >
                      <td className="py-3 px-4">
                        {item.type === "FOLDER" ? (
                          <button
                            onClick={() => {
                              setCurrentFolderId(item.id);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-2.5 text-macos-primary hover:text-macos-blue transition text-left"
                          >
                            <Folder
                              size={18}
                              className="text-amber-500 shrink-0"
                            />
                            <span className="truncate max-w-[180px] sm:max-w-xs">
                              {item.name}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleOpenFilePreview(item.id, item.name)
                            }
                            className="flex items-center gap-2.5 text-macos-primary hover:text-blue-500 transition text-left w-full group"
                          >
                            {getFileIcon(item.name)}
                            <span className="truncate max-w-[180px] sm:max-w-xs group-hover:underline">
                              {item.name}
                            </span>
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-mono ${item.type === "FOLDER" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}
                        >
                          {item.type === "FILE"
                            ? item.name.split(".").pop()?.toUpperCase()
                            : "FOLDER"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-xs text-macos-secondary">
                        {item.size
                          ? `${(item.size / 1024).toFixed(1)} KB`
                          : "—"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              item.type === "FOLDER"
                                ? handleDownloadFolder(item.id, item.name)
                                : handleDownloadFile(item.id, item.name)
                            }
                            className="p-1.5 text-macos-secondary hover:text-macos-blue rounded-md hover:bg-macos-tertiary transition"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-macos-secondary hover:text-macos-red rounded-md hover:bg-macos-tertiary transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- DETAILED FULL PAGE PREVIEW MODAL (KHUSUS EXCEL) --- */}
      {excelDataPreview &&
        excelDataPreview.length > 0 &&
        isFullscreenPreview && (
          <div className="fixed inset-0 bg-macos-base/95 backdrop-blur-md z-50 flex flex-col p-6 md:p-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-macos-separator">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-macos-primary tracking-tight">
                    Spreadsheet Document Viewer
                  </h2>
                  <p className="text-xs text-macos-secondary mt-0.5">
                    Total terdeteksi:{" "}
                    <span className="font-mono text-macos-primary font-bold">
                      {excelDataPreview.length}
                    </span>{" "}
                    baris data
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFullscreenPreview(false)}
                  className="px-4 py-2 bg-macos-tertiary border border-macos-separator rounded-lg text-sm text-macos-primary hover:text-macos-blue transition"
                >
                  Kembali
                </button>
                <button
                  onClick={() => {
                    setExcelDataPreview(null);
                    setIsFullscreenPreview(false);
                  }}
                  className="p-2 bg-macos-red/10 text-macos-red hover:bg-macos-red hover:text-white rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto border border-macos-separator rounded-xl bg-macos-popover shadow-2xl">
              <table className="w-full text-left text-sm border-collapse min-w-max">
                <thead>
                  <tr className="bg-macos-tertiary sticky top-0 z-10 border-b border-macos-separator text-macos-secondary font-mono text-xs">
                    <th className="p-3 border-r border-macos-separator/50 bg-macos-tertiary text-center w-12">
                      #
                    </th>
                    {Object.keys(excelDataPreview[0]).map((key) => (
                      <th
                        key={key}
                        className="p-3 border-r border-macos-separator/50 last:border-0 font-bold uppercase bg-macos-tertiary"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-macos-separator/30">
                  {excelDataPreview.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-macos-blue/5 transition-colors"
                    >
                      <td className="p-3 text-center border-r border-macos-separator/30 font-mono text-xs text-macos-secondary bg-macos-tertiary/10">
                        {index + 1}
                      </td>
                      {Object.values(row).map((val: any, idx) => (
                        <td
                          key={idx}
                          className="p-3 text-macos-primary border-r border-macos-separator/30 last:border-0 max-w-[250px] truncate"
                        >
                          {val?.toString() || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}