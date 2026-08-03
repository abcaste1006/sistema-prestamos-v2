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
    config.headers.Authorization = `Bearer ${token}`;

    // Extraer is_admin del token y actualizar localStorage
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.is_admin = payload.is_admin || false;
        user.user_id = payload.user_id || user.id;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (e) {
      // Ignorar errores de parseo (token inválido o no es JWT)
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
