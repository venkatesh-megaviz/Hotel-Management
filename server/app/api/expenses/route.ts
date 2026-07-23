import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import { expenseSchema } from "@/lib/validation";
import Expense from "@/models/Expense";
import { serializeExpense } from "@/lib/serialize-resources";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const query: Record<string, unknown> = { restaurant: auth.restaurantId };
  if (category && category !== "All") query.category = category;

  const expenses = await Expense.find(query).sort({ createdAt: -1 });

  return withCors(request, NextResponse.json({ expenses: expenses.map(serializeExpense) }));
}

export async function POST(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  try {
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(request, NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 }));
    }

    await connectToDatabase();

    const { createdAt, ...rest } = parsed.data;
    const customCreatedAt = createdAt ? new Date(createdAt) : undefined;

    const [expense] = await Expense.create(
      [
        {
          ...rest,
          hasBill: rest.hasBill || !!rest.billUrl,
          restaurant: auth.restaurantId,
          ...(customCreatedAt && !isNaN(customCreatedAt.getTime()) ? { createdAt: customCreatedAt } : {}),
        },
      ],
      customCreatedAt ? { timestamps: false } : undefined,
    );

    return withCors(request, NextResponse.json({ expense: serializeExpense(expense) }, { status: 201 }));
  } catch (err) {
    console.error("Create expense error:", err);
    return withCors(request, NextResponse.json({ error: "Something went wrong" }, { status: 500 }));
  }
}
