"use server"

import { prisma } from "@/lib/prisma"
import { checkRole } from "@/lib/rbac"
import { ASSIGNABLE_SECTION_KEYS, isAssignableSection } from "@/lib/section-routing"
import { revalidatePath } from "next/cache"

const ADMIN_PATH = "/dashboard/admin/users"

function parseGroupForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  // Only accept keys that really exist in lib/sections.ts; ignore anything else a client sends.
  const sections = Array.from(new Set(formData.getAll("sections").filter(isAssignableSection)))
  return { name, sections }
}

function validate({ name, sections }: { name?: string; sections: string[] }) {
  if (!name || name.length < 2 || name.length > 50) return "Nama tipe akun 2-50 karakter"
  if (sections.length === 0) return "Pilih minimal satu section"
  if (sections.length > ASSIGNABLE_SECTION_KEYS.length) return "Data tidak valid"
  return null
}

export async function createGroupAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN"])
  if (!session) return { error: "Hanya superadmin yang boleh membuat tipe akun" }

  const data = parseGroupForm(formData)
  const invalid = validate(data)
  if (invalid) return { error: invalid }

  const exists = await prisma.accessGroup.findUnique({ where: { name: data.name } })
  if (exists) return { error: "Nama tipe akun sudah dipakai" }

  await prisma.accessGroup.create({ data: { name: data.name, sections: data.sections } })
  revalidatePath(ADMIN_PATH)
  return { success: true }
}

export async function updateGroupAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN"])
  if (!session) return { error: "Hanya superadmin yang boleh mengubah tipe akun" }

  const id = formData.get("id") as string
  const data = parseGroupForm(formData)
  const invalid = validate(data)
  if (invalid) return { error: invalid }

  const clash = await prisma.accessGroup.findFirst({
    where: { name: data.name, NOT: { id } },
  })
  if (clash) return { error: "Nama tipe akun sudah dipakai" }

  try {
    await prisma.accessGroup.update({ where: { id }, data: { name: data.name, sections: data.sections } })
  } catch {
    return { error: "Tipe akun tidak ditemukan" }
  }
  revalidatePath(ADMIN_PATH)
  return { success: true }
}

export async function deleteGroupAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN"])
  if (!session) return { error: "Hanya superadmin yang boleh menghapus tipe akun" }

  const id = formData.get("id") as string
  const inUse = await prisma.user.count({ where: { groupId: id } })
  if (inUse > 0) {
    return { error: `Masih dipakai ${inUse} akun. Pindahkan akun tersebut dulu.` }
  }

  try {
    await prisma.accessGroup.delete({ where: { id } })
  } catch {
    return { error: "Tipe akun tidak ditemukan" }
  }
  revalidatePath(ADMIN_PATH)
  return { success: true }
}
