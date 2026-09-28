"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "superdoc/style.css";

// SuperDoc is browser-only, so it is imported inside handlers (never at module
// top level) to keep server rendering safe.
type SuperDocInstance = import("superdoc").SuperDoc;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function Editor() {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<SuperDocInstance | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mountId = useRef(0);

  const [hasDoc, setHasDoc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("dokumen.docx");
  const [message, setMessage] = useState("");

  const teardown = useCallback(() => {
    editorRef.current?.destroy();
    editorRef.current = null;
    // Clear leftovers so a re-open starts from an empty container.
    if (pageRef.current) pageRef.current.innerHTML = "";
    if (toolbarRef.current) toolbarRef.current.innerHTML = "";
  }, []);

  // Destroy the editor when leaving the page (also covers dev double-mount).
  useEffect(() => {
    return () => {
      mountId.current++;
      teardown();
    };
  }, [teardown]);

  const openFile = useCallback(
    async (file: File) => {
      if (!/\.docx$/i.test(file.name)) {
        setMessage(
          "Hanya file .docx yang didukung. Simpan file .doc lama sebagai .docx dulu.",
        );
        return;
      }
      if (!pageRef.current || !toolbarRef.current) return;

      const myId = ++mountId.current;
      setBusy(true);
      setMessage("");
      try {
        const { SuperDoc } = await import("superdoc");
        if (myId !== mountId.current || !pageRef.current) return;

        teardown();
        const editor = new SuperDoc({
          selector: pageRef.current,
          document: file,
          documentMode: "editing",
          ui: { toolbar: { container: toolbarRef.current } },
          onReady: () => setBusy(false),
          onException: (e: unknown) => {
            console.error(e);
            setMessage("Terjadi kesalahan pada editor. Coba buka ulang file.");
            setBusy(false);
          },
        });
        editorRef.current = editor;
        setFileName(file.name);
        setHasDoc(true);
      } catch (err) {
        console.error(err);
        setMessage("File tidak bisa dibuka. Pastikan file .docx valid.");
        setBusy(false);
      }
    },
    [teardown],
  );

  const download = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setBusy(true);
    setMessage("");
    try {
      await editor.export({
        exportType: ["docx"],
        exportedName: fileName.replace(/\.docx$/i, ""),
        triggerDownload: true,
      });
    } catch (err) {
      console.error(err);
      setMessage("Gagal mengekspor file Word.");
    } finally {
      setBusy(false);
    }
  }, [fileName]);

  const btn =
    "px-3 py-1.5 text-sm rounded-md border border-macos-separator bg-macos-popover hover:border-macos-blue/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="h-screen flex flex-col bg-macos-base text-macos-primary font-sans antialiased">
      <header className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-macos-separator">
        <h1 className="text-xl font-bold tracking-tight mr-2">Word Editor</h1>
        <input
          ref={fileRef}
          type="file"
          accept={`.docx,${DOCX_MIME}`}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) openFile(f);
            e.target.value = "";
          }}
        />
        <button
          className={btn}
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Buka file
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded-md bg-macos-blue text-white font-medium hover:bg-opacity-80 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!hasDoc || busy}
          onClick={download}
        >
          Unduh .docx
        </button>
        {hasDoc && (
          <span className="text-sm text-macos-secondary">{fileName}</span>
        )}
        {busy && (
          <span className="text-sm text-macos-secondary">Memproses…</span>
        )}
        {message && <span className="text-sm text-macos-red">{message}</span>}
      </header>

      {/* SuperDoc renders its formatting toolbar here */}
      <div ref={toolbarRef} className="border-b border-macos-separator" />

      <div className="relative flex-1 min-h-0 overflow-auto">
        <div ref={pageRef} />
        {!hasDoc && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-macos-secondary">
            Klik “Buka file” untuk mengedit dokumen Word (.docx).
          </div>
        )}
      </div>
    </div>
  );
}
