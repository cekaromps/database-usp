import Link from "next/link";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import ItemList from "./EcomManager";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);
  const isLoggedIn = !!session?.userId;

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary font-sans antialiased flex flex-col relative overflow-hidden selection:bg-macos-blue/30 selection:text-white">
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-macos-separator/30 relative z-10">
        <div className="flex items-center gap-3 select-none">
          <img
            src="/ups.png"
            alt="Logo PT. Utama Pasogit Sejahtera"
            className="h-9 w-auto object-contain brightness-110"
          />
          <span className="text-md font-bold tracking-tight text-macos-primary">
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

      <main className="w-full max-w-7xl mx-auto flex flex-col items-center justify-start text-center px-6 pt-8 relative">
        <ItemList />
      </main>

      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-macos-separator/20 relative z-10 flex flex-col sm:flex-row items-center justify-between text-xs text-macos-secondary/60 font-medium">
        <p>© 2026 PT. Utama Pasogit Sejahtera.</p>
      </footer>
    </div>
  );
}
