import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "ecom");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

async function saveImageIfPresent(image: File | null): Promise<string | null> {
  if (!image || typeof image === "string" || image.size === 0) return null;

  ensureUploadDir();

  const ext = path.extname(image.name) || "";
  const safeExt = /^\.[a-zA-Z0-9]+$/.test(ext) ? ext : "";
  const filename = `${crypto.randomUUID()}${safeExt}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  const arrayBuffer = await image.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  return `/uploads/ecom/${filename}`;
}

// GET /api/ecom/:id — fetch a single item
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = await prisma.ecom.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/ecom/:id — partially update an item (any subset of fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const contentType = request.headers.get("content-type") || "";

    const data: Record<string, any> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      if (formData.has("name")) data.name = (formData.get("name") as string).trim();
      if (formData.has("size")) data.size = (formData.get("size") as string).trim();
      if (formData.has("price")) data.price = Number(formData.get("price"));
      if (formData.has("quantity"))
        data.quantity = parseInt(formData.get("quantity") as string, 10);
      if (formData.has("diameter")) {
        const raw = formData.get("diameter") as string;
        data.diameter = raw.trim() === "" ? null : Number(raw);
      }

      const image = formData.get("image") as File | null;
      const newImageUrl = await saveImageIfPresent(image);
      if (newImageUrl) data.imageUrl = newImageUrl;
    } else {
      const body = await request.json();
      if (body.name !== undefined) data.name = String(body.name).trim();
      if (body.size !== undefined) data.size = String(body.size).trim();
      if (body.price !== undefined) data.price = Number(body.price);
      if (body.quantity !== undefined) data.quantity = parseInt(body.quantity, 10);
      if (body.diameter !== undefined)
        data.diameter = body.diameter === null || body.diameter === "" ? null : Number(body.diameter);
      if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    }

    const updated = await prisma.ecom.update({ where: { id }, data });
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/ecom/:id — remove an item (and its image file, if any)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.ecom.findUnique({ where: { id } });

    await prisma.ecom.delete({ where: { id } });

    if (existing?.imageUrl) {
      const filePath = path.join(process.cwd(), "public", existing.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
