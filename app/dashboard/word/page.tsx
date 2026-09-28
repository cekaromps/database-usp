import { requireUser } from "@/lib/rbac";
import { Metadata } from "next";
import Editor from "./Editor";

export const metadata: Metadata = { title: "Word" };
export const dynamic = "force-dynamic";

export default async function WordPage() {
  await requireUser();
  return <Editor />;
}
