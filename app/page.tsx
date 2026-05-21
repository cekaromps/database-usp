import Link from "next/link";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);
  const isLoggedIn = !!session?.userId;

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary font-sans antialiased flex flex-col justify-between relative overflow-hidden selection:bg-macos-blue/30 selection:text-white">
      {/* BACKGROUND DECORATIVE GRADIENT GLOW */}
      <div className="absolute top-[-25%] left-[-10%] w-[700px] h-[700px] rounded-full bg-macos-blue/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[110px] pointer-events-none" />

      {/* NAVIGATION BAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-macos-separator/30 relative z-10">
        <div className="flex items-center gap-3 select-none">
          <img
            src="/ups.png"
            alt="Logo PT. Utama Pasogit Sejahtera"
            className="h-9 w-auto object-contain brightness-110"
          />
          {/* 🌟 FIX: Teks warna solid putih murni tanpa efek gradasi */}
          <span className="text-md font-bold tracking-tight text-white">
            Utama Pasogit Sejahtera
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-4 py-1.5 bg-macos-tertiary border border-macos-separator text-sm font-medium rounded-lg text-macos-primary hover:bg-macos-separator/50 transition-all"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <Link
              href="/signin"
              className="px-4 py-1.5 bg-macos-blue text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-all shadow-md shadow-macos-blue/10 cursor-pointer"
            >
              Masuk
            </Link>
          )}
        </div>
      </header>

      {/* HERO SECTION UTAMA
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto relative z-10 py-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-8 text-white uppercase">
          UTAMA PASOGIT SEJAHTERA
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="w-full sm:w-52 py-3 bg-macos-blue text-white rounded-xl font-bold text-sm hover:bg-opacity-95 active:scale-[0.99] transition shadow-xl shadow-macos-blue/20 flex items-center justify-center cursor-pointer"
            >
              Enter System Core
            </Link>
          ) : (
            <>
              <Link 
                href="/signin" 
                className="w-full sm:w-48 py-3 bg-macos-blue text-white rounded-xl font-bold text-sm hover:bg-opacity-95 active:scale-[0.99] transition shadow-xl shadow-macos-blue/20 flex items-center justify-center cursor-pointer"
              >
                Get Started
              </Link>
              <Link 
                href="/signup" 
                className="w-full sm:w-48 py-3 bg-macos-tertiary border border-macos-separator text-macos-primary rounded-xl font-bold text-sm hover:bg-macos-separator/40 active:scale-[0.99] transition flex items-center justify-center"
              >
                Register New User
              </Link>
            </>
          )}
        </div>
      </main>

      {/* BAR BAWAH FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-macos-separator/20 relative z-10 flex flex-col sm:flex-row items-center justify-between text-xs text-macos-secondary/60 font-medium">
        <p>© 2026 PT. Utama Pasogit Sejahtera.</p>
      </footer>
    </div>
  );
}
