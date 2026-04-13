import { redirect } from "next/navigation";

export default function TopPage() {
  redirect("/browse?orderBy=score&sort=desc");
}
