"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api/client";
import AddToCartButton from "@/app/components/AddToCartButton";
import { formatDate } from "@/lib/utils/formatDate";

interface Equipment {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  serial_number?: string;
  specifications?: string;
}

interface Availability {
  available: boolean;
  reason?: string;
  start_date?: string;
  end_date?: string;
  pickup_time?: string;
  return_time?: string;
}

export default function EquipmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [selectedReturnTime, setSelectedReturnTime] = useState("");

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await api.get(`/equipment/${params.id}/`);
        setEquipment(res.data);
      } catch (error) {
        console.error("Error al cargar equipo:", error);
        router.push("/catalogo");
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [params.id, router]);

  const checkAvailability = async () => {
    if (!selectedDate) {
      alert("Selecciona una fecha para verificar disponibilidad");
      return;
    }

    setCheckingAvailability(true);
    try {
      const params = new URLSearchParams({
        equipment_id: equipment!.id,
        start_date: selectedDate,
        end_date: selectedDate,
      });

      if (selectedPickupTime) params.append("pickup_time", selectedPickupTime);
      if (selectedReturnTime) params.append("return_time", selectedReturnTime);

      const res = await api.get(
        `/equipment/availability/?${params.toString()}`,
      );

      if (res.data.availability) {
        setAvailability({
          available: res.data.availability.available,
          reason: res.data.availability.reason,
          start_date: res.data.availability.start_date,
          end_date: res.data.availability.end_date,
          pickup_time: res.data.availability.pickup_time,
          return_time: res.data.availability.return_time,
        });
      }
    } catch (error) {
      console.error("Error al verificar disponibilidad:", error);
      alert("Error al verificar disponibilidad del equipo");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-700">
            Equipo no encontrado
          </h3>
          <Link href="/catalogo" className="btn btn-primary mt-4">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/catalogo"
        className="text-sm text-gray-500 hover:text-blue-600 transition mb-4 inline-block"
      >
        ← Volver al catálogo
      </Link>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {equipment.name}
              </h1>
              <p className="text-gray-500">{equipment.category}</p>
            </div>
            <span
              className={`badge ${
                equipment.status === "AVAILABLE"
                  ? "badge-green"
                  : equipment.status === "LOANED"
                    ? "badge-yellow"
                    : equipment.status === "MAINTENANCE"
                      ? "badge-gray"
                      : "badge-red"
              }`}
            >
              {equipment.status === "AVAILABLE"
                ? "Disponible"
                : equipment.status === "LOANED"
                  ? "En préstamo"
                  : equipment.status === "MAINTENANCE"
                    ? "Mantenimiento"
                    : "Dañado"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Descripción
              </h3>
              <p className="text-gray-700">
                {equipment.description || "Sin descripción"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Especificaciones
              </h3>
              {equipment.specifications ? (
                <p className="text-gray-700 whitespace-pre-line">
                  {equipment.specifications}
                </p>
              ) : (
                <p className="text-gray-400">Sin especificaciones</p>
              )}
              {equipment.serial_number && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-medium">N° Serie:</span>{" "}
                  {equipment.serial_number}
                </p>
              )}
            </div>
          </div>

          {/* Verificador de disponibilidad */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="font-medium text-gray-700 mb-3">
              Verificar Disponibilidad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hora de retiro</label>
                <input
                  type="time"
                  value={selectedPickupTime}
                  onChange={(e) => setSelectedPickupTime(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hora de devolución</label>
                <input
                  type="time"
                  value={selectedReturnTime}
                  onChange={(e) => setSelectedReturnTime(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <button
              onClick={checkAvailability}
              disabled={checkingAvailability || !selectedDate}
              className="btn btn-primary mt-2"
            >
              {checkingAvailability
                ? "Verificando..."
                : "Verificar Disponibilidad"}
            </button>

            {availability && (
              <div
                className={`mt-4 p-4 rounded-xl ${
                  availability.available
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p
                  className={`font-medium ${availability.available ? "text-green-700" : "text-red-700"}`}
                >
                  {availability.available ? "✓ Disponible" : "✗ No disponible"}
                </p>
                {availability.reason && (
                  <p className="text-sm mt-1">{availability.reason}</p>
                )}
                {availability.available && availability.start_date && (
                  <p className="text-sm text-green-600 mt-1">
                    Disponible desde {availability.start_date}
                    {availability.end_date &&
                      availability.end_date !== availability.start_date &&
                      ` hasta ${availability.end_date}`}
                    {availability.pickup_time &&
                      ` a las ${availability.pickup_time}`}
                    {availability.return_time &&
                      ` hasta ${availability.return_time}`}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <AddToCartButton
              equipmentId={equipment.id}
              name={equipment.name}
              category={equipment.category}
            />
            <Link href="/catalogo" className="btn btn-outline">
              Ver otros equipos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
