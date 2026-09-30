import { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Finance",
  description: "UPS Dashboard - Finance",
};

export const dynamic = "force-dynamic";

type Section = {
  code: string;
  title: string;
  icon: string;
  href?: string; // single destination
  children?: { title: string; href: string }[]; // or several
};

const sections: Section[] = [
  {
    code: "a",
    title: "Daftar Registrasi Customer",
    icon: "📋",
    href: "/dashboard/finance/registrasi-customer",
  },
  {
    code: "b",
    title: "Document PO Customer",
    icon: "📄",
    href: "/dashboard/finance/po-customer",
  },
  {
    code: "e",
    title: "Kwitansi",
    icon: "💵",
    href: "/dashboard/finance/kwitansi",
  },
  {
    code: "d",
    title: "Delivery Order (DO)",
    icon: "🚚",
    children: [
      { title: "Data PODO", href: "/dashboard/datapodo" }, // TODO
      { title: "DO Maker", href: "/dashboard/finance/domaker" },
    ],
  },
  {
    code: "c",
    title: "Quotation",
    icon: "🧾",
    children: [
      { title: "Quot Maker", href: "/dashboard/invoicemaker" }, // TODO: your real URL
      { title: "Quot List", href: "/dashboard/invoice" }, // TODO
    ],
  },
];

const card =
  "rounded-xl bg-white/60 backdrop-blur-md shadow-md p-5 transition hover:bg-white/80";

export default async function FinancePage() {
  const session = await requireUser();

  return (
    <div className="min-h-screen bg-[url(/wallpaper.jpg)] bg-white/50 bg-blend-overlay bg-cover text-macos-primary p-10 font-sans antialiased flex flex-col">
      <header className="flex items-center justify-between mb-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
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
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-white/60 backdrop-blur-md text-macos-primary text-sm font-medium rounded-md hover:bg-white/80 transition shadow-md"
        >
          ← Dashboard
        </Link>
      </header>

      <section className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {sections.map((s) =>
          s.href ? (
            <Link key={s.code} href={s.href} className={`${card} block`}>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h2 className="font-semibold">{s.title}</h2>
              <p className="text-xs text-macos-tertiary mt-1">Buka folder →</p>
            </Link>
          ) : (
            <div key={s.code} className={card}>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h2 className="font-semibold mb-3">{s.title}</h2>
              <ul className="space-y-2">
                {s.children?.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      className="block px-3 py-2 rounded-md bg-white/60 text-sm font-medium hover:bg-white/90 transition shadow-sm"
                    >
                      {c.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </section>
    </div>
  );
}
