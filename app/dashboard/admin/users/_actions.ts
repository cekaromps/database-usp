"use server"

import { prisma } from "@/lib/prisma"
import { checkRole } from "@/lib/rbac"
import type { Role } from "@/lib/session"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

const ADMIN_PATH = "/dashboard/admin/users"

// User management is SUPERADMIN-only. The ADMIN branches below are kept so the
// helper stays correct if you ever re-open this area to ADMIN.

/**
 * Can `actor` manage `target`'s account (edit role, deactivate, delete, reset
 * password)? Rules:
 *  - SUPERADMIN can manage anyone except acting on their own account (to
 *    avoid accidental self-lockout).
 *  - ADMIN can only manage plain USER accounts.
 */
function canManage(actorRole: Role, actorId: string, target: { id: string; role: Role }) {
  if (target.id === actorId) return false
  if (actorRole === "SUPERADMIN") return true
  if (actorRole === "ADMIN") return target.role === "USER"
  return false
}

export async function createUserAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN"])
  if (!session) return { error: "Tidak diizinkan" }

  const username = (formData.get("username") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const requestedRole = (formData.get("role") as Role) || "USER"
  const groupIdRaw = (formData.get("groupId") as string) || ""

  if (!username || !password) return { error: "Username dan password wajib diisi" }
  if (password.length < 6) return { error: "Password minimal 6 karakter" }

  const role: Role = requestedRole === "ADMIN" || requestedRole === "SUPERADMIN" ? requestedRole : "USER"

  if (role !== "USER" && session.role !== "SUPERADMIN") {
    return { error: "Hanya superadmin yang boleh membuat akun admin/superadmin" }
  }

  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) return { error: "Username sudah dipakai" }

  // SUPERADMIN always has everything, so a group would be meaningless for them.
  let groupId: string | null = null
  if (groupIdRaw && role !== "SUPERADMIN") {
    const group = await prisma.accessGroup.findUnique({ where: { id: groupIdRaw } })
    if (!group) return { error: "Tipe akun tidak ditemukan" }
    groupId = group.id
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { username, password: hashedPassword, role, groupId },
  })

  revalidatePath(ADMIN_PATH)
  return { success: true }
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN"]) // only superadmin may change roles
  if (!session) return { error: "Hanya superadmin yang boleh mengubah role" }

  const userId = formData.get("userId") as string
  const newRole = formData.get("role") as Role

  if (!userId || !["SUPERADMIN", "ADMIN", "USER"].includes(newRole)) {
    return { error: "Data tidak valid" }
  }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return { error: "User tidak ditemukan" }
  if (!canManage(session.role, session.userId, target)) {
    return { error: "Tidak boleh mengubah akun ini" }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole, ...(newRole === "SUPERADMIN" ? { groupId: null } : {}) },
  })
  revalidatePath(ADMIN_PATH)
  return { success: true }
}

export async function toggleActiveAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN"])
  if (!session) return { error: "Tidak diizinkan" }

  const userId = formData.get("userId") as string
  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return { error: "User tidak ditemukan" }
  if (!canManage(session.role, session.userId, target)) {
    return { error: "Tidak boleh mengubah akun ini" }
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive: !target.isActive } })
  revalidatePath(ADMIN_PATH)
  return { success: true }
}

export async function resetPasswordAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN"])
  if (!session) return { error: "Tidak diizinkan" }

  const userId = formData.get("userId") as string
  const newPassword = formData.get("newPassword") as string
  if (!newPassword || newPassword.length < 6) return { error: "Password minimal 6 karakter" }

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return { error: "User tidak ditemukan" }
  if (!canManage(session.role, session.userId, target)) {
    return { error: "Tidak boleh mengubah akun ini" }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } })
  revalidatePath(ADMIN_PATH)
  return { success: true }
}

export async function deleteUserAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN"])
  if (!session) return { error: "Tidak diizinkan" }

  const userId = formData.get("userId") as string
  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return { error: "User tidak ditemukan" }
  if (!canManage(session.role, session.userId, target)) {
    return { error: "Tidak boleh menghapus akun ini" }
  }

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath(ADMIN_PATH)
  return { success: true }
}

export async function updateUserGroupAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN"])
  if (!session) return { error: "Hanya superadmin yang boleh mengubah tipe akun" }

  const userId = formData.get("userId") as string
  const groupIdRaw = (formData.get("groupId") as string) || ""

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return { error: "User tidak ditemukan" }
  if (target.role === "SUPERADMIN") return { error: "Superadmin selalu punya akses penuh" }

  let groupId: string | null = null
  if (groupIdRaw) {
    const group = await prisma.accessGroup.findUnique({ where: { id: groupIdRaw } })
    if (!group) return { error: "Tipe akun tidak ditemukan" }
    groupId = group.id
  }

  await prisma.user.update({ where: { id: userId }, data: { groupId } })
  revalidatePath(ADMIN_PATH)
  return { success: true }
}
