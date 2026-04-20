import axios from "axios";
import { API_URLS } from "./api_endpoints";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ACCESS_TOKEN_KEY = "accessToken";

// ─── Token helpers ───────────────────────────────────────────
export const getAccessToken   = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const setAccessToken   = (t) => localStorage.setItem(ACCESS_TOKEN_KEY, t);
export const clearAccessToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY);

// ─── Axios instance ──────────────────────────────────────────
export const apiClient = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true, // refresh token rides in an HttpOnly cookie
});

// Attach access token to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Refresh manager (single-flight) ─────────────────────────
/**
 * We share ONE in-flight refresh promise across all concurrent 401s so
 * only one POST /auth/refresh ever runs at a time. The promise is cleared
 * once settled so the next 401 can trigger a new refresh if needed.
 */
let refreshPromise = null;

/**
 * Calls the refresh endpoint using a RAW axios instance (bypassing our
 * response interceptor) so a 401 here cannot recurse back into itself.
 */
const runRefresh = async () => {
  const res = await axios.post(
    `${BASE_URL}${API_URLS.AUTH.REFRESH}`,
    {},
    { withCredentials: true },
  );
  // Server wraps payload as { success, statusCode, message, data: {...} }
  const token = res.data?.data?.accessToken ?? res.data?.accessToken;
  if (!token) throw new Error("Refresh response had no access token");
  setAccessToken(token);
  return token;
};

/**
 * Public: returns a promise that resolves to a fresh access token.
 * Callers can await this whenever they need to pre-emptively refresh
 * (e.g. on app boot when the existing token is expired).
 */
export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// ─── Response interceptor: 401 → refresh → retry once ────────
const isAuthPath = (url = "") => {
  const u = String(url);
  return (
    u.includes(API_URLS.AUTH.LOGIN)    ||
    u.includes(API_URLS.AUTH.REGISTER) ||
    u.includes(API_URLS.AUTH.REFRESH)  ||
    u.includes(API_URLS.AUTH.LOGOUT)
  );
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status          = error.response?.status;

    // Not a 401, or we don't have the original config to retry — give up.
    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    // Never try to refresh a token while calling an auth endpoint itself
    // (login / register / refresh / logout). A 401 there means bad creds
    // or expired refresh, and a second refresh won't help.
    if (isAuthPath(originalRequest.url) || originalRequest._retry) {
      clearAccessToken();
      // If it's a regular protected call that already retried, send user
      // back to login. Auth endpoints surface the error to their caller.
      if (!isAuthPath(originalRequest.url) && typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshErr) {
      clearAccessToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshErr);
    }
  },
);
