import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_KEY, { expiresIn: "7d" });

  const inProd        = process.env.NODE_ENV === "production";
  const httpsEnabled  = process.env.ENABLE_HTTPS === "true";   // flip to true later

  res.cookie("token", token, {
    httpOnly: true,
    secure: inProd && httpsEnabled,        // ✅ false right now, true after TLS
    sameSite: "Lax",                       // good until you split domains
    maxAge: 7 * 24 * 60 * 60 * 1000,       // ✅ lower-case g
    domain: process.env.COOKIE_DOMAIN || undefined,
  });

  return token;
};
