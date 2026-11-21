import Link from "next/link"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/rbac"
import { CreateUserForm } from "./_components/CreateUserForm"
import { UsersTable } from "./_components/UsersTable"
import { GroupsManager } from "./_components/GroupsManager"

export const metadata: Metadata = {
  title: "Manajemen User",
  description: "Kelola akun, role, dan status aktif user",
}

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await requireRole(["SUPERADMIN"])

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, groupId: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const groupRows = await prisma.accessGroup.findMany({
    select: { id: true, name: true, sections: true, _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  })
  const groups = groupRows.map((g) => ({ id: g.id, name: g.name, sections: g.sections, userCount: g._count.users }))

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
        <GroupsManager groups={groups} />
        <CreateUserForm canAssignAdmin groups={groups} />
        <UsersTable users={users} groups={groups} viewerId={session.userId} viewerRole={session.role} />
      </div>
    </div>
  )
}
