import axios from "axios";
import { API_URLS } from "./api_endpoints";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ACCESS_TOKEN_KEY = "accessToken";


export const getAccessToken   = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const setAccessToken   = (t) => localStorage.setItem(ACCESS_TOKEN_KEY, t);
export const clearAccessToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY);


export const apiClient = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true, // refresh token rides in an HttpOnly cookie
});

const decodeJwt = (token) => {
  try {
    const [, payloadB64] = String(token).split(".");
    if (!payloadB64) return null;
    // Normalise base64url → base64 for atob
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};


const EXPIRY_LEEWAY_SECONDS = 10;
const isTokenExpired = (token) => {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + EXPIRY_LEEWAY_SECONDS * 1000;
};


apiClient.interceptors.request.use(async (config) => {
  // Never inject or refresh on auth endpoints themselves.
  if (isAuthPath(config.url)) return config;

  let token = getAccessToken();
  if (token && isTokenExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch {
      // Let the request go out without a token; the response interceptor
      // will handle the resulting 401 and redirect to /login.
      token = null;
    }
  }
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


let refreshPromise = null;
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

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};


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

   
    if (isAuthPath(originalRequest.url) || originalRequest._retry) {
      clearAccessToken();
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
