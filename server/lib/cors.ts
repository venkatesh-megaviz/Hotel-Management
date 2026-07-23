import { NextResponse } from "next/server";

const DEFAULT_ORIGINS = ["http://localhost:5173", "https://hotelite.netlify.app"];

function normalizeOrigin(value: string) {
  try {
    const url = new URL(value.trim());
    return `${url.protocol}//${url.host}`;
  } catch {
    return value.trim().replace(/\/+$/, "");
  }
}

function allowedOrigins() {
  const fromEnv = process.env.FRONTEND_URL?.split(",").map(normalizeOrigin).filter(Boolean) ?? [];
  return [...new Set([...fromEnv, ...DEFAULT_ORIGINS])];
}

export function corsHeaders(origin: string | null) {
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
  const allowed = allowedOrigins();
  const allowOrigin =
    normalizedOrigin && allowed.includes(normalizedOrigin)
      ? normalizedOrigin
      : normalizedOrigin && process.env.NODE_ENV !== "production"
        ? normalizedOrigin
        : allowed.find((entry) => entry.startsWith("https://")) ?? allowed[0];

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function withCors(request: Request, response: NextResponse) {
  const headers = corsHeaders(request.headers.get("origin"));
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export function corsPreflight(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}
