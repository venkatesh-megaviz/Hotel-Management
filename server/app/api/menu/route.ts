import { jsonResponse } from "@/lib/response";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import { menuItemSchema } from "@/lib/validation";
import MenuItem from "@/models/MenuItem";
import { serializeMenuItem } from "@/lib/serialize-resources";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  await connectToDatabase();
  const items = await MenuItem.find({ restaurant: auth.restaurantId }).sort({ createdAt: -1 });

  return withCors(request, jsonResponse({ items: items.map(serializeMenuItem) }));
}

export async function POST(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  try {
    const body = await request.json();
    const parsed = menuItemSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(request, jsonResponse({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400));
    }

    await connectToDatabase();
    const item = await MenuItem.create({ ...parsed.data, restaurant: auth.restaurantId });

    return withCors(request, jsonResponse({ item: serializeMenuItem(item) }, 201));
  } catch (err) {
    console.error("Create menu item error:", err);
    return withCors(request, jsonResponse({ error: "Something went wrong" }, 500));
  }
}
