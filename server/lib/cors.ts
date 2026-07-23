import { NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";

export function corsHeaders(origin: string | null) {
  const allowOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
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
