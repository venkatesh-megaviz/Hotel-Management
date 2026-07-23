import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User, { type UserDoc } from "@/models/User";
import Restaurant, { type RestaurantDoc } from "@/models/Restaurant";
import { registerSchema } from "@/lib/validation";
import { signToken, JWT_COOKIE_NAME } from "@/lib/jwt";
import { withCors, corsPreflight } from "@/lib/cors";
import { serializeUser, serializeRestaurant } from "@/lib/serialize";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return withCors(
        request,
        NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 }),
      );
    }

    const data = parsed.data;
    await connectToDatabase();

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return withCors(request, NextResponse.json({ error: "An account with this email already exists" }, { status: 409 }));
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const user = (await User.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
    })) as unknown as UserDoc;

    const restaurant = (await Restaurant.create({
      name: data.restaurantName,
      businessType: data.businessType,
      city: data.city,
      phone: data.phone,
      gstin: data.gstin,
      owner: user._id,
      plan: data.plan,
      billingCycle: data.billingCycle,
      trialEndsAt,
      ownerName: data.fullName,
      email: data.email,
    })) as unknown as RestaurantDoc;

    user.restaurant = restaurant._id;
    await User.findByIdAndUpdate(user._id, { restaurant: restaurant._id });

    const token = signToken({ userId: user._id.toString(), restaurantId: restaurant._id.toString() });

    const response = NextResponse.json({
      user: serializeUser(user),
      restaurant: serializeRestaurant(restaurant),
    });

    response.cookies.set(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return withCors(request, response);
  } catch (err) {
    console.error("Register error:", err);
    return withCors(request, NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }));
  }
}
