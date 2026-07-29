import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEcomCategory } from "@/lib/ecomCategories";
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

// GET /api/ecom?search=...&category=... — list all items, newest first
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();

    const items = await prisma.ecom.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(category && isValidEcomCategory(category) ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/ecom — create a new item.
// Accepts multipart/form-data: name, price, size, diameter?, quantity, image? (file)
// Also accepts application/json (without image) for simple mobile clients.
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let name: string | null = null;
    let priceRaw: string | null = null;
    let size: string | null = null;
    let diameterRaw: string | null = null;
    let quantityRaw: string | null = null;
    let imageUrl: string | null = null;
    let category: string | null = null;
    let subCategory: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = (formData.get("name") as string) ?? null;
      priceRaw = (formData.get("price") as string) ?? null;
      size = (formData.get("size") as string) ?? null;
      diameterRaw = (formData.get("diameter") as string) ?? null;
      quantityRaw = (formData.get("quantity") as string) ?? null;
      category = (formData.get("category") as string) ?? null;
      subCategory = (formData.get("subCategory") as string) ?? null;
      const image = formData.get("image") as File | null;
      imageUrl = await saveImageIfPresent(image);
    } else {
      const body = await request.json();
      name = body.name ?? null;
      priceRaw = body.price != null ? String(body.price) : null;
      size = body.size ?? null;
      diameterRaw = body.diameter != null ? String(body.diameter) : null;
      quantityRaw = body.quantity != null ? String(body.quantity) : null;
      imageUrl = body.imageUrl ?? null;
      category = body.category ?? null;
      subCategory = body.subCategory ?? null;
    }

    if (!name?.trim() || !priceRaw || !size?.trim() || !quantityRaw) {
      return NextResponse.json(
        { error: "name, price, size, and quantity are required." },
        { status: 400 },
      );
    }

    const price = Number(priceRaw);
    const quantity = parseInt(quantityRaw, 10);
    const diameter =
      diameterRaw && diameterRaw.trim() !== "" ? Number(diameterRaw) : null;

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "price must be a valid non-negative number." },
        { status: 400 },
      );
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: "quantity must be a valid number, at least 1." },
        { status: 400 },
      );
    }
    if (diameter !== null && Number.isNaN(diameter)) {
      return NextResponse.json(
        { error: "diameter must be a valid number." },
        { status: 400 },
      );
    }
    if (category && !isValidEcomCategory(category)) {
      return NextResponse.json(
        { error: "category must be one of MATERIALS, TOOLING, STANDARD_PART." },
        { status: 400 },
      );
    }

    const item = await prisma.ecom.create({
      data: {
        name: name.trim(),
        price,
        size: size.trim(),
        diameter,
        quantity,
        imageUrl,
        category: category ? (category as any) : null,
        subCategory: subCategory?.trim() || null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
