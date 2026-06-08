import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROOT_STORAGE = path.resolve(process.env.LOCAL_DRIVE_STORAGE || './drive_storage');

if (!fs.existsSync(ROOT_STORAGE)) {
  fs.mkdirSync(ROOT_STORAGE, { recursive: true });
}

function getSafePath(relativePath: string | null): string {
  const safeSuffix = path.normalize(relativePath || '').replace(/^(\.\.(\/|\\|$))+/, '');
  const finalPath = path.join(ROOT_STORAGE, safeSuffix);
  
  if (!finalPath.startsWith(ROOT_STORAGE)) {
    throw new Error('Unauthorized path access');
  }
  return finalPath;
}

// GET: List files in a folder
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get('path') || '';
    const fullPath = getSafePath(targetPath);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Directory not found', currentPath: targetPath, items: [] }, { status: 404 });
    }

    const files = fs.readdirSync(fullPath, { withFileTypes: true });
    
    const items = files.map((file) => {
      const itemPath = path.join(fullPath, file.name);
      const stats = fs.statSync(itemPath);
      return {
        name: file.name,
        isDir: file.isDirectory(),
        size: file.isDirectory() ? 0 : stats.size,
        modifiedAt: stats.mtime,
      };
    });

    return NextResponse.json({ currentPath: targetPath, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, currentPath: '', items: [] }, { status: 400 });
  }
}

// POST: Create a new folder
export async function POST(request: NextRequest) {
  try {
    const { currentPath, folderName } = await request.json();
    if (!folderName) return NextResponse.json({ error: 'Folder name required' }, { status: 400 });

    const targetDir = getSafePath(path.join(currentPath || '', folderName));

    if (fs.existsSync(targetDir)) {
      return NextResponse.json({ error: 'Folder already exists' }, { status: 400 });
    }

    fs.mkdirSync(targetDir, { recursive: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}