"use client"

import { useRef, useState, useTransition } from "react"
import { createUserAction } from "../_actions"

export function CreateUserForm({ canAssignAdmin }: { canAssignAdmin: boolean }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createUserAction(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: "Akun berhasil dibuat" })
        formRef.current?.reset()
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-macos-popover border border-macos-separator rounded-2xl p-6 shadow-xl space-y-4"
    >
      <h3 className="text-md font-semibold text-macos-primary">Tambah Akun Baru</h3>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium ${
            message.type === "error"
              ? "bg-macos-red/10 border border-macos-red/30 text-macos-red"
              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-macos-secondary mb-1.5">Username</label>
          <input
            name="username"
            type="text"
            required
            disabled={isPending}
            placeholder="username"
            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-macos-secondary mb-1.5">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            disabled={isPending}
            placeholder="min. 6 karakter"
            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-macos-secondary mb-1.5">Role</label>
          <select
            name="role"
            disabled={isPending || !canAssignAdmin}
            defaultValue="USER"
            className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition disabled:opacity-50"
          >
            <option value="USER">User</option>
            {canAssignAdmin && <option value="ADMIN">Admin</option>}
            {canAssignAdmin && <option value="SUPERADMIN">Superadmin</option>}
          </select>
          {!canAssignAdmin && (
            <p className="text-[10px] text-macos-tertiary mt-1">
              Hanya superadmin yang bisa membuat akun admin.
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-macos-blue text-white text-sm font-semibold rounded-md hover:bg-opacity-90 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "Memproses..." : "Buat Akun"}
      </button>
    </form>
  )
}
