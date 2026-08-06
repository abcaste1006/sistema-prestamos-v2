import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

let isLoggingOut = false;

api.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];

  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          document.cookie = "auth_token=; path=/; max-age=0";
          localStorage.removeItem("user");
        } else {
          config.headers.Authorization = `Bearer ${token}`;
          const userStr = localStorage.getItem("user");
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              user.is_admin = payload.is_admin || false;
              user.user_id = payload.user_id || user.id;
              localStorage.setItem("user", JSON.stringify(user));
            } catch {
              // Ignorar
            }
          }
        }
      }
    } catch (e) {
      // Ignorar
    }
  }

  if (!config.headers.Authorization && typeof window !== "undefined") {
    const cachedUser = localStorage.getItem("user");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed.access_token) {
          config.headers.Authorization = `Bearer ${parsed.access_token}`;
        }
      } catch {
        // Ignorar
      }
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    // Si el backend indica que todos deben hacer logout
    if (response.data?.force_logout_all === true) {
      forceLogoutAll();
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 por mismatch de versión, forzar logout inmediato
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "list_version_mismatch"
    ) {
      forceLogoutAll();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Si es 401, intentar refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshRes = await api.post(
          "/auth/refresh/",
          {},
          { withCredentials: true },
        );

        const newAccess = refreshRes.data.access_token;
        if (newAccess) {
          const maxAge = 86400;
          document.cookie = `auth_token=${newAccess}; path=/; max-age=${maxAge}`;
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        forceLogoutAll();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    // Si es 403 con "Usuario no autorizado", NO forzar logout de todos
    if (
      error.response?.status === 403 &&
      error.response?.data?.detail?.includes("no autorizado")
    ) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

function forceLogoutAll() {
  if (isLoggingOut) return;
  isLoggingOut = true;

  document.cookie = "auth_token=; path=/; max-age=0";
  document.cookie = "refresh_token=; path=/; max-age=0";
  localStorage.removeItem("user");

  setTimeout(() => {
    isLoggingOut = false;
  }, 1000);
}

export default api;
