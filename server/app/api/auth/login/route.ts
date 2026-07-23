import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User, { type UserDoc } from "@/models/User";
import Restaurant, { type RestaurantDoc } from "@/models/Restaurant";
import { loginSchema } from "@/lib/validation";
import { signToken, JWT_COOKIE_NAME } from "@/lib/jwt";
import { withCors, corsPreflight } from "@/lib/cors";
import { serializeUser, serializeRestaurant } from "@/lib/serialize";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return withCors(
        request,
        NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 }),
      );
    }

    const { email, password } = parsed.data;
    await connectToDatabase();

    const user = (await User.findOne({ email })) as UserDoc | null;
    if (!user) {
      return withCors(request, NextResponse.json({ error: "Invalid email or password" }, { status: 401 }));
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return withCors(request, NextResponse.json({ error: "Invalid email or password" }, { status: 401 }));
    }

    const restaurant = (await Restaurant.findById(user.restaurant)) as RestaurantDoc | null;

    const token = signToken({
      userId: user._id.toString(),
      restaurantId: restaurant?._id.toString() ?? "",
    });

    const response = NextResponse.json({
      user: serializeUser(user),
      restaurant: restaurant ? serializeRestaurant(restaurant) : null,
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
    console.error("Login error:", err);
    return withCors(request, NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }));
  }
}
