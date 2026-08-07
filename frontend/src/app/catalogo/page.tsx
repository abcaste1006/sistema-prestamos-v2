"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api/client";
import AddToCartButton from "@/app/components/AddToCartButton";

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [selectedReturnTime, setSelectedReturnTime] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/equipment/");
      const data = res.data.results || res.data || [];
      setEquipments(data);

      const uniqueCategories = Array.from(
        new Set(data.map((eq: Equipment) => eq.category)),
      );
      setCategories(uniqueCategories);
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

    setCheckingAvailability(true);
    try {
      const params = new URLSearchParams({
        equipment_id: equipmentId,
        start_date: selectedDate,
        end_date: selectedDate,
      });

      if (selectedPickupTime) params.append("pickup_time", selectedPickupTime);
      if (selectedReturnTime) params.append("return_time", selectedReturnTime);

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
    } finally {
      setCheckingAvailability(false);
    }
  };

  const checkAllAvailability = async () => {
    if (!selectedDate) {
      alert("Selecciona una fecha para verificar disponibilidad");
      return;
    }

    setAvailabilityChecked(false);
    setCheckingAvailability(true);

    for (const eq of equipments) {
      await checkAvailability(eq.id);
    }

    setAvailabilityChecked(true);
    setCheckingAvailability(false);
  };

  // FILTRADO DE EQUIPOS - MOVER AQUÍ
  const filtered = equipments.filter((eq) => {
    const matchSearch =
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || eq.category === category;
    return matchSearch && matchCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "badge-green";
      case "LOANED":
        return "badge-yellow";
      case "MAINTENANCE":
        return "badge-gray";
      case "DAMAGED":
        return "badge-red";
      default:
        return "badge-gray";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Disponible";
      case "LOANED":
        return "En prestamo";
      case "MAINTENANCE":
        return "Mantenimiento";
      case "DAMAGED":
        return "Dañado";
      default:
        return status;
    }
  };

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando catalogo...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros y búsqueda */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-group">
              <label className="form-label">Buscar equipo</label>
              <input
                type="text"
                placeholder="Nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-control"
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de disponibilidad</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                className="form-control"
              />
            </div>
            <div className="form-group flex items-end">
              <button
                onClick={checkAllAvailability}
                disabled={checkingAvailability || !selectedDate}
                className="btn btn-primary w-full justify-center"
              >
                {checkingAvailability
                  ? "Verificando..."
                  : "Verificar Disponibilidad"}
              </button>
            </div>
          </div>

          {selectedDate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="form-group">
                <label className="form-label">Hora de retiro (opcional)</label>
                <input
                  type="time"
                  value={selectedPickupTime}
                  onChange={(e) => setSelectedPickupTime(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Hora de devolución (opcional)
                </label>
                <input
                  type="time"
                  value={selectedReturnTime}
                  onChange={(e) => setSelectedReturnTime(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No se encontraron equipos
            </h3>
            <p className="text-gray-400 text-sm">
              Prueba con otros filtros o categorías
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((eq) => (
            <div
              key={eq.id}
              className="card hover:border-blue-300 transition-all duration-200"
            >
              <Link href={`/catalogo/${eq.id}`} className="block">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                      {eq.name}
                    </h3>
                    <span className={`badge ${getStatusBadge(eq.status)}`}>
                      {getStatusLabel(eq.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{eq.category}</p>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                    {eq.description || "Sin descripción"}
                  </p>

                  {/* Disponibilidad verificada */}
                  {eq.availability !== undefined && selectedDate && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {eq.availability.available ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Disponible para {selectedDate}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          No disponible: {eq.availability.reason || "Reservado"}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Ver detalles →
                    </span>
                    {eq.status === "AVAILABLE" && (
                      <span className="text-xs text-green-600 font-medium">
                        Disponible
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              {/* Botón de agregar al pedido - fuera del Link para evitar navegación */}
              <div className="px-4 pb-4">
                <AddToCartButton
                  equipmentId={eq.id}
                  name={eq.name}
                  category={eq.category}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
