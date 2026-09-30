"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function Viewer() {
  const file = useSearchParams().get("file");

  if (!file) return <p className="p-10">No file specified.</p>;

  const src = `/api/drive/file?filePath=${encodeURIComponent(file)}&inline=1`;
  const name = file.split("/").pop();
  const backPath = file.split("/").slice(0, -1).join("/");

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
          href={src.replace("&inline=1", "")}
          download={name}
          className="px-3 py-1 text-xs font-medium rounded-md border hover:bg-gray-50"
        >
          Download
        </a>
      </header>
      <iframe src={src} title={name} className="flex-1 w-full" />
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
