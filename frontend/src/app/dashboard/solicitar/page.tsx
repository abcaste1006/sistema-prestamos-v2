"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import api from "@/lib/api/client";

export default function SolicitarPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    pickup_date: "",
    return_date: "",
    pickup_time: "",
    return_time: "",
    terms_accepted: false,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (items.length === 0) {
      setError("No hay equipos en el carrito");
      setLoading(false);
      return;
    }

    if (!form.terms_accepted) {
      setError("Debes aceptar los términos y condiciones");
      setLoading(false);
      return;
    }

    const payload = {
      equipment_ids: items.map((i) => i.equipmentId),
      pickup_date: form.pickup_date,
      return_date: form.return_date,
      pickup_time: form.pickup_time,
      return_time: form.return_time,
      terms_accepted: form.terms_accepted,
      notes: form.notes,
    };

    try {
      const res = await api.post("/loans/", payload);
      if (res.status === 201) {
        setSuccess(true);
        clearCart();
        setTimeout(() => {
          router.push("/dashboard/mis-prestamos");
        }, 3000);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || d).join(", "));
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Error al crear la solicitud");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            ¡Solicitud enviada!
          </h2>
          <p className="text-green-700">
            Tu solicitud ha sido enviada correctamente. Espera la aprobación del
            administrador.
          </p>
          <p className="text-sm text-green-600 mt-4">
            Serás redirigido a tus préstamos en 3 segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Solicitar Préstamo</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resumen de equipos */}
        <div className="md:col-span-2">
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="font-semibold text-lg mb-3">
              Equipos seleccionados
            </h2>
            {items.length === 0 ? (
              <p className="text-gray-500">No hay equipos en el carrito</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.equipmentId}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {item.category}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 rounded-lg shadow space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha de retiro *
                </label>
                <input
                  type="date"
                  value={form.pickup_date}
                  onChange={(e) =>
                    setForm({ ...form, pickup_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha de devolución *
                </label>
                <input
                  type="date"
                  value={form.return_date}
                  onChange={(e) =>
                    setForm({ ...form, return_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min={
                    form.pickup_date || new Date().toISOString().split("T")[0]
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hora de retiro *
                </label>
                <input
                  type="time"
                  value={form.pickup_time}
                  onChange={(e) =>
                    setForm({ ...form, pickup_time: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hora de devolución *
                </label>
                <input
                  type="time"
                  value={form.return_time}
                  onChange={(e) =>
                    setForm({ ...form, return_time: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Notas adicionales
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Información adicional para el administrador"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={form.terms_accepted}
                onChange={(e) =>
                  setForm({ ...form, terms_accepted: e.target.checked })
                }
                className="mt-1"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                Acepto los{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  Términos y Condiciones
                </a>{" "}
                del préstamo de equipos.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar Solicitud"}
            </button>
          </form>
        </div>

        {/* Resumen lateral */}
        <div className="bg-white p-4 rounded-lg shadow h-fit">
          <h3 className="font-semibold text-lg mb-3">Resumen</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Equipos:</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha retiro:</span>
              <span className="font-medium">{form.pickup_date || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha devolución:</span>
              <span className="font-medium">{form.return_date || "—"}</span>
            </div>
            <hr className="my-2" />
            <p className="text-xs text-gray-500">
              Recuerda que los equipos deben ser devueltos en las mismas
              condiciones en que fueron retirados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
