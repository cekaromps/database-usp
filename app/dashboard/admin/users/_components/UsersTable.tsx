"use client"

import { useState, useTransition } from "react"
import {
  deleteUserAction,
  resetPasswordAction,
  toggleActiveAction,
  updateUserRoleAction,
} from "../_actions"

type Role = "SUPERADMIN" | "ADMIN" | "USER"

export type UserRow = {
  id: string
  username: string
  role: Role
  isActive: boolean
  createdAt: string | Date
}

function canManage(viewerRole: Role, viewerId: string, target: UserRow) {
  if (target.id === viewerId) return false
  if (viewerRole === "SUPERADMIN") return true
  if (viewerRole === "ADMIN") return target.role === "USER"
  return false
}

const roleBadge: Record<Role, string> = {
  SUPERADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  ADMIN: "bg-macos-blue/10 text-macos-blue border-macos-blue/30",
  USER: "bg-macos-tertiary text-macos-secondary border-macos-separator",
}

export function UsersTable({
  users,
  viewerId,
  viewerRole,
}: {
  users: UserRow[]
  viewerId: string
  viewerRole: Role
}) {
  const [isPending, startTransition] = useTransition()
  const [errorFor, setErrorFor] = useState<{ id: string; text: string } | null>(null)

  const run = (fn: (fd: FormData) => Promise<{ error?: string } | undefined>, fd: FormData, id: string) => {
    setErrorFor(null)
    startTransition(async () => {
      const result = await fn(fd)
      if (result?.error) setErrorFor({ id, text: result.error })
    })
  }

  return (
    <div className="bg-macos-popover border border-macos-separator rounded-2xl shadow-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-macos-separator text-left text-xs text-macos-secondary uppercase tracking-wide">
            <th className="p-4">Username</th>
            <th className="p-4">Role</th>
            <th className="p-4">Status</th>
            <th className="p-4">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const editable = canManage(viewerRole, viewerId, u)
            return (
              <tr key={u.id} className="border-b border-macos-separator/50 last:border-0">
                <td className="p-4 font-medium text-macos-primary">
                  {u.username}
                  {u.id === viewerId && (
                    <span className="ml-2 text-[10px] text-macos-tertiary">(Anda)</span>
                  )}
                </td>
                <td className="p-4">
                  {viewerRole === "SUPERADMIN" && editable ? (
                    <select
                      defaultValue={u.role}
                      disabled={isPending}
                      onChange={(e) => {
                        const fd = new FormData()
                        fd.set("userId", u.id)
                        fd.set("role", e.target.value)
                        run(updateUserRoleAction, fd, u.id)
                      }}
                      className="bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-1.5 text-xs"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPERADMIN">Superadmin</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs border ${roleBadge[u.role]}`}>
                      {u.role}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs border ${
                      u.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-macos-red/10 text-macos-red border-macos-red/30"
                    }`}
                  >
                    {u.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      disabled={!editable || isPending}
                      onClick={() => {
                        const fd = new FormData()
                        fd.set("userId", u.id)
                        run(toggleActiveAction, fd, u.id)
                      }}
                      className="px-2.5 py-1 text-xs rounded-md border border-macos-separator hover:border-macos-blue/50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                    >
                      {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      disabled={!editable || isPending}
                      onClick={() => {
                        const newPassword = window.prompt(`Password baru untuk ${u.username} (min. 6 karakter):`)
                        if (!newPassword) return
                        const fd = new FormData()
                        fd.set("userId", u.id)
                        fd.set("newPassword", newPassword)
                        run(resetPasswordAction, fd, u.id)
                      }}
                      className="px-2.5 py-1 text-xs rounded-md border border-macos-separator hover:border-macos-blue/50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                    >
                      Reset Password
                    </button>
                    <button
                      disabled={!editable || isPending}
                      onClick={() => {
                        if (!window.confirm(`Hapus akun ${u.username}? Tindakan ini permanen.`)) return
                        const fd = new FormData()
                        fd.set("userId", u.id)
                        run(deleteUserAction, fd, u.id)
                      }}
                      className="px-2.5 py-1 text-xs rounded-md border border-macos-red/30 text-macos-red hover:bg-macos-red/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                    >
                      Hapus
                    </button>
                  </div>
                  {errorFor?.id === u.id && (
                    <p className="text-[10px] text-macos-red mt-1.5">{errorFor.text}</p>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
