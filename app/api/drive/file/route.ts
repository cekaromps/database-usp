import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const ROOT_STORAGE = path.resolve(process.env.LOCAL_DRIVE_STORAGE || './drive_storage');

function getSafePath(relativePath: string | null): string {
  const safeSuffix = path.normalize(relativePath || '').replace(/^(\.\.(\/|\\|$))+/, '');
  const finalPath = path.join(ROOT_STORAGE, safeSuffix);
  if (!finalPath.startsWith(ROOT_STORAGE)) throw new Error('Unauthorized');
  return finalPath;
}

// GET: Download a file
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');
    const fullPath = getSafePath(filePath);

    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const fileName = path.basename(fullPath);

    return new Response(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT: Stream upload directly to Linux storage
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadFolder = searchParams.get('path') || '';
    const filename = searchParams.get('filename');

    if (!filename) return NextResponse.json({ error: 'Missing filename' }, { status: 400 });

    const targetFolder = getSafePath(uploadFolder);
    const targetFilePath = path.join(targetFolder, filename);

    fs.mkdirSync(targetFolder, { recursive: true });

    if (!request.body) return NextResponse.json({ error: 'Empty file body' }, { status: 400 });

    const destinationStream = fs.createWriteStream(targetFilePath);
    const nodeStream = Readable.fromWeb(request.body as any);
    
    await new Promise<void>((resolve, reject) => {
      nodeStream.pipe(destinationStream);
      nodeStream.on('end', resolve);
      nodeStream.on('error', reject);
    });

    return NextResponse.json({ success: true, message: 'Saved directly to disk!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Safely remove a file or directory from Linux storage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');

    if (!filePath) {
      return NextResponse.json({ error: 'Missing filePath parameter' }, { status: 400 });
    }

    // Pass it through your existing path traversal safety guard
    const fullPath = getSafePath(filePath);

    // Verify it exists before trying to run operations
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Target item not found' }, { status: 404 });
    }

    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      // Deletes folder and recursively wipes everything inside it (like rm -rf)
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      // Deletes a single file
      fs.unlinkSync(fullPath);
    }

    return NextResponse.json({ success: true, message: 'Item deleted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}