import { jsonResponse } from "@/lib/response";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User, { type UserDoc } from "@/models/User";
import Restaurant, { type RestaurantDoc } from "@/models/Restaurant";
import { loginSchema } from "@/lib/validation";
import { signToken, JWT_COOKIE_NAME } from "@/lib/jwt";
import { withCors, corsPreflight } from "@/lib/cors";
import { authCookieOptions } from "@/lib/auth-cookie";
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
        jsonResponse({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400),
      );
    }

    const { email, password } = parsed.data;
    await connectToDatabase();

    const user = (await User.findOne({ email })) as UserDoc | null;
    if (!user) {
      return withCors(request, jsonResponse({ error: "Invalid email or password" }, 401));
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return withCors(request, jsonResponse({ error: "Invalid email or password" }, 401));
    }

    const restaurant = (await Restaurant.findById(user.restaurant)) as RestaurantDoc | null;

    const token = signToken({
      userId: user._id.toString(),
      restaurantId: restaurant?._id.toString() ?? "",
    });

    return withCors(
      request,
      jsonResponse(
        {
          user: serializeUser(user),
          restaurant: restaurant ? serializeRestaurant(restaurant) : null,
        },
        200,
        [{ name: JWT_COOKIE_NAME, value: token, options: authCookieOptions(30 * 24 * 60 * 60) }],
      ),
    );
  } catch (err) {
    console.error("Login error:", err);
    return withCors(request, jsonResponse({ error: "Something went wrong. Please try again." }, 500));
  }
}
