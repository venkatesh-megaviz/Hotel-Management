export function authCookieOptions(maxAge: number) {
  const isProduction = process.env.NODE_ENV === "production";
  const frontendUrl = process.env.FRONTEND_URL?.trim() ?? "";
  const sameSiteNone = isProduction && frontendUrl.startsWith("http") && !frontendUrl.includes("netlify.app");

  return {
    httpOnly: true,
    sameSite: sameSiteNone ? ("none" as const) : ("lax" as const),
    secure: isProduction,
    path: "/",
    maxAge,
  };
}
