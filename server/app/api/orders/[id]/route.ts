import { jsonResponse } from "@/lib/response";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import { orderUpdateSchema } from "@/lib/validation";
import Order from "@/models/Order";
import { serializeOrder } from "@/lib/serialize-resources";
import { notify } from "@/lib/notify";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  const { id } = await params;
  await connectToDatabase();
  const order = await Order.findOne({ _id: id, restaurant: auth.restaurantId });

  if (!order) {
    return withCors(request, jsonResponse({ error: "Order not found" }, 404));
  }

  return withCors(request, jsonResponse({ order: serializeOrder(order) }));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = orderUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(request, jsonResponse({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400));
    }

    await connectToDatabase();
    const order = await Order.findOneAndUpdate(
      { _id: id, restaurant: auth.restaurantId },
      { status: parsed.data.status },
      { new: true },
    );

    if (!order) {
      return withCors(request, jsonResponse({ error: "Order not found" }, 404));
    }

    if (parsed.data.status === "Refunded") {
      await notify({
        restaurantId: auth.restaurantId,
        title: `Refund Processed: #${order.billNo}`,
        message: `Refund of ₹${order.total.toFixed(0)} for bill #${order.billNo} has been recorded.`,
        category: "Payments",
        severity: "info",
      });
    }

    return withCors(request, jsonResponse({ order: serializeOrder(order) }));
  } catch (err) {
    console.error("Update order error:", err);
    return withCors(request, jsonResponse({ error: "Something went wrong" }, 500));
  }
}
