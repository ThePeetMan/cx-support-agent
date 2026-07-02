import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { API_URL } from "./api";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { user: { id: string; email: string; name: string } };
  return data.user;
}

export async function requireSession() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}
