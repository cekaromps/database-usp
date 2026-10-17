"use client"

import { useRef, useState, useTransition } from "react"
import { SECTIONS } from "@/lib/sections"
import { ASSIGNABLE_SECTION_KEYS } from "@/lib/section-routing"
import { createGroupAction, deleteGroupAction, updateGroupAction } from "../_group_actions"

export type GroupRow = { id: string; name: string; sections: string[]; userCount: number }

const inputCls =
  "w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition disabled:opacity-50"

function SectionCheckboxes({ defaultSections, disabled }: { defaultSections: string[]; disabled: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {ASSIGNABLE_SECTION_KEYS.map((key) => (
        <label key={key} className="flex items-center gap-2 text-sm text-macos-primary cursor-pointer">
          <input
            type="checkbox"
            name="sections"
            value={key}
            defaultChecked={defaultSections.includes(key)}
            disabled={disabled}
            className="accent-macos-blue"
          />
          {SECTIONS[key].label}
        </label>
      ))}
    </div>
  )
}

export function GroupsManager({ groups }: { groups: GroupRow[] }) {
  const createRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const run = (
    fn: (fd: FormData) => Promise<{ error?: string; success?: boolean } | undefined>,
    fd: FormData,
    onOk?: () => void,
    okText = "Tersimpan",
  ) => {
    setMessage(null)
    startTransition(async () => {
      const result = await fn(fd)
      if (result?.error) setMessage({ type: "error", text: result.error })
      else {
        setMessage({ type: "success", text: okText })
        onOk?.()
      }
    })
  }

  return (
    <div className="bg-macos-popover border border-macos-separator rounded-2xl p-6 shadow-xl space-y-5">
      <div>
        <h3 className="text-md font-semibold text-macos-primary">Tipe Akun</h3>
        <p className="text-xs text-macos-secondary mt-0.5">
          Buat tipe akun yang hanya bisa membuka section tertentu, lalu pilih tipe tersebut saat membuat/mengubah user.
          Akun tanpa tipe akun tetap punya akses ke semua section.
        </p>
      </div>

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

      <form
        ref={createRef}
        onSubmit={(e) => {
          e.preventDefault()
          run(createGroupAction, new FormData(e.currentTarget), () => createRef.current?.reset(), "Tipe akun dibuat")
        }}
        className="space-y-3 pb-5 border-b border-macos-separator"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">Nama tipe akun</label>
            <input name="name" required minLength={2} maxLength={50} disabled={isPending} placeholder="mis. Production & Design" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-macos-secondary mb-2">Section yang boleh dibuka</label>
            <SectionCheckboxes defaultSections={[]} disabled={isPending} />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-macos-blue text-white text-sm font-semibold rounded-md hover:bg-opacity-90 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Memproses..." : "Buat Tipe Akun"}
        </button>
      </form>

      {groups.length === 0 ? (
        <p className="text-xs text-macos-tertiary">Belum ada tipe akun.</p>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => (
            <li key={g.id} className="border border-macos-separator rounded-xl p-4">
              {editingId === g.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(updateGroupAction, new FormData(e.currentTarget), () => setEditingId(null))
                  }}
                  className="space-y-3"
                >
                  <input type="hidden" name="id" value={g.id} />
                  <input name="name" defaultValue={g.name} required minLength={2} maxLength={50} disabled={isPending} className={inputCls} />
                  <SectionCheckboxes defaultSections={g.sections} disabled={isPending} />
                  <div className="flex gap-2">
                    <button type="submit" disabled={isPending} className="px-3 py-1.5 text-xs bg-macos-blue text-white rounded-md disabled:opacity-50 cursor-pointer">
                      Simpan
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs rounded-md border border-macos-separator cursor-pointer">
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium text-macos-primary text-sm">
                      {g.name} <span className="text-[10px] text-macos-tertiary">({g.userCount} akun)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {g.sections.map((k) => (
                        <span key={k} className="px-2 py-0.5 rounded-full text-[11px] border bg-macos-blue/10 text-macos-blue border-macos-blue/30">
                          {SECTIONS[k as keyof typeof SECTIONS]?.label ?? k}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={isPending} onClick={() => setEditingId(g.id)} className="px-2.5 py-1 text-xs rounded-md border border-macos-separator hover:border-macos-blue/50 cursor-pointer transition disabled:opacity-30">
                      Edit
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => {
                        if (!window.confirm(`Hapus tipe akun "${g.name}"?`)) return
                        const fd = new FormData()
                        fd.set("id", g.id)
                        run(deleteGroupAction, fd, undefined, "Tipe akun dihapus")
                      }}
                      className="px-2.5 py-1 text-xs rounded-md border border-macos-red/30 text-macos-red hover:bg-macos-red/10 cursor-pointer transition disabled:opacity-30"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
