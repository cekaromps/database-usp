import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/rbac";
import { Metadata } from "next";
import { MenuCard } from "./_components/MenuCard";
import { menuItems, adminMenuItem } from "./_components/MenuItems";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "UPS Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireUser();
  const items =
    session.role === "ADMIN" || session.role === "SUPERADMIN"
      ? [...menuItems, adminMenuItem]
      : menuItems;

  return (
    <div className="min-h-screen bg-[url(/wallpaper.jpg)] bg-white/50 bg-blend-overlay bg-cover text-macos-primary p-10 font-sans antialiased flex flex-col">
      <header className="flex items-center justify-between mb-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            PT. UPS Dashboard
          </h1>
          <p className="text-sm text-macos-secondary mt-0.5">
            Masuk sebagai:{" "}
            <span className="font-semibold text-macos-primary">
              {session.username}
            </span>{" "}
            <span className="text-xs text-macos-tertiary">
              ({session.role})
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

      <section className="flex-1 max-h-128 w-full flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-5xl auto-rows-fr justify-items-center">
          {items.map((item) => (
            <MenuCard key={item.title} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
