"use client"

import { loginAction } from "@/app/actions/auth"
import { useState, useTransition } from "react"
import Link from "next/link"

export default function SignInPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    // Gunakan startTransition agar tombol otomatis mengunci saat memproses data login
    startTransition(async () => {
      const errorMessage = await loginAction(formData)
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

      {/* KOTAK PANEL SIGN IN MACOS INTERFACE */}
      <div className="w-full max-w-[380px] bg-macos-popover border border-macos-separator p-8 rounded-2xl shadow-2xl relative z-10 animate-scale-up">
        
        {/* HEADER FORM UTAMA (LOGO BESAR & SEJAJAR DI TENGAH) */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/ups.png"
            alt="Logo PT. Utama Pasogit Sejahtera"
            className="h-16 w-auto object-contain brightness-110 mx-auto mb-4 select-none"
          />
          <h1 className="text-xl font-bold tracking-tight text-white">Masuk</h1>
        </div>

        {/* NOTIFIKASI ERROR JIKA KREDENSIAL SALAH */}
        {error && (
          <div className="mb-4 p-3 bg-macos-red/10 border border-macos-red/30 text-macos-red rounded-lg text-xs font-medium animate-fade-in flex items-center gap-2">
            ✕ {error}
          </div>
        )}

        {/* FORM LOGIN AUTENTIKASI */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-macos-secondary mb-1.5">Username</label>
            <input 
              name="username" 
              type="text" 
              required 
              autoComplete="off"
              disabled={isPending}
              placeholder="Masukkan username Anda..." 
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
              placeholder="Masukkan password..." 
              className="w-full bg-macos-tertiary border border-macos-separator text-macos-primary rounded-md p-2 text-sm focus:outline-none focus:border-macos-blue focus:ring-1 focus:ring-macos-blue transition disabled:opacity-50"
            />
          </div>

          {/* BUTTON CTA SUBMIT BLUE MACOS LOG IN */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full py-2.5 bg-macos-blue text-white rounded-md font-semibold text-sm hover:bg-opacity-90 active:scale-[0.99] transition shadow-lg shadow-macos-blue/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? "Sedang Masuk..." : "Masuk"}
            </button>
          </div>
        </form>

        {/* LINK NAVIGASI DAFTAR AKUN BARU */}
        <div className="mt-6 text-center border-t border-macos-separator/30 pt-4">
          <p className="text-xs text-macos-secondary font-medium">
            Belum terdaftar{" "}
            <Link href="/signup" className="text-macos-blue hover:underline font-semibold cursor-pointer">
              Buat Akun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
