import { NextResponse } from "next/server";

const DEFAULT_ORIGINS = ["http://localhost:5173"];

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
  const allowOrigin = normalizedOrigin && allowed.includes(normalizedOrigin) ? normalizedOrigin : allowed[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function withCors(request: Request, response: NextResponse) {
  const headers = corsHeaders(request.headers.get("origin"));
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export function corsPreflight(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}
