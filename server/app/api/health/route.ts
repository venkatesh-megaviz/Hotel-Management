import { NextResponse } from "next/server";
import { withCors, corsPreflight } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  return withCors(request, NextResponse.json({ ok: true }));
}
