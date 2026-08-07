"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api/client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    identification: "",
    password: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register/", form);
      localStorage.setItem("pending_user_id", res.data.user_id);
      localStorage.setItem("pending_verification_email", form.email);
      router.push(`/verify?user_id=${res.data.user_id}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(", "));
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Error al registrar usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">
            Regístrate para solicitar préstamos de equipos
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Nombres</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cédula</label>
            <input
              type="text"
              value={form.identification}
              onChange={(e) =>
                setForm({ ...form, identification: e.target.value })
              }
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo Institucional</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono (opcional)</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="form-control"
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
              minLength={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
