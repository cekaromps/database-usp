import Link from "next/link"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/rbac"
import { CreateUserForm } from "./_components/CreateUserForm"
import { UsersTable } from "./_components/UsersTable"

export const metadata: Metadata = {
  title: "Manajemen User",
  description: "Kelola akun, role, dan status aktif user",
}

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await requireRole(["SUPERADMIN", "ADMIN"])

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-sm text-macos-secondary mt-0.5">
            Masuk sebagai <span className="font-semibold">{session.username}</span> (
            {session.role})
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-macos-tertiary text-macos-primary text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer border border-macos-separator"
        >
          ← Kembali ke Dashboard
        </Link>
      </header>

      <div className="space-y-6">
        <CreateUserForm canAssignAdmin={session.role === "SUPERADMIN"} />
        <UsersTable users={users} viewerId={session.userId} viewerRole={session.role} />
      </div>

      {session.role === "ADMIN" && (
        <p className="text-xs text-macos-tertiary mt-6">
          Sebagai admin, Anda hanya bisa mengelola akun dengan role User. Perubahan role atau
          pengelolaan akun admin/superadmin lain hanya bisa dilakukan oleh superadmin.
        </p>
      )}
    </div>
  )
}
