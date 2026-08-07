"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login/", form);
      const { access_token, user } = res.data;

      document.cookie = `auth_token=${access_token}; path=/; max-age=86400`;
      localStorage.setItem("user", JSON.stringify(user));

      if (user.is_admin) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 403 && detail?.includes("no autorizado")) {
        setError("Usuario no autorizado. Contacte al administrador.");
      } else if (status === 403 && detail?.includes("no verificado")) {
        setError("Usuario no verificado. Se ha enviado un nuevo código.");
        setTimeout(() => router.push("/verify"), 2000);
      } else {
        setError(detail || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Bienvenido</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="form-control"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center"
          >
            {loading ? "Iniciando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
