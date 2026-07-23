import { NextResponse } from "next/server";
import { JWT_COOKIE_NAME } from "@/lib/jwt";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(JWT_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return withCors(request, response);
}
