"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Item = { name: string; isDir: boolean; size: number; modifiedAt: string };

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export default function FolderBrowser({
    root,
    username,
    role,
}: {
    root: string;
    username: string;
    role: string;
}) {
    const [subPath, setSubPath] = useState<string[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentPath = [root, ...subPath].join("/");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/drive?path=${encodeURIComponent(currentPath)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load folder");
            const sorted = [...data.items].sort((a: Item, b: Item) =>
                a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1
            );
            setItems(sorted);
        } catch (e: any) {
            setError(e.message);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [currentPath]);

    useEffect(() => {
        load();
    }, [load]);


    const openFolder = (name: string) => setSubPath((p) => [...p, name]);
    const goToCrumb = (index: number) => setSubPath((p) => p.slice(0, index));

    const createFolder = async () => {
        const folderName = prompt("Folder name?")?.trim();
        if (!folderName) return;
        setBusy(true);
        try {
            const res = await fetch("/api/drive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPath, folderName }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            await load();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setBusy(false);
        }
    };

    const uploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        setBusy(true);
        try {
            for (const file of files) {
                const res = await fetch(
                    `/api/drive/file?path=${encodeURIComponent(currentPath)}&filename=${encodeURIComponent(file.name)}`,
                    { method: "PUT", body: file }
                );
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || `Upload failed: ${file.name}`);
                }
            }
            await load();
        } catch (err: any) {
            alert(err.message);
        } finally {
            e.target.value = "";
            setBusy(false);
        }
    };

    const deleteItem = async (item: Item) => {
        const msg = item.isDir
            ? `Delete folder "${item.name}" and EVERYTHING inside it?`
            : `Delete "${item.name}"?`;
        if (!confirm(msg)) return;
        setBusy(true);
        try {
            const res = await fetch(
                `/api/drive/file?filePath=${encodeURIComponent(`${currentPath}/${item.name}`)}`,
                { method: "DELETE" }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            await load();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setBusy(false);
        }
    };

    const downloadUrl = (name: string) =>
        `/api/drive/file?filePath=${encodeURIComponent(`${currentPath}/${name}`)}`;

    // ---------- UI ----------

    return (
        <div className="min-h-screen bg-[url(/wallpaper.jpg)] bg-white/50 bg-blend-overlay bg-cover text-macos-primary p-10 font-sans antialiased flex flex-col">
            <header className="flex items-center justify-between mb-8 pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{root}</h1>
                    <p className="text-sm text-macos-secondary mt-0.5">
                        Masuk sebagai:{" "}
                        <span className="font-semibold text-macos-primary">{username}</span>{" "}
                        <span className="text-xs text-macos-tertiary">({role})</span>
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-white/60 backdrop-blur-md text-macos-primary text-sm font-medium rounded-md hover:bg-white/80 transition shadow-md"
                >
                    ← Dashboard
                </Link>
            </header>

            <section className="w-full max-w-5xl mx-auto">
                {/* Breadcrumbs */}
                <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
                    <button
                        onClick={() => goToCrumb(0)}
                        className="font-semibold hover:underline cursor-pointer"
                    >
                        {root}
                    </button>
                    {subPath.map((name, i) => (
                        <span key={i} className="flex items-center gap-1">
                            <span className="text-macos-tertiary">/</span>
                            <button
                                onClick={() => goToCrumb(i + 1)}
                                className="font-semibold hover:underline cursor-pointer"
                            >
                                {name}
                            </button>
                        </span>
                    ))}
                </nav>

                {/* Toolbar */}
                <div className="mb-4 flex items-center gap-3">
                    <button
                        onClick={createFolder}
                        disabled={busy}
                        className="px-4 py-2 bg-white/60 backdrop-blur-md text-macos-primary text-sm font-medium rounded-md hover:bg-white/80 transition cursor-pointer shadow-md disabled:opacity-50"
                    >
                        + New folder
                    </button>
                    <label className="px-4 py-2 bg-macos-primary text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer shadow-md">
                        Upload files
                        <input
                            type="file"
                            multiple
                            onChange={uploadFiles}
                            disabled={busy}
                            className="hidden"
                        />
                    </label>
                    {busy && <span className="text-sm text-macos-secondary">Working...</span>}
                </div>

                {/* Content */}
                {loading && <p className="text-macos-secondary">Loading...</p>}
                {error && <p className="text-macos-red">{error}</p>}
                {!loading && !error && items.length === 0 && (
                    <p className="text-macos-secondary">This folder is empty.</p>
                )}

                {items.length > 0 && (
                    <ul className="divide-y divide-white/40 rounded-xl bg-white/60 backdrop-blur-md shadow-md overflow-hidden">
                        {items.map((item) => (
                            <li
                                key={item.name}
                                className="flex items-center justify-between px-4 py-3 hover:bg-white/50 transition"
                            >
                                {item.isDir ? (
                                    <button
                                        onClick={() => openFolder(item.name)}
                                        className="font-medium cursor-pointer hover:underline"
                                    >
                                        📁 {item.name}
                                    </button>
                                ) : (
                                    <a href={downloadUrl(item.name)} className="font-medium hover:underline">
                                        📄 {item.name}
                                    </a>
                                )}

                                <div className="flex items-center gap-4 text-sm text-macos-secondary">
                                    {!item.isDir && <span>{formatSize(item.size)}</span>}
                                    <span className="text-macos-tertiary">
                                        {new Date(item.modifiedAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => deleteItem(item)}
                                        className="px-3 py-1 bg-macos-red text-white text-xs font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer shadow-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}