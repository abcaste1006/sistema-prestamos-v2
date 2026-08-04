"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api/client";

interface Equipment {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  availability?: {
    available: boolean;
    reason?: string;
  };
}

export default function CatalogoPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  const normalizeEquipments = (payload: any): Equipment[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.results)) return payload.results;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  };
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [selectedReturnTime, setSelectedReturnTime] = useState("");

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      const res = await api.get("/equipment/");
      setEquipments(normalizeEquipments(res.data));
    } catch (error) {
      console.error("Error al cargar equipos:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (equipmentId: string) => {
    if (!selectedDate) {
      alert("Selecciona una fecha para verificar disponibilidad");
      return;
    }

    setAvailabilityLoading(true);
    try {
      const params = new URLSearchParams({
        equipment_id: equipmentId,
        start_date: selectedDate,
        end_date: selectedDate,
      });

      if (selectedPickupTime) {
        params.append("pickup_time", selectedPickupTime);
      }
      if (selectedReturnTime) {
        params.append("return_time", selectedReturnTime);
      }

      const res = await api.get(
        `/equipment/availability/?${params.toString()}`,
      );

      if (res.data.availability) {
        setEquipments((prev) =>
          prev.map((eq) =>
            eq.id === equipmentId
              ? {
                  ...eq,
                  availability: {
                    available: res.data.availability.available,
                    reason: res.data.availability.reason,
                  },
                }
              : eq,
          ),
        );
      }
    } catch (error) {
      console.error("Error al verificar disponibilidad:", error);
      alert("Error al verificar disponibilidad del equipo");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const filtered = equipments.filter((eq) => {
    const matchSearch =
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || eq.category === category;
    return matchSearch && matchCategory;
  });

  const categories = Array.from(new Set(equipments.map((eq) => eq.category)));

  // Obtener fecha mínima para el selector (hoy)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Catálogo de Equipos</h1>

      {/* Filtros y verificador de disponibilidad */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Buscar equipos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                // Verificar disponibilidad de todos los equipos
                setAvailabilityLoading(true);
                equipments.forEach((eq) => checkAvailability(eq.id));
              }}
              disabled={availabilityLoading || !selectedDate}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {availabilityLoading
                ? "Verificando..."
                : "Verificar Disponibilidad"}
            </button>
          </div>
        </div>

        {/* Horas opcionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Hora de retiro (opcional)
            </label>
            <input
              type="time"
              value={selectedPickupTime}
              onChange={(e) => setSelectedPickupTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Hora de devolución (opcional)
            </label>
            <input
              type="time"
              value={selectedReturnTime}
              onChange={(e) => setSelectedReturnTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Grid de equipos */}
      {loading ? (
        <p>Cargando...</p>
      ) : filtered.length === 0 ? (
        <p>No se encontraron equipos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((eq) => (
            <Link
              key={eq.id}
              href={`/catalogo/${eq.id}`}
              className="block border rounded-lg p-4 hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold">{eq.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{eq.category}</p>
              <p className="text-gray-500 text-sm mt-2">{eq.description}</p>

              {/* Estado del equipo */}
              <div className="mt-2">
                <span
                  className={`inline-block text-xs px-2 py-1 rounded ${
                    eq.status === "AVAILABLE"
                      ? "bg-green-100 text-green-800"
                      : eq.status === "LOANED"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {eq.status}
                </span>
              </div>

              {/* Disponibilidad verificada */}
              {eq.availability !== undefined && selectedDate && (
                <div className="mt-2">
                  {eq.availability.available ? (
                    <span className="text-xs text-green-600 font-medium">
                      ✅ Disponible para {selectedDate}
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">
                      ❌ No disponible: {eq.availability.reason || "Reservado"}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
