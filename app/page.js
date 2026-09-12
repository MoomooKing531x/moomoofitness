import { redirect } from "next/navigation";
import { getUserIdFromCookies } from "../lib/auth";

export default function Home() {
  const userId = getUserIdFromCookies();
  redirect(userId ? "/dashboard" : "/login");
}
