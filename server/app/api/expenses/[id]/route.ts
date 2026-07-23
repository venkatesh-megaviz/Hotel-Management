import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import Expense from "@/models/Expense";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  const { id } = await params;
  await connectToDatabase();
  await Expense.findOneAndDelete({ _id: id, restaurant: auth.restaurantId });

  return withCors(request, NextResponse.json({ ok: true }));
}
