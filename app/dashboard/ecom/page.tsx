import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { EcomManager } from "./EcomManager";

export const metadata: Metadata = {
  title: "Ecom Items",
};

export const dynamic = "force-dynamic";

export default async function EcomPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-macos-base text-macos-primary p-10 font-sans antialiased">
      <EcomManager />
    </div>
  );
}
