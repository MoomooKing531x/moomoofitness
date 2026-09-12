import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "session_token";
const SECRET = process.env.JWT_SECRET;

function signToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "30d" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

function setSessionCookie(userId) {
  const token = signToken(userId);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

function getUserIdFromCookies() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? payload.userId : null;
}

export {
  COOKIE_NAME,
  signToken,
  verifyToken,
  setSessionCookie,
  clearSessionCookie,
  getUserIdFromCookies,
};
