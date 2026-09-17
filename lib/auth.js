import crypto from "crypto";

const COOKIE_NAME = "larder_auth";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

function secret() {
  const s = process.env.AUTH_SECRET || process.env.LARDER_PASSWORD;
  if (!s) throw new Error("AUTH_SECRET (or LARDER_PASSWORD) is not set");
  return s;
}

export function sign(value) {
  const h = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${h}`;
}

export function verify(token) {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx === -1) return false;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function checkPassword(candidate) {
  const real = process.env.LARDER_PASSWORD;
  if (!real) throw new Error("LARDER_PASSWORD is not set");
  const a = Buffer.from(String(candidate || ""));
  const b = Buffer.from(String(real));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function authCookie() {
  const token = sign("josh");
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    },
  };
}

export { COOKIE_NAME };
