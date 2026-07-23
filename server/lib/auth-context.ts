import { NextResponse } from "next/server";
import { verifyToken, JWT_COOKIE_NAME } from "@/lib/jwt";
import { withCors } from "@/lib/cors";

export function getAuthContext(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${JWT_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.restaurantId) return null;

  return payload;
}

export function unauthorized(request: Request) {
  return withCors(request, NextResponse.json({ error: "Not authenticated" }, { status: 401 }));
}
