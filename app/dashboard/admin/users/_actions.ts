"use server"

import { prisma } from "@/lib/prisma"
import { checkRole } from "@/lib/rbac"
import type { Role } from "@/lib/session"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

const ADMIN_PATH = "/dashboard/admin/users"

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
  const session = await checkRole(["SUPERADMIN", "ADMIN"])
  if (!session) return { error: "Tidak diizinkan" }

  const username = (formData.get("username") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const requestedRole = (formData.get("role") as Role) || "USER"

  if (!username || !password) return { error: "Username dan password wajib diisi" }
  if (password.length < 6) return { error: "Password minimal 6 karakter" }

  const role: Role = requestedRole === "ADMIN" || requestedRole === "SUPERADMIN" ? requestedRole : "USER"

  if (role !== "USER" && session.role !== "SUPERADMIN") {
    return { error: "Hanya superadmin yang boleh membuat akun admin/superadmin" }
  }

  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) return { error: "Username sudah dipakai" }

  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { username, password: hashedPassword, role },
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

  await prisma.user.update({ where: { id: userId }, data: { role: newRole } })
  revalidatePath(ADMIN_PATH)
  return { success: true }
}

export async function toggleActiveAction(formData: FormData) {
  const session = await checkRole(["SUPERADMIN", "ADMIN"])
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
  const session = await checkRole(["SUPERADMIN", "ADMIN"])
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
  const session = await checkRole(["SUPERADMIN", "ADMIN"])
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
