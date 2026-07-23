import { jsonResponse } from "@/lib/response";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import Notification from "@/models/Notification";
import { serializeNotification } from "@/lib/serialize-resources";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  await connectToDatabase();
  const notifications = await Notification.find({ restaurant: auth.restaurantId }).sort({ createdAt: -1 }).limit(50);

  return withCors(request, jsonResponse({ notifications: notifications.map(serializeNotification) }));
}

export async function DELETE(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  await connectToDatabase();
  await Notification.deleteMany({ restaurant: auth.restaurantId });

  return withCors(request, jsonResponse({ ok: true }));
}
