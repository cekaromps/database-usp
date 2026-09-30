"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function Viewer() {
  const file = useSearchParams().get("file");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadHref = file
    ? `/api/drive/file?filePath=${encodeURIComponent(file)}`
    : "";

  useEffect(() => {
    if (!file) return;
    let url: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(downloadHref);
        if (!res.ok) throw new Error("Failed to load PDF");
        const blob = await res.blob();
        if (cancelled) return;
        url = URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" }),
        );
        setBlobUrl(url);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, downloadHref]);

  if (!file) return <p className="p-10">No file specified.</p>;
  const name = file.split("/").pop() ?? "file.pdf";

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm hover:underline">
            ← Back
          </Link>
          <h1 className="font-semibold truncate">{name}</h1>
        </div>
        <a
          href={downloadHref}
          download={name}
          className="px-3 py-1 text-xs font-medium rounded-md border hover:bg-gray-50"
        >
          Download
        </a>
      </header>
      {error && <p className="p-10 text-red-600">{error}</p>}
      {!blobUrl && !error && <p className="p-10">Loading...</p>}
      {blobUrl && (
        <iframe src={blobUrl} title={name} className="flex-1 w-full" />
      )}
    </div>
  );
}

export default function PdfPage() {
  return (
    <Suspense fallback={<p className="p-10">Loading...</p>}>
      <Viewer />
    </Suspense>
  );
}
