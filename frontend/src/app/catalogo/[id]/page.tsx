"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api/client";
import AddToCartButton from "@/app/components/AddToCartButton";

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

  // Obtener fecha mínima para el selector (hoy)
  const today = new Date().toISOString().split("T")[0];

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!equipment) return <div className="p-8">Equipo no encontrado</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/catalogo"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Volver al catálogo
      </Link>

      <div className="border rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">{equipment.name}</h1>
        <p className="text-gray-600 mb-4">{equipment.category}</p>

        <div className="space-y-2 mb-6">
          <p>
            <strong>Estado:</strong> {equipment.status}
          </p>
          {equipment.serial_number && (
            <p>
              <strong>Número de serie:</strong> {equipment.serial_number}
            </p>
          )}
          {equipment.specifications && (
            <p>
              <strong>Especificaciones:</strong> {equipment.specifications}
            </p>
          )}
        </div>

        <p className="text-gray-700 mb-6">{equipment.description}</p>

        {/* Verificador de disponibilidad */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">Verificar Disponibilidad</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Hora de retiro
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
                Hora de devolución
              </label>
              <input
                type="time"
                value={selectedReturnTime}
                onChange={(e) => setSelectedReturnTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={checkAvailability}
            disabled={checkingAvailability || !selectedDate}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {checkingAvailability
              ? "Verificando..."
              : "Verificar Disponibilidad"}
          </button>

          {/* Resultado de disponibilidad */}
          {availability && (
            <div
              className={`mt-3 p-3 rounded-lg ${availability.available ? "bg-green-100" : "bg-red-100"}`}
            >
              <p
                className={`font-medium ${availability.available ? "text-green-800" : "text-red-800"}`}
              >
                {availability.available ? "✅ Disponible" : "❌ No disponible"}
              </p>
              {availability.reason && (
                <p className="text-sm mt-1">{availability.reason}</p>
              )}
              {availability.available && availability.start_date && (
                <p className="text-sm text-green-700 mt-1">
                  Disponible desde {availability.start_date} hasta{" "}
                  {availability.end_date || availability.start_date}
                  {availability.pickup_time &&
                    ` a las ${availability.pickup_time}`}
                  {availability.return_time &&
                    ` hasta ${availability.return_time}`}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <AddToCartButton
            equipmentId={equipment.id}
            name={equipment.name}
            category={equipment.category}
          />
          <Link
            href="/catalogo"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Ver otros equipos
          </Link>
        </div>
      </div>
    </div>
  );
}
