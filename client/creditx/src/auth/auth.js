import { redirect } from "@tanstack/react-router";
import {
  clearAccessToken,
  getAccessToken,
  refreshAccessToken,
} from "../../apiClient";

/**
 * Cheap local check: does the token we have in localStorage still have
 * a future `exp`? No network round-trip. Returns false for missing,
 * malformed, or expired tokens.
 */
export const isAccessTokenValid = () => {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return false;
    const payload = JSON.parse(atob(payloadB64));
    if (!payload?.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/**
 * Try to obtain a valid session for the current user.
 * - If the cached access token is still valid, we're done.
 * - Otherwise hit /auth/refresh (using the shared single-flight
 *   manager) to exchange the HttpOnly refresh cookie for a new token.
 * Returns true on success, false on failure.
 */
export const restoreSession = async () => {
  if (isAccessTokenValid()) return true;
  try {
    await refreshAccessToken();
    return isAccessTokenValid();
  } catch {
    clearAccessToken();
    return false;
  }
};

/**
 * Router guard: ensure the visitor is authenticated before a
 * protected route renders. Redirects to /login if not.
 */
export const requireAuth = async () => {
  const ok = await restoreSession();
  if (!ok) {
    throw redirect({ to: "/login" });
  }
};

/**
 * Router guard: bounce already-signed-in users away from /login and
 * /register. We only check the local token here — no network call — to
 * keep the guest routes snappy.
 */
export const requireGuest = () => {
  if (isAccessTokenValid()) {
    throw redirect({ to: "/dashboard" });
  }
};

// Backwards-compatible alias used elsewhere in the codebase
export const isAuthenticated = isAccessTokenValid;
