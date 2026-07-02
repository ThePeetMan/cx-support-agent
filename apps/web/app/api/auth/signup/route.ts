import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    return NextResponse.json(data ?? { message: "Signup failed" }, { status: res.status });
  }

  const response = NextResponse.json({ user: data.user });
  if (data.token) {
    response.cookies.set("access_token", data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
  }
  return response;
}
