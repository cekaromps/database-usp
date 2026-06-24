"use client";
import { useState, useEffect, ChangeEvent } from "react";
export default function CloudDrive() {
    const [currentPath, setCurrentPath] = useState("");
    const [items, setItems] = useState<any[]>([]);
    const [newFolderName, setNewFolderName] = useState("");
    const [error, setError] = useState<string | null>(null);

    const loadFiles = async () => {
        try {
            const res = await fetch(
                `/api/drive?path=${encodeURIComponent(currentPath)}`,
            );
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setItems(data.items || []);
                setError(null);
            }
        } catch (err) {
            setError("Failed to fetch storage items.");
        }
    };

    useEffect(() => {
        loadFiles();
    }, [currentPath]);

    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await fetch(
                `/api/drive/file?path=${encodeURIComponent(currentPath)}&filename=${encodeURIComponent(file.name)}`,
                {
                    method: "PUT",
                    body: file,
                },
            );
            loadFiles();
        } catch (err) {
            setError("Upload failed.");
        }
    };

    const handleDelete = async (itemName) => {
        // macOS style confirm box
        if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;

        // Build the full path of the item relative to your upload root
        const fullPath = currentPath ? `${currentPath}/${itemName}` : itemName;

        try {
            const response = await fetch(
                `/api/drive/file?filePath=${encodeURIComponent(fullPath)}`,
                {
                    method: "DELETE",
                },
            );

            if (response.ok) {
                // Instantly remove the item from local state so the UI updates seamlessly
                setItems((prevItems) =>
                    prevItems.filter((item) => item.name !== itemName),
                );
            } else {
                const data = await response.json();
                alert(`Error: ${data.error || "Could not delete item"}`);
            }
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Network error. Failed to delete.");
        }
    };

    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await fetch("/api/drive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPath,
                    folderName: newFolderName,
                }),
            });
            setNewFolderName("");
            loadFiles();
        } catch (err) {
            setError("Failed to create folder.");
        }
    };

    // Helper to split and filter current path segments for breadcrumbs
    const pathSegments = currentPath.split("/").filter(Boolean);

    return (
        <div className="w-full min-h-screen bg-macos-base p-6 flex items-center justify-center font-sans antialiased selection:bg-macos-blue/30 selection:text-macos-primary">
            <div className="w-full h-full bg-macos-base rounded-xl border border-macos-separator shadow-2xl flex flex-col overflow-hidden">
                <div className="h-14 bg-macos-secondary border-b border-macos-separator flex items-center justify-between px-4 select-none">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-macos-primary max-w-md truncate">
                        <button
                            onClick={() => setCurrentPath("")}
                            type="button"
                            className="hover:text-macos-blue transition-colors px-1 rounded"
                        >
                            Root
                        </button>
                        {pathSegments.map((segment, index) => {
                            const buildPath = pathSegments
                                .slice(0, index + 1)
                                .join("/");
                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-1.5"
                                >
                                    <span className="text-macos-tertiary">
                                        ›
                                    </span>
                                    <button
                                        onClick={() =>
                                            setCurrentPath(buildPath)
                                        }
                                        className="hover:text-macos-blue transition-colors px-1 rounded truncate max-w-[120px]"
                                    >
                                        {segment}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-1/4 flex justify-end gap-3">
                        {error && (
                            <span className="text-xs text-macos-red bg-macos-red/10 px-2 py-1 rounded border border-macos-red/20 truncate max-w-[180px]">
                                {error}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 bg-macos-secondary border-r border-macos-separator p-3 flex flex-col">
                        {/* Bottom Actions inside Sidebar */}
                        {/* Native Hidden Input Style */}
                        {/* Native Hidden Input Style */}
                        <input
                            type="text"
                            placeholder="New folder..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="bg-transparent max-h-fit py-2 mb-3 rounded-md border border-macos-separator px-3 text-xs text-macos-primary placeholder-macos-tertiary outline-none flex-1 "
                        />
                        <label
                            onClick={createFolder}
                            className="mb-3 w-full bg-macos-tertiary border border-macos-separator text-macos-primary hover:bg-macos-popover text-xs font-medium py-2 px-3 rounded-md flex items-center justify-center gap-2 cursor-pointer transition"
                        >
                            <span>Create Folder</span>
                        </label>

                        <label className="w-full mb-3 bg-macos-tertiary border border-macos-separator text-macos-primary hover:bg-macos-popover text-xs font-medium py-2 px-3 rounded-md flex items-center justify-center gap-2 cursor-pointer transition">
                            <span>Upload</span>
                            <input
                                type="file"
                                onChange={handleUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Main File Management Zone */}
                    <div className="flex-1 flex flex-col bg-macos-base">
                        {/* Folder Context Control Sub-header */}
                        <div className="px-6 py-3 bg-macos-base border-b border-macos-separator flex items-center justify-between">
                            <span className="text-xs text-macos-secondary font-medium">
                                {items.length}{" "}
                                {items.length === 1 ? "item" : "items"}
                            </span>
                        </div>

                        {/* File Display Area */}
                        <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                            {items.length === 0 ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                                    <span className="text-4xl mb-2">📥</span>
                                    <p className="text-sm font-medium text-macos-secondary">
                                        Empty Directory
                                    </p>
                                    <p className="text-xs text-macos-tertiary mt-0.5">
                                        Drag files or use the upload button
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {items.map((item) => (
                                        <div
                                            key={item.name}
                                            className="group relative flex items-center justify-between p-2 px-3 rounded-lg border border-macos-tertiary hover:bg-macos-tertiary hover:border-macos-separator transition duration-150 select-none"
                                        >
                                            {item.isDir ? (
                                                /* Folder View Row */
                                                <>
                                                    <div
                                                        onClick={() =>
                                                            setCurrentPath(
                                                                currentPath
                                                                    ? `${currentPath}/${item.name}`
                                                                    : item.name,
                                                            )
                                                        }
                                                        className="flex-1 flex items-center cursor-pointer min-w-0"
                                                    >
                                                        <div className="text-xl mr-3 drop-shadow-md transform group-hover:scale-105 transition-transform duration-150">
                                                            📁
                                                        </div>
                                                        <p className="text-md font-medium text-macos-primary truncate pr-2">
                                                            {item.name}
                                                        </p>
                                                    </div>

                                                    {/* Folder Actions (Delete only) */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-4 shrink-0 flex items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.name,
                                                                )
                                                            }
                                                            className="text-[10px] text-macos-red font-semibold px-2 py-1 rounded hover:bg-red-500/10 active:scale-95 transition"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                /* File View Row */
                                                <>
                                                    <div className="flex-1 flex items-center min-w-0">
                                                        <div className="text-xl mr-3 drop-shadow-md transform group-hover:scale-105 transition-transform duration-150">
                                                            📄
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <p className="text-xs font-medium text-macos-primary truncate pr-2">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-[10px] text-macos-tertiary mt-0.5">
                                                                {(
                                                                    item.size /
                                                                    1024
                                                                ).toFixed(
                                                                    1,
                                                                )}{" "}
                                                                KB
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* File Actions - Download & Delete Aligned Right */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-4 shrink-0 flex items-center gap-2">
                                                        <a
                                                            href={`/api/drive/file?filePath=${encodeURIComponent((currentPath ? currentPath + "/" : "") + item.name)}`}
                                                            className="bg-macos-blue text-macos-primary text-[10px] font-semibold px-2 py-1 rounded shadow-sm hover:brightness-110 active:scale-95 transition inline-block"
                                                        >
                                                            Download
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.name,
                                                                )
                                                            }
                                                            className="text-[10px] text-macos-red font-semibold px-2 py-1 rounded hover:bg-red-500/10 active:scale-95 transition"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
