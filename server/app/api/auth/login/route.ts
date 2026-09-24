import { jsonResponse } from "@/lib/response";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User, { type UserDoc } from "@/models/User";
import Restaurant, { type RestaurantDoc } from "@/models/Restaurant";
import { signToken, JWT_COOKIE_NAME } from "@/lib/jwt";
import { withCors, corsPreflight } from "@/lib/cors";
import { authCookieOptions } from "@/lib/auth-cookie";
import { serializeUser, serializeRestaurant } from "@/lib/serialize";
import { ensureDemoAccount } from "@/lib/ensure-demo-account";
import { SUPER_ADMIN_EMAIL } from "@/lib/super-admin";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

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

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;
    await connectToDatabase();

    if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return withCors(
        request,
        jsonResponse(
          { error: "Use the Super Admin login at /super-admin/login" },
          403,
        ),
      );
    }

    const user = (await User.findOne({ email })) as UserDoc | null;
    if (user) {
      if (user.role === "SuperAdmin") {
        return withCors(
          request,
          jsonResponse(
            { error: "Use the Super Admin login at /super-admin/login" },
            403,
          ),
        );
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return withCors(request, jsonResponse({ error: "Invalid email or password" }, 401));
      }

      const restaurant = (await Restaurant.findById(user.restaurant)) as RestaurantDoc | null;
      if (!restaurant) {
        return withCors(
          request,
          jsonResponse({ error: "No restaurant linked to this account" }, 400),
        );
      }

      const token = signToken({
        userId: user._id.toString(),
        restaurantId: restaurant._id.toString(),
      });
      return withCors(
        request,
        jsonResponse(
          {
            user: serializeUser(user),
            restaurant: serializeRestaurant(restaurant),
          },
          200,
          [{ name: JWT_COOKIE_NAME, value: token, options: authCookieOptions(30 * 24 * 60 * 60) }],
        ),
      );
    }

    // Demo fallback: unknown restaurant credentials open the Spice Garden demo account.
    const demo = await ensureDemoAccount();
    const token = signToken({
      userId: demo.user._id.toString(),
      restaurantId: demo.restaurant._id.toString(),
    });

    return withCors(
      request,
      jsonResponse(
        {
          user: serializeUser(demo.user),
          restaurant: serializeRestaurant(demo.restaurant),
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
