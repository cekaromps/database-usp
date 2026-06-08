'use client';
import { useState, useEffect, ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, FolderPlus, FileUp, FolderUp, Search, 
  Folder, File, Download, Trash2, FileSpreadsheet, X 
} from 'lucide-react';

export default function CloudDrive() {
  const [currentPath, setCurrentPath] = useState(''); 
  const [items, setItems] = useState<any[]>([]);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [excelDataPreview, setExcelDataPreview] = useState<any[] | null>(null);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const res = await fetch(`/api/drive?path=${encodeURIComponent(currentPath)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setItems(data.items || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch storage items.');
    }
  };

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsLoadingPreview(true);
      await fetch(`/api/drive/file?path=${encodeURIComponent(currentPath)}&filename=${encodeURIComponent(file.name)}`, {
        method: 'PUT',
        body: file,
      });
      loadFiles();
    } catch (err) {
      setError('Upload failed.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFolderUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;
    try {
      await fetch('/api/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPath, folderName: folderNameInput }),
      });
      setFolderNameInput('');
      loadFiles();
    } catch (err) {
      setError('Failed to create folder.');
    }
  };

  const handleOpenFilePreview = (filename: string) => {
    setIsFullscreenPreview(true);
  };

  const handleDownloadItem = (filename: string, isDir: boolean) => {
    const target = currentPath ? `${currentPath}/${filename}` : filename;
    window.location.href = `/api/drive/file?filePath=${encodeURIComponent(target)}`;
  };

  const handleDeleteItem = async (filename: string) => {};

  const logoutAction = () => {};

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-macos-base p-6 flex items-center justify-center font-sans antialiased text-[13px] text-macos-primary selection:bg-macos-blue/30">
      
      {/* Hidden Upload Triggers */}
      <input type="file" ref={fileInputRef} accept="*" onChange={handleFileUpload} className="hidden" />
      <input type="file" ref={folderInputRef} onChange={handleFolderUpload} className="hidden" {...({ webkitdirectory: "", directory: "", multiple: true } as any)} />

      {/* Main App Frame */}
      <div className="w-full max-w-5xl h-[600px] bg-macos-base rounded-xl border border-macos-separator shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Controls Bar */}
        <div className="h-12 bg-macos-secondary border-b border-macos-separator flex items-center justify-between px-4 select-none shrink-0">
          <div className="flex gap-1.5 w-1/4">
            <div className="w-3 h-3 rounded-full bg-macos-close border border-black/10" />
            <div className="w-3 h-3 rounded-full bg-macos-minimize border border-black/10" />
            <div className="w-3 h-3 rounded-full bg-macos-zoom border border-black/10" />
          </div>
          <div className="text-[11px] font-medium text-macos-secondary tracking-wide">
            Global FileMan Panel
          </div>
          <div className="w-1/4 flex justify-end">
            <form action={logoutAction}>
              <button type="submit" className="px-2.5 py-0.5 bg-macos-red text-white text-[11px] font-medium rounded hover:brightness-110 transition cursor-pointer">
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Path Nav & Breadcrumbs Subheader Bar */}
        <div className="h-10 bg-macos-base border-b border-macos-separator flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center justify-center w-6 h-6 bg-macos-tertiary border border-macos-separator rounded text-macos-secondary hover:text-macos-blue transition">
              <ArrowLeft size={13} />
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] text-macos-secondary font-medium">
              <button onClick={() => { setCurrentPath(""); setSearchQuery(""); }} className="hover:text-macos-blue transition">
                🌐 Root FileMan
              </button>
              {currentPath && (
                <>
                  <span className="text-macos-separator text-[10px]">/</span>
                  <button onClick={() => {
                    const segments = currentPath.split("/").filter(Boolean);
                    segments.pop();
                    setCurrentPath(segments.join("/"));
                  }} className="bg-macos-tertiary border border-macos-separator px-1.5 py-0.5 rounded text-[10px] text-macos-primary hover:text-macos-blue transition">
                    ← Back
                  </button>
                  <span className="font-mono text-macos-tertiary max-w-[150px] truncate">{currentPath}</span>
                </>
              )}
            </div>
          </div>

          <div className="relative w-52">
            <Search className="absolute left-2 top-2 text-macos-tertiary" size={12} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search directory..."
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary pl-7 pr-2 py-0.5 rounded text-[11px] focus:outline-none focus:border-macos-blue transition shadow-inner"
            />
          </div>
        </div>

        {/* Functional Two-Column View Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDE PANEL CONTROL BASE */}
          <div className="w-56 bg-macos-secondary border-r border-macos-separator p-4 flex flex-col gap-5 overflow-y-auto select-none shrink-0">
            <div>
              <h3 className="text-[10px] font-bold text-macos-tertiary tracking-wider uppercase flex items-center gap-1.5 mb-2">
                <FolderPlus size={13} className="text-macos-blue" />
                Create New Folder
              </h3>
              <form onSubmit={handleCreateFolder} className="space-y-1.5">
                <input
                  type="text"
                  required
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  placeholder="e.g., PDF Documents"
                  className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary placeholder-macos-tertiary rounded p-1.5 text-[11px] focus:outline-none focus:border-macos-blue transition shadow-inner"
                />
                <button type="submit" className="w-full py-1 bg-macos-blue text-white text-[11px] font-medium rounded hover:brightness-110 transition">
                  Create Folder
                </button>
              </form>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[10px] font-bold text-macos-tertiary tracking-wider uppercase flex items-center gap-1.5 mb-1">
                <FileUp size={13} className="text-macos-blue" />
                Upload Central
              </h3>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2.5 p-2 bg-macos-tertiary border border-macos-separator rounded text-left cursor-pointer hover:border-macos-blue hover:bg-macos-blue/5 transition group">
                <FileUp size={14} className="text-macos-blue shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-macos-primary truncate">Upload Apapun</span>
                  <span className="text-[9px] text-macos-secondary truncate">Direct to host disk</span>
                </div>
              </button>
              <button onClick={() => folderInputRef.current?.click()} className="w-full flex items-center gap-2.5 p-2 bg-macos-tertiary border border-macos-separator rounded text-left cursor-pointer hover:border-macos-blue hover:bg-macos-blue/5 transition group">
                <FolderUp size={14} className="text-macos-orange shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-macos-primary truncate">Upload Satu Folder</span>
                  <span className="text-[9px] text-macos-secondary truncate">Mirror structure</span>
                </div>
              </button>
            </div>
            <div className="mt-auto pt-3 border-t border-macos-separator/40 text-[9px] text-macos-tertiary font-mono">
              Linux FileSystem
            </div>
          </div>

          {/* MAIN DIRECTORY BODY - STACKED SIMPLE LIST VIEW ONLY */}
          <div className="flex-1 flex flex-col bg-macos-base overflow-hidden">
            {isLoadingPreview && (
              <div className="px-4 py-1 text-[10px] bg-macos-blue/10 text-macos-blue border-b border-macos-blue/20 animate-pulse select-none">
                Streaming storage blocks...
              </div>
            )}

            {/* List Element Wrapper Block */}
            <div className="flex-1 overflow-y-auto divide-y divide-macos-separator/10">
              {filteredItems.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-macos-secondary select-none">
                  <span className="text-lg mb-1">📁</span>
                  <p className="text-[11px]">Empty Folder</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div 
                    key={item.name}
                    className="w-full h-9 flex items-center justify-between px-4 bg-transparent hover:bg-macos-blue/10 transition-colors group select-none cursor-pointer"
                    onClick={() => {
                      if (item.isDir) {
                        setCurrentPath(currentPath ? `${currentPath}/${item.name}` : item.name);
                        setSearchQuery("");
                      } else {
                        handleOpenFilePreview(item.name);
                      }
                    }}
                  >
                    {/* Item Detail Stack Label */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {item.isDir ? (
                        <Folder size={15} className="text-macos-yellow shrink-0" />
                      ) : (
                        <File size={15} className="text-macos-secondary shrink-0" />
                      )}
                      <span className="truncate font-medium text-[12px] text-macos-primary group-hover:text-macos-blue transition-colors">
                        {item.name}
                      </span>
                    </div>

                    {/* Meta Values Segment */}
                    <div className="flex items-center gap-4 shrink-0 pl-4">
                      <span className="text-[10px] font-mono text-macos-secondary">
                        {item.isDir ? 'Folder' : `${(item.size / 1024).toFixed(1)} KB`}
                      </span>
                      
                      {/* Operational Triggers */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadItem(item.name, item.isDir);
                          }}
                          className="p-1 text-macos-secondary hover:text-macos-blue hover:bg-macos-tertiary rounded transition"
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.name);
                          }}
                          className="p-1 text-macos-secondary hover:text-macos-red hover:bg-macos-tertiary rounded transition"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- EXCEL DATA PREVIEW OVERLAY SYSTEM --- */}
      {excelDataPreview && excelDataPreview.length > 0 && isFullscreenPreview && (
        <div className="fixed inset-0 bg-macos-base/95 backdrop-blur-md z-50 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150 text-[11px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-macos-separator">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-macos-green/10 rounded text-macos-green border border-macos-green/20">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-macos-primary tracking-tight">Spreadsheet Document Viewer</h2>
                <p className="text-[10px] text-macos-secondary">
                  Total parsed records: <span className="font-mono text-macos-primary font-bold">{excelDataPreview.length}</span> data rows
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsFullscreenPreview(false)} className="px-2.5 py-1 bg-macos-tertiary border border-macos-separator rounded text-xs text-macos-primary hover:text-macos-blue transition shadow-sm">
                Kembali
              </button>
              <button onClick={() => { setExcelDataPreview(null); setIsFullscreenPreview(false); }} className="p-1 bg-macos-red/10 text-macos-red hover:bg-macos-red hover:text-white rounded transition border border-macos-red/20">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-macos-separator rounded bg-macos-popover shadow-2xl">
            <table className="w-full text-left text-[11px] border-collapse min-w-max">
              <thead>
                <tr className="bg-macos-tertiary sticky top-0 z-10 border-b border-macos-separator text-macos-secondary font-mono select-none h-6">
                  <th className="p-1.5 border-r border-macos-separator/30 bg-macos-tertiary text-center w-10">#</th>
                  {Object.keys(excelDataPreview[0]).map((key) => (
                    <th key={key} className="p-1.5 border-r border-macos-separator/30 last:border-0 font-bold uppercase bg-macos-tertiary text-macos-primary">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-macos-separator/10">
                {excelDataPreview.map((row, index) => (
                  <tr key={index} className="hover:bg-macos-blue/5 h-6">
                    <td className="p-1.5 text-center border-r border-macos-separator/20 font-mono text-macos-secondary bg-macos-secondary/20 select-none">
                      {index + 1}
                    </td>
                    {Object.values(row).map((val: any, idx) => (
                      <td key={idx} className="p-1.5 text-macos-primary border-r border-macos-separator/20 last:border-0 max-w-[200px] truncate">
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