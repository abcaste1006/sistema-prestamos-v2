"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import api from "@/lib/api/client";

interface AvailabilityResult {
  equipmentId: string;
  available: boolean;
  reason?: string;
}

export default function SolicitarPage() {
  const router = useRouter();
  const { items, clearCart, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState<
    AvailabilityResult[]
  >([]);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  const [form, setForm] = useState({
    pickup_date: "",
    return_date: "",
    pickup_time: "",
    return_time: "",
    terms_accepted: false,
    notes: "",
  });

  useEffect(() => {
    if (form.pickup_date && form.return_date && items.length > 0) {
      checkAvailability();
    }
  }, [
    form.pickup_date,
    form.return_date,
    form.pickup_time,
    form.return_time,
    items,
  ]);

  const checkAvailability = async () => {
    if (!form.pickup_date || !form.return_date) return;
    if (items.length === 0) return;

    setCheckingAvailability(true);
    setAvailabilityChecked(false);
    setAvailabilityResults([]);

    try {
      const results: AvailabilityResult[] = [];

      for (const item of items) {
        const params = new URLSearchParams({
          equipment_id: item.equipmentId,
          start_date: form.pickup_date,
          end_date: form.return_date,
        });

        if (form.pickup_time) params.append("pickup_time", form.pickup_time);
        if (form.return_time) params.append("return_time", form.return_time);

        const res = await api.get(
          `/equipment/availability/?${params.toString()}`,
        );

        results.push({
          equipmentId: item.equipmentId,
          available: res.data.availability?.available ?? false,
          reason: res.data.availability?.reason,
        });
      }

      setAvailabilityResults(results);
      setAvailabilityChecked(true);
    } catch (err) {
      console.error("Error al verificar disponibilidad:", err);
      setError("Error al verificar disponibilidad de los equipos");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const allAvailable = availabilityResults.every((r) => r.available);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("No hay equipos en el carrito");
      return;
    }

    if (!form.terms_accepted) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    await checkAvailability();

    if (!allAvailable) {
      setError(
        "Algunos equipos no están disponibles para las fechas seleccionadas",
      );
      return;
    }

    setLoading(true);

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
      const errorData = err.response?.data;
      if (errorData && typeof errorData === "object") {
        const messages = Object.values(errorData).flat().join(" ");
        setError(messages || "Error al crear la solicitud");
      } else if (errorData?.detail) {
        setError(errorData.detail);
      } else {
        setError("Error al crear la solicitud");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (equipmentId: string) => {
    removeItem(equipmentId);
    setAvailabilityChecked(false);
    setAvailabilityResults([]);
  };

  const today = new Date().toISOString().split("T")[0];

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card border-green-200 bg-green-50">
          <div className="card-body text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              ¡Solicitud enviada!
            </h2>
            <p className="text-green-700">
              Tu solicitud ha sido enviada correctamente. Espera la aprobación
              del administrador.
            </p>
            <p className="text-sm text-green-600 mt-4">
              Serás redirigido a tus préstamos en 3 segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Solicitar Préstamo
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario principal */}
        <div className="lg:col-span-2">
          <div className="card mb-4">
            <div className="card-header">
              <h3>Equipos seleccionados ({items.length})</h3>
            </div>
            <div className="card-body">
              {items.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No hay equipos en el carrito
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const availability = availabilityResults.find(
                      (r) => r.equipmentId === item.equipmentId,
                    );
                    const isAvailable = availability?.available ?? true;

                    return (
                      <li
                        key={item.equipmentId}
                        className="flex justify-between items-center border-b border-gray-100 pb-3"
                      >
                        <div>
                          <span className="font-medium text-gray-700">
                            {item.name}
                          </span>
                          <span className="text-sm text-gray-400 ml-2">
                            {item.category}
                          </span>
                          {availabilityChecked && (
                            <span
                              className={`ml-2 text-xs px-2 py-1 rounded ${
                                isAvailable
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isAvailable ? "✓ Disponible" : "✗ No disponible"}
                            </span>
                          )}
                          {availabilityChecked &&
                            !isAvailable &&
                            availability?.reason && (
                              <div className="text-xs text-red-600 mt-1">
                                {availability.reason}
                              </div>
                            )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.equipmentId)}
                          className="text-sm text-red-500 hover:text-red-700 transition"
                        >
                          Eliminar
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {availabilityChecked && items.length > 0 && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm ${
                    allAvailable
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {allAvailable
                    ? "✅ Todos los equipos están disponibles para las fechas seleccionadas"
                    : "❌ Algunos equipos no están disponibles para las fechas seleccionadas"}
                </div>
              )}
              {checkingAvailability && (
                <div className="mt-3 text-sm text-blue-600">
                  ⏳ Verificando disponibilidad...
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Fecha de retiro *</label>
                    <input
                      type="date"
                      value={form.pickup_date}
                      onChange={(e) => {
                        setForm({ ...form, pickup_date: e.target.value });
                        setAvailabilityChecked(false);
                      }}
                      className="form-control"
                      required
                      min={today}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de devolución *</label>
                    <input
                      type="date"
                      value={form.return_date}
                      onChange={(e) => {
                        setForm({ ...form, return_date: e.target.value });
                        setAvailabilityChecked(false);
                      }}
                      className="form-control"
                      required
                      min={form.pickup_date || today}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Hora de retiro *</label>
                    <input
                      type="time"
                      value={form.pickup_time}
                      onChange={(e) => {
                        setForm({ ...form, pickup_time: e.target.value });
                        setAvailabilityChecked(false);
                      }}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora de devolución *</label>
                    <input
                      type="time"
                      value={form.return_time}
                      onChange={(e) => {
                        setForm({ ...form, return_time: e.target.value });
                        setAvailabilityChecked(false);
                      }}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas adicionales</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className="form-control"
                    rows={3}
                    placeholder="Información adicional para el administrador"
                  />
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={form.terms_accepted}
                    onChange={(e) =>
                      setForm({ ...form, terms_accepted: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
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
                  disabled={
                    loading ||
                    items.length === 0 ||
                    (availabilityChecked && !allAvailable) ||
                    checkingAvailability
                  }
                  className="btn btn-primary w-full justify-center"
                >
                  {loading
                    ? "Enviando..."
                    : checkingAvailability
                      ? "Verificando disponibilidad..."
                      : availabilityChecked && !allAvailable
                        ? "Equipos no disponibles"
                        : "Enviar Solicitud"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Resumen lateral */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <div className="card-header">
              <h3>Resumen</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Equipos:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha retiro:</span>
                <span className="font-medium">{form.pickup_date || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha devolución:</span>
                <span className="font-medium">{form.return_date || "—"}</span>
              </div>
              {availabilityChecked && (
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Disponibilidad:</span>
                  <span
                    className={`font-medium ${allAvailable ? "text-green-600" : "text-red-600"}`}
                  >
                    {allAvailable ? "✓ Disponible" : "✗ No disponible"}
                  </span>
                </div>
              )}
              <hr className="border-gray-100" />
              <p className="text-xs text-gray-400">
                Recuerda que los equipos deben ser devueltos en las mismas
                condiciones en que fueron retirados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
