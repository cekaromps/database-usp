import { logoutAction } from "@/app/actions/auth";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { MenuCard } from "./_components/MenuCard";
import { menuItems } from "./_components/MenuItems";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "UPS Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      {/* HEADER SECTION */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-macos-separator">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard Central
          </h1>
          <p className="text-sm text-macos-secondary mt-0.5">
            Masuk sebagai:{" "}
            <span className="font-semibold text-macos-primary">
              {String(session?.username)}
            </span>
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="px-4 py-2 bg-macos-red text-white text-sm font-medium rounded-md hover:bg-opacity-80 transition cursor-pointer shadow-md"
          >
            Sign Out
          </button>
        </form>
      </header>

      <section className="space-y-6">
        <h3 className="text-lg font-semibold text-macos-primary tracking-tight">
          Aplikasi & Menu Sistem
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <MenuCard key={item.title} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
