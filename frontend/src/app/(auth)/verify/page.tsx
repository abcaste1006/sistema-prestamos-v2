"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api/client";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const id =
      searchParams.get("user_id") || localStorage.getItem("pending_user_id");
    if (id) {
      setUserId(id);
    } else {
      setError("No se encontró información de verificación");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Ingresa el código de 6 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/verify/", { user_id: userId, code });
      setSuccess(true);
      localStorage.removeItem("pending_user_id");
      localStorage.removeItem("pending_verification_email");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Código inválido o expirado");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      const email = localStorage.getItem("pending_verification_email");
      if (!email) {
        setError("No se encontró el correo para reenviar el código");
        return;
      }

      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setError("");
      alert("✅ Nuevo código enviado a tu correo");
    } catch (err: any) {
      setError(err.message || "Error al reenviar código");
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Cuenta verificada!
          </h2>
          <p className="text-gray-500 mb-4">
            Serás redirigido al login en 3 segundos.
          </p>
          <Link
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Ir al login ahora
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Verificación de Cuenta
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Ingresa el código de 6 dígitos que enviamos a tu correo.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              className="form-control text-center text-2xl tracking-widest"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn btn-primary w-full justify-center"
          >
            {loading ? "Verificando..." : "Verificar Cuenta"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Enviando..." : "Reenviar código"}
          </button>
        </div>

        <p className="text-center text-gray-500 mt-4 text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
