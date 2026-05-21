"use client"

import { signupAction } from "@/app/actions/auth"
import { useState, useTransition } from "react"
import Link from "next/link"

export default function SignUpPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    // Gunakan startTransition agar tombol otomatis terkunci saat memproses data
    startTransition(async () => {
      const errorMessage = await signupAction(formData)
      if (errorMessage) {
        setError(errorMessage)
      }
    })
  }

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary font-sans antialiased flex items-center justify-center p-6 relative overflow-hidden selection:bg-macos-blue/30 selection:text-white">
      {/* BACKGROUND GLOW DECORATIVE */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-macos-blue/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      {/* KOTAK PANEL REGISTRASI MACOS INTERFACE */}
      <div className="w-full max-w-[380px] bg-macos-popover border border-macos-separator p-8 rounded-2xl shadow-2xl relative z-10 animate-scale-up">
        {/* HEADER FORM (PERBAIKAN TATA LETAK SENTRAL TENTU) */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* 🌟 LOGO PERUSAHAAN: Ditambahkan mx-auto dan margin bawah agar lurus simetris di tengah */}
          <img
            src="/ups.png"
            alt="Logo PT. Utama Pasogit Sejahtera"
            className="h-16 w-auto object-contain brightness-110 mx-auto mb-4 select-none"
          />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Buat Akun
          </h1>
        </div>

        {/* NOTIFIKASI ERROR IF EXIST */}
        {error && (
          <div className="mb-4 p-3 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-xs font-medium animate-fade-in flex items-center gap-2">
            ✕ {error}
          </div>
        )}

        {/* INTERNAL AUTENTIKASI FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">Username</label>
            <input 
              name="username" 
              type="text" 
              required 
              autoComplete="off"
              disabled={isPending}
              placeholder="Masukkan username baru..." 
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              disabled={isPending}
              placeholder="Masukkan password rahasia..." 
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition disabled:opacity-50"
            />
          </div>

          {/* BUTTON CTA SUBMIT */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full py-2.5 bg-macos-blue text-white rounded-md font-semibold text-sm hover:bg-opacity-90 active:scale-[0.99] transition shadow-lg shadow-macos-blue/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? "Proses..." : "Buat Akun"}
            </button>
          </div>
        </form>

        {/* LINK NAVIGASI KANAN BAWAH */}
        <div className="mt-6 text-center border-t border-macos-separator/30 pt-4">
          <p className="text-xs text-macos-secondary font-medium">
            Sudah memiliki akun?{" "}
            <Link href="/signin" className="text-macos-blue hover:underline font-semibold cursor-pointer">
              Sign In Di Sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
