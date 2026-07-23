import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import { menuItemUpdateSchema } from "@/lib/validation";
import MenuItem from "@/models/MenuItem";
import { serializeMenuItem } from "@/lib/serialize-resources";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = menuItemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(request, NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 }));
    }

    await connectToDatabase();
    const item = await MenuItem.findOneAndUpdate({ _id: id, restaurant: auth.restaurantId }, parsed.data, { new: true });
    if (!item) {
      return withCors(request, NextResponse.json({ error: "Item not found" }, { status: 404 }));
    }

    return withCors(request, NextResponse.json({ item: serializeMenuItem(item) }));
  } catch (err) {
    console.error("Update menu item error:", err);
    return withCors(request, NextResponse.json({ error: "Something went wrong" }, { status: 500 }));
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  const { id } = await params;
  await connectToDatabase();
  await MenuItem.findOneAndDelete({ _id: id, restaurant: auth.restaurantId });

  return withCors(request, NextResponse.json({ ok: true }));
}
