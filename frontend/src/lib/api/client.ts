import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];
  if (token) {
    // Intentar parsear el payload y validar expiración antes de usar el token
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));

        // Si el token está expirado, limpiar cookie y localStorage y evitar enviarlo
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          document.cookie = "auth_token=; path=/; max-age=0";
          localStorage.removeItem("user");
        } else {
          config.headers.Authorization = `Bearer ${token}`;

          // Actualizar roles/ids en localStorage si ya existe el usuario
          const userStr = localStorage.getItem("user");
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              user.is_admin = payload.is_admin || false;
              user.user_id = payload.user_id || user.id;
              localStorage.setItem("user", JSON.stringify(user));
            } catch {
              // Ignorar errores de parseo del almacenamiento local
            }
          }
        }
      } else {
        // Token no tiene formato JWT; enviarlo tal cual
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // En caso de error al parsear, evitar romper la petición pero no usar el token
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
        // Ignorar errores de parseo del almacenamiento local
      }
    }
  }

  return config;
});

export default api;

// Interceptor para refrescar token en caso de 401 por token expirado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        // Llamar al endpoint de refresh que usa cookie HttpOnly
        const refreshRes = await api.post(
          "/auth/refresh/",
          {},
          { withCredentials: true },
        );

        const newAccess = refreshRes.data.access_token;
        if (newAccess) {
          // Actualizar cookie auth_token con expiración según el token
          try {
            const parts = newAccess.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const maxAge = payload.exp
                ? Math.max(0, Math.floor(payload.exp - Date.now() / 1000))
                : 86400;
              document.cookie = `auth_token=${newAccess}; path=/; max-age=${maxAge}`;
            } else {
              document.cookie = `auth_token=${newAccess}; path=/; max-age=86400`;
            }
          } catch {
            document.cookie = `auth_token=${newAccess}; path=/; max-age=86400`;
          }

          // Reintentar la petición original con el nuevo access token
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (e) {
        // Falló refresh: limpiar estado y forzar login
        document.cookie = "auth_token=; path=/; max-age=0";
        localStorage.removeItem("user");
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
