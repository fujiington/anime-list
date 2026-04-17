import { cookies } from "next/headers";

export type SiteMode = "anime" | "manga";

export async function getSiteMode(): Promise<SiteMode> {
  const cookieStore = await cookies();
  const val = cookieStore.get("siteMode")?.value;
  return val === "manga" ? "manga" : "anime";
}
