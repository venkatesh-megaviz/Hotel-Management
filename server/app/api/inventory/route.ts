import { jsonResponse } from "@/lib/response";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import InventoryItem from "@/models/InventoryItem";
import { serializeInventoryItem } from "@/lib/serialize-resources";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  await connectToDatabase();
  const items = await InventoryItem.find({ restaurant: auth.restaurantId }).sort({ name: 1 });

  return withCors(request, jsonResponse({ items: items.map(serializeInventoryItem) }));
}
