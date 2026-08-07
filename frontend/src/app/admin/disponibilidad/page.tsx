"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/client";
import { formatDate } from "@/lib/utils/formatDate";

interface Equipment {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface AvailabilityDay {
  date: string;
  available: boolean;
  blocked: boolean;
  reserved: boolean;
}

const daysOfWeek = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default function AdminDisponibilidadPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState<AvailabilityDay[]>(
    [],
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEquipment) {
      fetchAvailability();
    }
  }, [selectedEquipment, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const equipmentsRes = await api.get("/equipment/");
      const equipmentsData =
        equipmentsRes.data.results || equipmentsRes.data || [];
      setEquipments(equipmentsData);
      if (equipmentsData.length > 0) {
        setSelectedEquipment(equipmentsData[0].id);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedEquipment) return;

    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const params = new URLSearchParams({
        equipment_id: selectedEquipment,
        start_date: startDateStr,
        end_date: endDateStr,
      });

      const res = await api.get(
        `/equipment/availability/?${params.toString()}`,
      );

      if (res.data.availability) {
        const availability: AvailabilityDay[] = [];
        for (const [date, data] of Object.entries(res.data.availability)) {
          availability.push({
            date,
            available: (data as any).available,
            blocked: (data as any).blocked,
            reserved: (data as any).reserved,
          });
        }
        setAvailabilityData(availability);
      }
    } catch (err) {
      console.error("Error al obtener disponibilidad:", err);
    }
  };

  const handleMonthChange = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  const getDayStatus = (day: AvailabilityDay) => {
    if (day.blocked) return "bg-red-100 text-red-800 border-red-300";
    if (day.reserved) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (day.available) return "bg-green-100 text-green-800 border-green-300";
    return "bg-gray-100 text-gray-400 border-gray-200";
  };

  const getDayLabel = (day: AvailabilityDay) => {
    if (day.blocked) return "Bloqueado";
    if (day.reserved) return "Reservado";
    if (day.available) return "Disponible";
    return "Sin información";
  };

  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const availability = availabilityData.find((d) => d.date === dateStr);
      days.push({ day: i, date: dateStr, availability: availability || null });
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Cargando panel de disponibilidad...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error}
        <button onClick={fetchData} className="ml-4 btn btn-sm btn-danger">
          Reintentar
        </button>
      </div>
    );
  }

  const days = getDaysInMonth();
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Panel de Disponibilidad
          </h2>
          <p className="text-sm text-gray-500">
            Visualiza la disponibilidad de equipos por fecha
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-outline">
          Actualizar
        </button>
      </div>

      {/* Selector de equipo y mes */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Equipo</label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="form-control"
              >
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => handleMonthChange(-1)}
                className="btn btn-outline btn-sm"
              >
                ◀
              </button>
              <span className="text-lg font-semibold text-gray-700">
                {monthNames[selectedMonth.getMonth()]}{" "}
                {selectedMonth.getFullYear()}
              </span>
              <button
                onClick={() => handleMonthChange(1)}
                className="btn btn-outline btn-sm"
              >
                ▶
              </button>
              <button
                onClick={() => setSelectedMonth(new Date())}
                className="btn btn-outline btn-sm"
              >
                Hoy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-sm text-gray-600">Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-600">Bloqueado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-sm text-gray-600">Sin información</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="card">
        <div className="card-body p-0">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-600"
              >
                {day}
              </div>
            ))}

            {days.map((day, index) => (
              <div
                key={index}
                className={`bg-white p-2 min-h-[80px] border-b border-r ${
                  day?.availability
                    ? getDayStatus(day.availability)
                    : "bg-gray-50"
                }`}
              >
                {day ? (
                  <>
                    <div className="text-sm font-medium text-gray-700">
                      {day.day}
                    </div>
                    {day.availability && (
                      <div className="text-xs mt-1">
                        <span className="font-medium">
                          {getDayLabel(day.availability)}
                        </span>
                        {day.availability.blocked && day.availability.date && (
                          <div className="text-xs text-red-600 mt-0.5">
                            Motivo: Bloqueado
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-300 text-center text-sm">-</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
